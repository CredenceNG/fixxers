import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ gigId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const roles = user?.roles || [];

    if (!user || !roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gigId } = await context.params;

    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
    });

    if (!gig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    }

    if (gig.status !== 'PAUSED') {
      return NextResponse.json(
        { error: 'Only paused gigs can be resumed' },
        { status: 400 }
      );
    }

    const updatedGig = await prisma.gig.update({
      where: { id: gigId },
      data: { status: 'ACTIVE' },
    });

    return NextResponse.json({
      success: true,
      message: 'Gig resumed successfully',
      gig: updatedGig,
    });
  } catch (error) {
    console.error('[Resume Gig] Error:', error);
    return NextResponse.json(
      { error: 'Failed to resume gig' },
      { status: 500 }
    );
  }
}
