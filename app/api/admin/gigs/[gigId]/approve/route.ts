import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendGigApprovalEmail } from '@/lib/email';

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

    // Check if gig exists
    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      select: {
        status: true,
        title: true,
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
        { error: 'Only gigs pending review can be approved' },
        { status: 400 }
      );
    }

    // Approve gig
    const updatedGig = await prisma.gig.update({
      where: { id: gigId },
      data: { status: 'ACTIVE' },
    });

    // Send approval notification email
    if (gig.seller?.email) {
      await sendGigApprovalEmail(
        gig.seller.email,
        gig.seller.name || 'Fixer',
        gig.title,
        gigId
      );
    }

    return NextResponse.json({
      success: true,
      gig: updatedGig,
    });
  } catch (error) {
    console.error('Error approving gig:', error);
    return NextResponse.json(
      { error: 'Failed to approve gig' },
      { status: 500 }
    );
  }
}
