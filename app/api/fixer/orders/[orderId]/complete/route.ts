import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyJobCompleted } from '@/lib/notifications';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'FIXER') {
      return NextResponse.json({ error: 'Only fixers can complete orders' }, { status: 403 });
    }

    const { orderId } = await params;
    const body = await request.json();
    const { completionMessage } = body;

    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        request: {
          include: {
            client: true,
          },
        },
        fixer: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify this is the fixer's order
    if (order.fixerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if order can be completed
    if (order.status === 'COMPLETED') {
      return NextResponse.json({ error: 'Order is already completed' }, { status: 400 });
    }

    if (order.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Cannot complete a cancelled order' }, { status: 400 });
    }

    // Update order status to COMPLETED
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
        deliveryNote: completionMessage || null,
      },
    });

    console.log(`[Order Complete] Order ${orderId} marked as completed by fixer ${user.id}`);

    // Notify client that the job is completed
    try {
      await notifyJobCompleted(
        order.clientId,
        orderId,
        user.name || 'Your fixer'
      );
    } catch (error) {
      console.error('Failed to send job completion notification:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Order marked as completed successfully',
    });
  } catch (error) {
    console.error('Order completion error:', error);
    return NextResponse.json(
      { error: 'Failed to complete order. Please try again.' },
      { status: 500 }
    );
  }
}
