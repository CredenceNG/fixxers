import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.roles?.includes('FIXER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;

    // Verify order belongs to user - works for both service request and gig orders
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { fixerId: true, status: true, gigId: true, requestId: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.fixerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only gig orders use the PENDING → IN_PROGRESS workflow
    // Service request orders go straight to IN_PROGRESS when quote is accepted
    if (!order.gigId) {
      return NextResponse.json(
        { error: 'This action is only available for gig orders' },
        { status: 400 }
      );
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending orders can be started' },
        { status: 400 }
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error starting order:', error);
    return NextResponse.json(
      { error: 'Failed to start order' },
      { status: 500 }
    );
  }
}
