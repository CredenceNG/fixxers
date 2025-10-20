import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { verifyWebhookSignature, verifyPayment, koboToNaira } from '@/lib/paystack';
import { recordPaymentReceived } from '@/lib/purse-transactions';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('x-paystack-signature');

    if (!signature) {
      console.error('No Paystack signature found in headers');
      return NextResponse.json({ error: 'No signature found' }, { status: 400 });
    }

    // Verify webhook signature
    const isValid = verifyWebhookSignature(body, signature);
    if (!isValid) {
      console.error('Invalid Paystack webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse the webhook event
    const event = JSON.parse(body);

    console.log('Paystack webhook event:', event.event);

    // Handle different event types
    switch (event.event) {
      case 'charge.success':
        await handleChargeSuccess(event.data);
        break;

      case 'transfer.success':
        await handleTransferSuccess(event.data);
        break;

      case 'transfer.failed':
        await handleTransferFailed(event.data);
        break;

      default:
        console.log(`Unhandled Paystack event type: ${event.event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Error processing Paystack webhook:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleChargeSuccess(data: any) {
  const reference = data.reference;

  console.log(`Processing successful charge for reference: ${reference}`);

  // Verify the payment with Paystack API
  const verificationResponse = await verifyPayment(reference);

  if (verificationResponse.data.status !== 'success') {
    console.error(`Payment verification failed for reference: ${reference}`);
    return;
  }

  // Find the payment in our database
  const payment = await prisma.payment.findUnique({
    where: { paystackReference: reference },
    include: {
      order: {
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
        },
      },
    },
  });

  if (!payment) {
    console.error(`Payment not found for reference: ${reference}`);
    return;
  }

  if (payment.status !== 'PENDING') {
    console.log(`Payment already processed for reference: ${reference}`);
    return;
  }

  const order = payment.order;
  if (!order) {
    console.error(`Order not found for payment: ${payment.id}`);
    return;
  }

  // Update payment status
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: 'HELD_IN_ESCROW',
      paidAt: new Date(),
    },
  });

  // Update order status
  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'PAID' },
  });

  // Process purse transactions - record payment and split into commission + escrow
  await recordPaymentReceived(order.id, payment.id, payment.amount);

  // Send confirmation email to client
  if (order.client.email && order.client.emailNotifications) {
    const serviceDescription = order.request
      ? `${order.request.subcategory?.category?.name} - ${order.request.subcategory?.name}`
      : order.gig?.title || 'Service';

    await sendEmail({
      to: order.client.email,
      subject: 'Payment Received - Fixers',
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Payment Received</h2>

  <p>Hello ${order.client.name || 'Customer'},</p>

  <p>We have received your payment of <strong>₦${payment.amount.toLocaleString()}</strong> for <strong>${serviceDescription}</strong>.</p>

  <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
    <p style="margin: 8px 0;"><strong>Order ID:</strong> ${order.id}</p>
    <p style="margin: 8px 0;"><strong>Amount Paid:</strong> ₦${payment.amount.toLocaleString()}</p>
    <p style="margin: 8px 0;"><strong>Payment Method:</strong> Paystack</p>
  </div>

  <p>Your service provider will be notified and will begin working on your request soon.</p>

  <p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/client/orders/${order.id}"
       style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      View Order Details
    </a>
  </p>

  <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
    Thank you for using Fixers!
  </p>
</div>
      `.trim(),
    });
  }

  // Create notification for fixer
  if (order.fixer) {
    await prisma.notification.create({
      data: {
        userId: order.fixerId,
        type: 'PAYMENT_RECEIVED',
        title: 'Payment Received for Order',
        message: `Payment of ₦${payment.amount.toLocaleString()} received for order ${order.id}`,
        link: `/fixer/orders/${order.id}`,
      },
    });
  }

  console.log(`Successfully processed payment for reference: ${reference}`);
}

async function handleTransferSuccess(data: any) {
  console.log('Transfer successful:', data.reference);
  // Handle successful payouts to fixers if needed
}

async function handleTransferFailed(data: any) {
  console.error('Transfer failed:', data.reference);
  // Handle failed payouts to fixers if needed
}
