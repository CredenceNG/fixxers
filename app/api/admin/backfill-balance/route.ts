import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const roles = user?.roles || [];

    if (!user || !roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 });
    }

    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.status !== 'SETTLED') {
      return NextResponse.json({ error: 'Order must be SETTLED' }, { status: 400 });
    }

    // Update fixer's purse balance
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
      message: `Balance of ₦${order.fixerAmount.toLocaleString()} added to fixer's purse`,
      amount: order.fixerAmount,
    });
  } catch (error) {
    console.error('Error backfilling balance:', error);
    return NextResponse.json(
      { error: 'Failed to backfill balance' },
      { status: 500 }
    );
  }
}
