import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { gigId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gigId } = params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json(
        { error: 'Rejection reason is required' },
        { status: 400 }
      );
    }

    // Check if gig exists
    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      select: { status: true, sellerId: true },
    });

    if (!gig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    }

    if (gig.status !== 'PENDING_REVIEW') {
      return NextResponse.json(
        { error: 'Only gigs pending review can be rejected' },
        { status: 400 }
      );
    }

    // Reject gig by setting it to DRAFT with rejection reason
    const updatedGig = await prisma.gig.update({
      where: { id: gigId },
      data: {
        status: 'DRAFT',
        // Store rejection reason in a way the fixer can see it
        // You might want to add a rejectionReason field to the Gig model
        // For now, we'll prepend it to the description
        description: `[REJECTED: ${reason}]\n\n${await prisma.gig.findUnique({ where: { id: gigId }, select: { description: true } }).then(g => g?.description || '')}`,
      },
    });

    // TODO: Send notification to fixer about rejection
    // This could be via email or in-app notification

    return NextResponse.json({
      success: true,
      gig: updatedGig,
    });
  } catch (error) {
    console.error('Error rejecting gig:', error);
    return NextResponse.json(
      { error: 'Failed to reject gig' },
      { status: 500 }
    );
  }
}
