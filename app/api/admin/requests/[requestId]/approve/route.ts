import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendRequestApprovalEmail } from '@/lib/email';

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

    // Update the service request to mark as approved and change status to APPROVED
    await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        adminApproved: true,
        status: 'APPROVED',
      },
    });

    // Send approval notification email
    if (serviceRequest.client?.email) {
      await sendRequestApprovalEmail(
        serviceRequest.client.email,
        serviceRequest.client.name || 'Client',
        serviceRequest.title,
        requestId
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Service request approved',
    });
  } catch (error) {
    console.error('Error approving service request:', error);
    return NextResponse.json(
      { error: 'Failed to approve service request' },
      { status: 500 }
    );
  }
}
