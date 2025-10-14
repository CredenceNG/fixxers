import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.roles?.includes('CLIENT')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await params;

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        order: true,
      },
    });

    if (!serviceRequest) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
    }

    // Verify the client owns this request
    if (serviceRequest.clientId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if request can be cancelled
    if (serviceRequest.status === 'CANCELLED') {
      return NextResponse.json({ error: 'Request is already cancelled' }, { status: 400 });
    }

    if (serviceRequest.status === 'ACCEPTED' && serviceRequest.order) {
      return NextResponse.json(
        { error: 'Cannot cancel request that has been accepted and has an active order' },
        { status: 400 }
      );
    }

    // Update the service request status to CANCELLED
    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'CANCELLED',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Service request cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling service request:', error);
    return NextResponse.json(
      { error: 'Failed to cancel service request' },
      { status: 500 }
    );
  }
}
