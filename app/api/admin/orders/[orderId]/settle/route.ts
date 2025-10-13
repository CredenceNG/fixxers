import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'ADMIN') {
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

    // Verify order is PAID
    if (order.status !== 'PAID') {
      return NextResponse.json(
        { error: 'Order must be in PAID status to settle' },
        { status: 400 }
      );
    }

    if (!order.payment) {
      return NextResponse.json(
        { error: 'No payment found for this order' },
        { status: 400 }
      );
    }

    // Update payment status to RELEASED
    await prisma.payment.update({
      where: { id: order.payment.id },
      data: {
        status: 'RELEASED',
        releasedAt: new Date(),
      },
    });

    // Update order status to SETTLED
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'SETTLED',
      },
    });

    // TODO: Update seller's wallet/balance
    // TODO: Send notification to seller about payment settlement

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
