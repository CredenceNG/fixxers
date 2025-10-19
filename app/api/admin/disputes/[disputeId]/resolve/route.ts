import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendDisputeResolvedEmail, sendDisputeStatusUpdateEmail } from '@/lib/emails/dispute-emails';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user || !user.roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { disputeId } = await params;
    const body = await request.json();
    const { status, resolution, refundAmount, releaseTo } = body;

    if (!status || !resolution) {
      return NextResponse.json(
        { error: 'Status and resolution are required' },
        { status: 400 }
      );
    }

    // Verify valid status
    if (!['RESOLVED', 'CLOSED', 'ESCALATED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Get the dispute
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: {
          include: {
            client: true,
            fixer: true,
            payment: true,
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    // Update the dispute
    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: {
        status,
        resolution,
        resolvedById: user.id,
        resolvedAt: new Date(),
      },
      include: {
        initiatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          include: {
            client: true,
            fixer: true,
          },
        },
      },
    });

    // Update order status based on resolution
    if (status === 'RESOLVED' || status === 'CLOSED') {
      await prisma.order.update({
        where: { id: dispute.orderId },
        data: { status: 'SETTLED' },
      });
    }

    // Handle payment adjustments if specified
    if (refundAmount && refundAmount > 0 && releaseTo) {
      // TODO: Implement refund/payment adjustment logic
      // This would involve:
      // 1. Processing refund to client if releaseTo === 'CLIENT'
      // 2. Releasing payment to fixer if releaseTo === 'FIXER'
      // 3. Partial refunds and releases
      console.log(`Payment adjustment: ${refundAmount} to ${releaseTo}`);
    }

    // Send email notifications
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010';
    const disputeUrl = `${baseUrl}/admin/disputes/${disputeId}`;
    const orderUrl = `${baseUrl}/orders/${dispute.orderId}`;

    // Format the dispute reason for display
    const reasonDisplay = dispute.reason.split('_').map((word: string) =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');

    // Send appropriate emails based on status
    if (status === 'RESOLVED' || status === 'CLOSED') {
      // Send resolution emails to both parties
      const recipients = [
        { user: updatedDispute.order.client, role: 'client' },
        { user: updatedDispute.order.fixer, role: 'fixer' },
      ];

      for (const { user: recipient } of recipients) {
        if (recipient?.email) {
          try {
            await sendDisputeResolvedEmail({
              to: recipient.email,
              recipientName: recipient.name || 'User',
              orderNumber: dispute.order.orderNumber || dispute.orderId,
              disputeReason: reasonDisplay,
              resolution,
              finalStatus: status,
              refundAmount: refundAmount && refundAmount > 0 ? refundAmount : undefined,
              disputeUrl,
              orderUrl,
            });
          } catch (emailError) {
            console.error(`Failed to send resolution email to ${recipient.email}:`, emailError);
            // Don't fail the request if email fails
          }
        }
      }
    } else if (status === 'ESCALATED' || status === 'UNDER_REVIEW') {
      // Send status update emails to both parties
      const recipients = [
        { user: updatedDispute.order.client, role: 'client' },
        { user: updatedDispute.order.fixer, role: 'fixer' },
      ];

      for (const { user: recipient } of recipients) {
        if (recipient?.email) {
          try {
            await sendDisputeStatusUpdateEmail({
              to: recipient.email,
              recipientName: recipient.name || 'User',
              orderNumber: dispute.order.orderNumber || dispute.orderId,
              oldStatus: dispute.status,
              newStatus: status,
              disputeUrl,
            });
          } catch (emailError) {
            console.error(`Failed to send status update email to ${recipient.email}:`, emailError);
            // Don't fail the request if email fails
          }
        }
      }
    }

    // TODO: Create in-app notifications

    return NextResponse.json({
      success: true,
      dispute: updatedDispute,
    });
  } catch (error) {
    console.error('Error resolving dispute:', error);
    return NextResponse.json(
      { error: 'Failed to resolve dispute' },
      { status: 500 }
    );
  }
}
