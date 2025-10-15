import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendGigRejectionEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gigId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const roles = user?.roles || [];

    if (!user || !roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gigId } = await params;
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
      select: {
        status: true,
        sellerId: true,
        title: true,
        description: true,
        seller: {
          select: { email: true, name: true },
        },
      },
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
        description: `[REJECTED: ${reason}]\n\n${gig.description || ''}`,
      },
    });

    // Send rejection notification email
    if (gig.seller?.email) {
      await sendGigRejectionEmail(
        gig.seller.email,
        gig.seller.name || 'Fixer',
        gig.title,
        reason
      );
    }

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
