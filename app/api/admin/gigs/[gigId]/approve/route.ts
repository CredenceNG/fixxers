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

    // Check if gig exists
    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      select: { status: true },
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
