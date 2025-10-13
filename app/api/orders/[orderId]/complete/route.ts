import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
        request: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify user is the buyer
    if (order.clientId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify order is already COMPLETED (ready for payment)
    if (order.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Order must be completed before payment can be processed' },
        { status: 400 }
      );
    }

    // Get payment intent ID from request body
    const body = await request.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Check if payment already exists for this order
    const existingPayment = await prisma.payment.findUnique({
      where: { orderId: order.id },
    });

    // If down payment exists, we need to update it with the final payment
    if (existingPayment && order.downPaymentPaid) {
      // Update existing payment record with final payment info
      await prisma.payment.update({
        where: { orderId: order.id },
        data: {
          stripePaymentId: paymentIntentId, // Update to final payment intent
          amount: order.totalAmount, // Update to full amount (down + final)
          status: 'HELD_IN_ESCROW',
          paidAt: new Date(),
        },
      });
    } else if (existingPayment) {
      // Full payment already recorded (no down payment case), just return success
      return NextResponse.json({
        success: true,
        message: 'Payment already recorded',
      });
    } else {
      // No existing payment - create new payment record
      // Calculate actual amount paid (considering down payment)
      let amountPaid = order.totalAmount;
      if (order.downPaymentPaid && order.downPaymentAmount) {
        amountPaid = order.totalAmount - order.downPaymentAmount;
      }

      // Create payment record with Stripe payment ID (held in escrow)
      await prisma.payment.create({
        data: {
          orderId: order.id,
          stripePaymentId: paymentIntentId,
          amount: amountPaid,
          status: 'HELD_IN_ESCROW',
          paidAt: new Date(),
        },
      });
    }

    // Update order status to PAID and create notifications in a transaction
    await prisma.$transaction(async (tx) => {
      // Update order status to PAID (payment received, held in escrow)
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'PAID',
          acceptedAt: new Date(),
        },
      });

      // Determine payment type for notifications
      const paymentType = order.downPaymentPaid ? 'final payment' : 'full payment';
      const amountPaid = order.downPaymentPaid && order.downPaymentAmount
        ? order.totalAmount - order.downPaymentAmount
        : order.totalAmount;

      // Get service title from order
      const serviceTitle = order.gig?.title || order.request?.title || 'Service';

      // Notify fixer - payment received and held in escrow
      await tx.notification.create({
        data: {
          userId: order.fixerId,
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Received!',
          message: `Client has paid ₦${amountPaid.toLocaleString()} ${paymentType} for "${serviceTitle}". Payment is held in escrow and will be released after admin approval.`,
          link: `/fixer/orders/${order.id}/view`,
        },
      });

      // Notify client - payment successful
      await tx.notification.create({
        data: {
          userId: order.clientId,
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Successful',
          message: `Your ${paymentType} of ₦${amountPaid.toLocaleString()} for "${serviceTitle}" has been processed. Funds are held in escrow until admin approves settlement.`,
          link: order.gigId ? `/client/orders/${order.id}` : `/client/requests/${order.requestId}`,
        },
      });

      // Notify admin - new payment to review
      const adminUsers = await tx.user.findMany({
        where: { role: 'ADMIN' },
      });

      for (const admin of adminUsers) {
        await tx.notification.create({
          data: {
            userId: admin.id,
            type: 'GENERAL',
            title: 'New Payment to Review',
            message: `${paymentType.charAt(0).toUpperCase() + paymentType.slice(1)} of ₦${amountPaid.toLocaleString()} received for order "${serviceTitle}". Please review and approve settlement.`,
            link: `/admin/orders/${order.id}`,
          },
        });
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Payment processed successfully',
    });
  } catch (error) {
    console.error('Error completing order:', error);
    return NextResponse.json(
      { error: 'Failed to complete order' },
      { status: 500 }
    );
  }
}
