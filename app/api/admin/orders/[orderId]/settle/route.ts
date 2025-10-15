import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const roles = user?.roles || [];

    if (!user || !roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;

    // Fetch the order with payment
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        fixer: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify order is PAID or already SETTLED (for idempotency)
    if (order.status !== 'PAID' && order.status !== 'SETTLED') {
      return NextResponse.json(
        { error: 'Order must be in PAID or SETTLED status' },
        { status: 400 }
      );
    }

    // If already settled, just ensure balance is updated
    if (order.status === 'SETTLED') {
      await prisma.purse.upsert({
        where: {
          userId: order.fixerId,
        },
        create: {
          userId: order.fixerId,
          availableBalance: order.fixerAmount,
          pendingBalance: 0,
          commissionBalance: 0,
          totalRevenue: order.fixerAmount,
        },
        update: {
          availableBalance: { increment: order.fixerAmount },
          totalRevenue: { increment: order.fixerAmount },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Balance updated for already settled order',
        sellerAmount: order.fixerAmount,
      });
    }

    if (!order.payment) {
      return NextResponse.json(
        { error: 'No payment found for this order' },
        { status: 400 }
      );
    }

    const paymentId = order.payment.id;

    await prisma.$transaction(async (tx) => {
      // Update payment status to RELEASED
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
        },
      });

      // Update order status to SETTLED
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'SETTLED',
        },
      });

      // Update fixer's purse balance
      await tx.purse.upsert({
        where: {
          userId: order.fixerId,
        },
        create: {
          userId: order.fixerId,
          availableBalance: order.fixerAmount,
          pendingBalance: 0,
          commissionBalance: 0,
          totalRevenue: order.fixerAmount,
        },
        update: {
          availableBalance: { increment: order.fixerAmount },
          totalRevenue: { increment: order.fixerAmount },
        },
      });

      // Send notification to fixer about payment settlement
      await tx.notification.create({
        data: {
          userId: order.fixerId,
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Settled',
          message: `Your payment of ₦${order.fixerAmount.toLocaleString()} has been settled and added to your purse.`,
          link: '/fixer/purse',
        },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Payment settled successfully',
      sellerAmount: order.fixerAmount,
    });
  } catch (error) {
    console.error('Error settling payment:', error);
    return NextResponse.json(
      { error: 'Failed to settle payment' },
      { status: 500 }
    );
  }
}
