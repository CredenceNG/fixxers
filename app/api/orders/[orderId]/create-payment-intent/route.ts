import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireStripe } from '@/lib/stripe';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;

    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        fixer: true,
        client: true,
        gig: true,
        request: {
          include: {
            subcategory: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify user is the buyer
    if (order.clientId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify order is in COMPLETED status
    if (order.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Order must be completed before payment' },
        { status: 400 }
      );
    }

    // Calculate remaining amount (subtract down payment if already paid)
    let amountToPay = order.totalAmount;
    if (order.downPaymentPaid && order.downPaymentAmount) {
      amountToPay = order.totalAmount - order.downPaymentAmount;
    }

    // Create Stripe PaymentIntent
    const stripe = requireStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amountToPay * 100), // Convert to kobo (cents)
      currency: 'ngn',
      metadata: {
        orderId: order.id,
        buyerId: order.clientId,
        sellerId: order.fixerId,
        gigTitle: order.gig?.title || order.request?.title || 'Service',
        isRemainingPayment: order.downPaymentPaid ? 'true' : 'false',
      },
      description: `Payment for: ${order.gig?.title || order.request?.title || 'Service'}${order.downPaymentPaid ? ' (Final Payment)' : ''}`,
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
