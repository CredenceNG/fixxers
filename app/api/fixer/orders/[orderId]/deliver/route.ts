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
    const body = await request.json();
    const { deliveryNote, deliveryFiles } = body;

    if (!deliveryNote || !deliveryNote.trim()) {
      return NextResponse.json(
        { error: 'Delivery note is required' },
        { status: 400 }
      );
    }

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

    // Only gig orders use the deliver workflow with delivery notes
    // Service request orders use the simpler complete endpoint
    if (!order.gigId) {
      return NextResponse.json(
        { error: 'This action is only available for gig orders' },
        { status: 400 }
      );
    }

    if (order.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Only in-progress orders can be delivered' },
        { status: 400 }
      );
    }

    // Update order with delivery
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        deliveryNote: deliveryNote.trim(),
        deliveryFiles: deliveryFiles || [],
        deliveredAt: new Date(),
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error delivering order:', error);
    return NextResponse.json(
      { error: 'Failed to deliver order' },
      { status: 500 }
    );
  }
}
