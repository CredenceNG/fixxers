import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const revisionSchema = z.object({
  note: z.string().min(10, 'Please provide detailed feedback (at least 10 characters)'),
});

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
    const body = await request.json();
    const validated = revisionSchema.parse(body);

    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify user is the buyer
    if (order.clientId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify order is completed
    if (order.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Only completed orders can request revision' },
        { status: 400 }
      );
    }

    // Check revisions remaining
    if (order.revisionsUsed >= order.revisionsAllowed) {
      return NextResponse.json(
        { error: 'No revisions remaining for this order' },
        { status: 400 }
      );
    }

    // Update order to request revision
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'IN_PROGRESS',
        revisionRequested: true,
        revisionNote: validated.note,
        revisionsUsed: order.revisionsUsed + 1,
        deliveryNote: null, // Clear previous delivery note
      },
    });

    // TODO: Send notification to seller about revision request

    return NextResponse.json({
      success: true,
      message: 'Revision requested successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error requesting revision:', error);
    return NextResponse.json(
      { error: 'Failed to request revision' },
      { status: 500 }
    );
  }
}
