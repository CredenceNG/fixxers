import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Stripe from "stripe";
import {
  sendPaymentConfirmationEmail,
  sendPaymentFailureEmail,
  sendRefundNotificationEmail,
} from "@/lib/emails/badge-payment-emails";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      return NextResponse.json(
        { error: "Missing stripe-signature header" },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 400 }
      );
    }

    // Handle the event
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;

      case "charge.refunded":
        await handleRefund(event.data.object as Stripe.Charge);
        break;

      case "payment_intent.canceled":
        await handlePaymentCanceled(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id;

  // Find badge request by payment reference
  const badgeRequest = await prisma.badgeRequest.findFirst({
    where: { paymentRef: paymentIntentId },
    include: { fixer: true, badge: true },
  });

  if (!badgeRequest) {
    console.error(`Badge request not found for payment: ${paymentIntentId}`);
    return;
  }

  // Update badge request payment status
  await prisma.badgeRequest.update({
    where: { id: badgeRequest.id },
    data: {
      paymentStatus: "PAID",
      status: "PAYMENT_RECEIVED",
      paidAt: new Date(),
    },
  });

  console.log(
    `Payment confirmed for badge request ${badgeRequest.id} (${badgeRequest.badge.name})`
  );

  // Send email notification to fixer confirming payment
  try {
    await sendPaymentConfirmationEmail({
      to: badgeRequest.fixer.email!,
      fixerName: badgeRequest.fixer.name || "Fixer",
      badgeName: badgeRequest.badge.name,
      amount: badgeRequest.paymentAmount,
      requestId: badgeRequest.id,
    });
  } catch (emailError) {
    console.error("Failed to send payment confirmation email:", emailError);
  }

  // Send notification to admin that request is ready for review
  try {
    await prisma.notification.create({
      data: {
        userId: (await prisma.user.findFirst({ where: { roles: { has: 'ADMIN' } } }))?.id || '',
        type: 'BADGE_PAYMENT_RECEIVED',
        title: 'Badge Payment Received',
        message: `${badgeRequest.fixer.name || 'A fixer'} completed payment for ${badgeRequest.badge.name} badge. Request is ready for review.`,
        link: `/admin/badges/requests/${badgeRequest.id}`,
      },
    });
  } catch (notificationError) {
    console.error("Failed to create admin notification:", notificationError);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id;

  const badgeRequest = await prisma.badgeRequest.findFirst({
    where: { paymentRef: paymentIntentId },
    include: { fixer: true, badge: true },
  });

  if (!badgeRequest) {
    console.error(
      `Badge request not found for failed payment: ${paymentIntentId}`
    );
    return;
  }

  // Track failed payment attempts
  const failedAttempts = (badgeRequest.metadata as any)?.failedPaymentAttempts || 0;
  const newFailedAttempts = failedAttempts + 1;
  const maxFailedAttempts = 3;

  console.log(
    `Payment failed for badge request ${badgeRequest.id}: ${paymentIntent.last_payment_error?.message} (Attempt ${newFailedAttempts}/${maxFailedAttempts})`
  );

  // Update failed attempts count
  await prisma.badgeRequest.update({
    where: { id: badgeRequest.id },
    data: {
      metadata: {
        ...(badgeRequest.metadata as object || {}),
        failedPaymentAttempts: newFailedAttempts,
        lastFailedAt: new Date().toISOString(),
      },
    },
  });

  // Send email notification to fixer about payment failure
  try {
    await sendPaymentFailureEmail({
      to: badgeRequest.fixer.email!,
      fixerName: badgeRequest.fixer.name || "Fixer",
      badgeName: badgeRequest.badge.name,
      errorMessage: paymentIntent.last_payment_error?.message,
      requestId: badgeRequest.id,
    });
  } catch (emailError) {
    console.error("Failed to send payment failure email:", emailError);
  }

  // Auto-expire request after max failed attempts
  if (newFailedAttempts >= maxFailedAttempts) {
    await prisma.badgeRequest.update({
      where: { id: badgeRequest.id },
      data: {
        status: 'EXPIRED',
        metadata: {
          ...(badgeRequest.metadata as object || {}),
          failedPaymentAttempts: newFailedAttempts,
          expiredAt: new Date().toISOString(),
          expiredReason: 'Maximum payment attempts exceeded',
        },
      },
    });
    console.log(`Badge request ${badgeRequest.id} auto-expired after ${maxFailedAttempts} failed payment attempts`);
  }
}

/**
 * Handle refund
 */
async function handleRefund(charge: Stripe.Charge) {
  const paymentIntentId = charge.payment_intent as string;

  if (!paymentIntentId) {
    console.error("Charge has no associated payment intent");
    return;
  }

  const badgeRequest = await prisma.badgeRequest.findFirst({
    where: { paymentRef: paymentIntentId },
    include: { fixer: true, badge: true },
  });

  if (!badgeRequest) {
    console.error(`Badge request not found for refund: ${paymentIntentId}`);
    return;
  }

  // Update payment status to REFUNDED
  await prisma.badgeRequest.update({
    where: { id: badgeRequest.id },
    data: {
      paymentStatus: "REFUNDED",
    },
  });

  console.log(`Refund processed for badge request ${badgeRequest.id}`);

  // Send email notification to fixer about refund
  try {
    await sendRefundNotificationEmail({
      to: badgeRequest.fixer.email!,
      fixerName: badgeRequest.fixer.name || "Fixer",
      badgeName: badgeRequest.badge.name,
      amount: badgeRequest.paymentAmount,
      reason: badgeRequest.rejectionReason || undefined,
    });
  } catch (emailError) {
    console.error("Failed to send refund notification email:", emailError);
  }
}

/**
 * Handle canceled payment
 */
async function handlePaymentCanceled(paymentIntent: Stripe.PaymentIntent) {
  const paymentIntentId = paymentIntent.id;

  const badgeRequest = await prisma.badgeRequest.findFirst({
    where: { paymentRef: paymentIntentId },
  });

  if (!badgeRequest) {
    console.error(
      `Badge request not found for canceled payment: ${paymentIntentId}`
    );
    return;
  }

  // Update request status to CANCELLED
  await prisma.badgeRequest.update({
    where: { id: badgeRequest.id },
    data: {
      status: 'CANCELLED',
      paymentStatus: 'CANCELLED',
      metadata: {
        ...(badgeRequest.metadata as object || {}),
        cancelledAt: new Date().toISOString(),
        cancelledReason: 'Payment cancelled by user',
      },
    },
  });

  console.log(`Payment canceled for badge request ${badgeRequest.id} - request marked as CANCELLED`);

  // Send notification to fixer about cancellation
  try {
    const fixer = await prisma.user.findUnique({
      where: { id: badgeRequest.fixerId },
      select: { email: true, name: true },
    });

    if (fixer?.email) {
      await prisma.notification.create({
        data: {
          userId: badgeRequest.fixerId,
          type: 'BADGE_PAYMENT_CANCELLED',
          title: 'Badge Payment Cancelled',
          message: 'Your badge payment was cancelled. You can retry the payment from your badge requests page.',
          link: `/fixer/badges`,
        },
      });
    }
  } catch (notificationError) {
    console.error("Failed to send cancellation notification:", notificationError);
  }
}
