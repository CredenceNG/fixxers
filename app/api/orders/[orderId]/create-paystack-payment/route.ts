import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { initializePayment, generateReference, nairaToKobo } from '@/lib/paystack';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;

    // Fetch the order with all necessary relations
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        fixer: true,
        request: {
          include: {
            subcategory: {
              include: {
                category: true,
              },
            },
          },
        },
        gig: {
          include: {
            subcategory: {
              include: {
                category: true,
              },
            },
          },
        },
        package: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify the user is the client for this order
    if (order.clientId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized to pay for this order' }, { status: 403 });
    }

    // Check if order already has a payment
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId: order.id },
    });

    if (existingPayment && existingPayment.status !== 'PENDING') {
      return NextResponse.json({ error: 'Order already has a payment' }, { status: 400 });
    }

    // Generate unique reference
    const reference = generateReference('ORDER');

    // Get client email
    const clientEmail = order.client.email || user.email;
    if (!clientEmail) {
      return NextResponse.json(
        { error: 'Client email is required for Paystack payment' },
        { status: 400 }
      );
    }

    // Get service description
    const serviceDescription = order.request
      ? `${order.request.subcategory?.category?.name} - ${order.request.subcategory?.name}`
      : order.gig
      ? order.gig.title
      : 'Service';

    // Initialize Paystack payment
    const paystackResponse = await initializePayment({
      email: clientEmail,
      amount: nairaToKobo(order.totalAmount), // Convert NGN to kobo
      reference,
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/client/orders/${order.id}?payment=success`,
      metadata: {
        orderId: order.id,
        clientId: order.clientId,
        fixerId: order.fixerId,
        serviceDescription,
        custom_fields: [
          {
            display_name: 'Order ID',
            variable_name: 'order_id',
            value: order.id,
          },
          {
            display_name: 'Service',
            variable_name: 'service',
            value: serviceDescription,
          },
        ],
      },
    });

    // Create or update payment record
    const payment = existingPayment
      ? await prisma.payment.update({
          where: { id: existingPayment.id },
          data: {
            provider: 'PAYSTACK',
            paystackReference: reference,
            amount: order.totalAmount,
            status: 'PENDING',
          },
        })
      : await prisma.payment.create({
          data: {
            orderId: order.id,
            provider: 'PAYSTACK',
            paystackReference: reference,
            amount: order.totalAmount,
            status: 'PENDING',
          },
        });

    return NextResponse.json({
      paymentId: payment.id,
      reference,
      authorization_url: paystackResponse.data.authorization_url,
      access_code: paystackResponse.data.access_code,
    });
  } catch (error: any) {
    console.error('Error creating Paystack payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment' },
      { status: 500 }
    );
  }
}
