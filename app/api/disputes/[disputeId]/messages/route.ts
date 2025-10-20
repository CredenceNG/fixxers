import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendDisputeMessageEmail } from '@/lib/emails/dispute-emails';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { disputeId } = await params;
    const body = await request.json();
    const { message, isAdminNote, attachments } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Verify the dispute exists
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            fixer: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    // Check authorization
    const isAdmin = user.roles?.includes('ADMIN');
    const isParty =
      dispute.order.clientId === user.id || dispute.order.fixerId === user.id;

    if (!isAdmin && !isParty) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only admins can create admin notes
    if (isAdminNote && !isAdmin) {
      return NextResponse.json(
        { error: 'Only admins can create admin notes' },
        { status: 403 }
      );
    }

    // Create the message
    const disputeMessage = await prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId: user.id,
        message,
        isAdminNote: isAdminNote || false,
        attachments: attachments || [],
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    // Send email notifications (not for admin notes)
    if (!isAdminNote) {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010';
      const disputeUrl = `${baseUrl}/admin/disputes/${disputeId}`;

      // Truncate message for preview
      const messagePreview = message.length > 100
        ? message.substring(0, 100) + '...'
        : message;

      // Determine who to notify
      const recipientsToNotify: Array<{ id: string; name: string | null; email: string | null }> = [];

      // Add client if sender is not client
      if (dispute.order.clientId !== user.id && dispute.order.client) {
        recipientsToNotify.push(dispute.order.client);
      }

      // Add fixer if sender is not fixer
      if (dispute.order.fixerId !== user.id && dispute.order.fixer) {
        recipientsToNotify.push(dispute.order.fixer);
      }

      // Send emails to all recipients
      for (const recipient of recipientsToNotify) {
        if (recipient.email) {
          try {
            await sendDisputeMessageEmail({
              to: recipient.email,
              recipientName: recipient.name || 'User',
              orderNumber: dispute.orderId,
              senderName: disputeMessage.sender.name || 'User',
              messagePreview,
              disputeUrl,
            });
          } catch (emailError) {
            console.error(`Failed to send message email to ${recipient.email}:`, emailError);
            // Don't fail the request if email fails
          }
        }
      }
    }

    // TODO: Create in-app notifications

    return NextResponse.json({
      success: true,
      message: disputeMessage,
    });
  } catch (error) {
    console.error('Error creating dispute message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { disputeId } = await params;

    // Verify the dispute exists and user has access
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        order: true,
      },
    });

    if (!dispute) {
      return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
    }

    const isAdmin = user.roles?.includes('ADMIN');
    const isParty =
      dispute.order.clientId === user.id || dispute.order.fixerId === user.id;

    if (!isAdmin && !isParty) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all messages (filter out admin notes for non-admins)
    const messages = await prisma.disputeMessage.findMany({
      where: {
        disputeId,
        ...(isAdmin ? {} : { isAdminNote: false }),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Error fetching dispute messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}
