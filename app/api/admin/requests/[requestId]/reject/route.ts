import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendRequestRejectionEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const roles = user?.roles || [];

    if (!user || !roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await params;

    // Parse request body for rejection reason
    const body = await request.json();
    const reason = body.reason || 'Your service request did not meet our platform guidelines.';

    // Fetch the service request
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        client: {
          select: { email: true, name: true },
        },
      },
    });

    if (!serviceRequest) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
    }

    // Update the service request status to CANCELLED
    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status: 'CANCELLED',
      },
    });

    // Send rejection notification email
    if (serviceRequest.client?.email) {
      await sendRequestRejectionEmail(
        serviceRequest.client.email,
        serviceRequest.client.name || 'Client',
        serviceRequest.title,
        reason
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service request rejected',
    });
  } catch (error) {
    console.error('Error rejecting service request:', error);
    return NextResponse.json(
      { error: 'Failed to reject service request' },
      { status: 500 }
    );
  }
}
