import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireStripe } from '@/lib/stripe';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.roles?.includes('CLIENT')) {
      return NextResponse.json({ error: 'Only clients can confirm acceptance' }, { status: 403 });
    }

    const { quoteId } = await params;
    const body = await request.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID required' }, { status: 400 });
    }

    // Fetch the quote
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        request: {
          include: {
            subcategory: {
              include: {
                category: true,
              },
            },
            client: {
              select: {
                id: true,
                email: true,
                name: true,
                emailNotifications: true,
              },
            },
          },
        },
        fixer: {
          select: {
            id: true,
            email: true,
            name: true,
            emailNotifications: true,
          },
        },
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Verify this is the client's quote
    if (quote.request.clientId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify payment intent with Stripe
    const stripe = requireStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment has not succeeded yet' }, { status: 400 });
    }

    // Verify payment amount matches down payment
    const expectedAmount = Math.round((quote.downPaymentAmount || 0) * 100);
    if (paymentIntent.amount !== expectedAmount) {
      return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 });
    }

    // Create order and update quote in transaction
    let orderId: string = '';
    await prisma.$transaction(async (tx) => {
      // Mark quote as accepted
      await tx.quote.update({
        where: { id: quoteId },
        data: { isAccepted: true },
      });

      // Update request status
      await tx.serviceRequest.update({
        where: { id: quote.requestId },
        data: { status: 'ACCEPTED' },
      });

      // Calculate platform fee (15% of total amount)
      const platformFee = Math.round(quote.totalAmount * 0.15);
      const fixerAmount = quote.totalAmount - platformFee;

      // Create order
      const order = await tx.order.create({
        data: {
          requestId: quote.requestId,
          clientId: user.id,
          fixerId: quote.fixerId,
          quoteId: quote.id,
          totalAmount: quote.totalAmount,
          platformFee,
          fixerAmount,
          status: 'PENDING',
          downPaymentRequired: quote.requiresDownPayment,
          downPaymentAmount: quote.downPaymentAmount,
          downPaymentPaid: true, // Payment just succeeded
        },
      });

      orderId = order.id;

      // Create payment record for down payment
      await tx.payment.create({
        data: {
          orderId: orderId,
          amount: quote.downPaymentAmount || 0,
          stripePaymentId: paymentIntentId,
          status: 'HELD_IN_ESCROW',
          paidAt: new Date(),
        },
      });

      // Create notification for fixer
      await tx.notification.create({
        data: {
          userId: quote.fixerId,
          type: 'QUOTE_ACCEPTED',
          title: 'Quote Accepted with Down Payment!',
          message: `Client has accepted your quote and paid ₦${quote.downPaymentAmount?.toLocaleString()} down payment for "${quote.request.title}". You can now start the work.`,
          link: `/fixer/requests/${quote.requestId}`,
        },
      });
    });

    console.log(`[Quote Accepted] Quote ${quoteId} accepted with down payment by ${user.email || user.phone}`);

    // Send email notifications to both parties
    try {
      const { sendOrderCreatedEmailToFixer, sendOrderCreatedEmailToClient } = await import('@/lib/email');

      // Notify fixer
      if (quote.fixer.email && quote.fixer.emailNotifications) {
        await sendOrderCreatedEmailToFixer(
          quote.fixer.email,
          quote.fixer.name || 'Service Provider',
          quote.request.client.name || 'Client',
          quote.request.title,
          quote.totalAmount,
          orderId,
          false // isGigOrder
        );
      }

      // Notify client
      if (quote.request.client.email && quote.request.client.emailNotifications) {
        await sendOrderCreatedEmailToClient(
          quote.request.client.email,
          quote.request.client.name || 'Client',
          quote.fixer.name || 'Service Provider',
          quote.request.title,
          quote.totalAmount,
          orderId
        );
      }
    } catch (error) {
      console.error('Failed to send order notification emails:', error);
      // Don't fail the order creation if emails fail
    }

    return NextResponse.json({
      success: true,
      message: 'Quote accepted and down payment processed successfully',
    });
  } catch (error) {
    console.error('Quote acceptance confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm acceptance. Please try again.' },
      { status: 500 }
    );
  }
}
