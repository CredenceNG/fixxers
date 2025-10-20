import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendDisputeFiledEmail } from '@/lib/emails/dispute-emails';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;
    const body = await request.json();
    const { reason, description, evidence } = body;

    // Validate required fields
    if (!reason || !description) {
      return NextResponse.json(
        { error: 'Reason and description are required' },
        { status: 400 }
      );
    }

    // Verify the order exists and the user is part of it
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: true,
        fixer: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user is either the client or fixer on this order
    if (order.clientId !== user.id && order.fixerId !== user.id) {
      return NextResponse.json(
        { error: 'You are not authorized to dispute this order' },
        { status: 403 }
      );
    }

    // Check if order status allows disputes
    if (order.status === 'PENDING' || order.status === 'CANCELLED') {
      return NextResponse.json(
        { error: 'Cannot dispute orders in PENDING or CANCELLED status' },
        { status: 400 }
      );
    }

    // Check if a dispute already exists for this order
    const existingDispute = await prisma.dispute.findFirst({
      where: {
        orderId,
        status: { in: ['OPEN', 'UNDER_REVIEW', 'ESCALATED'] },
      },
    });

    if (existingDispute) {
      return NextResponse.json(
        { error: 'An active dispute already exists for this order' },
        { status: 400 }
      );
    }

    // Create the dispute
    const dispute = await prisma.dispute.create({
      data: {
        orderId,
        initiatedById: user.id,
        reason,
        description,
        evidence: evidence || [],
        status: 'OPEN',
      },
      include: {
        initiatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
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

    // Update order status to DISPUTED
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'DISPUTED' },
    });

    // Send email notifications
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010';
    const disputeUrl = `${baseUrl}/admin/disputes/${dispute.id}`;
    const orderUrl = `${baseUrl}/orders/${orderId}`;

    // Format the reason for display
    const reasonDisplay = reason.split('_').map((word: string) =>
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');

    // Send email to initiator (confirmation)
    if (dispute.initiatedBy.email) {
      try {
        await sendDisputeFiledEmail({
          to: dispute.initiatedBy.email,
          recipientName: dispute.initiatedBy.name || 'User',
          isInitiator: true,
          orderNumber: orderId,
          disputeReason: reasonDisplay,
          disputeDescription: description,
          initiatorName: dispute.initiatedBy.name || 'User',
          disputeUrl,
          orderUrl,
        });
      } catch (emailError) {
        console.error('Failed to send initiator email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Determine the other party
    const otherParty = order.clientId === user.id ? order.fixer : order.client;

    // Send email to the other party (notification)
    if (otherParty?.email) {
      try {
        await sendDisputeFiledEmail({
          to: otherParty.email,
          recipientName: otherParty.name || 'User',
          isInitiator: false,
          orderNumber: orderId,
          disputeReason: reasonDisplay,
          disputeDescription: description,
          initiatorName: dispute.initiatedBy.name || 'User',
          disputeUrl,
          orderUrl,
        });
      } catch (emailError) {
        console.error('Failed to send other party email:', emailError);
        // Don't fail the request if email fails
      }
    }

    // TODO: Send notification to admin
    // TODO: Create in-app notifications

    return NextResponse.json({
      success: true,
      dispute,
    });
  } catch (error) {
    console.error('Error creating dispute:', error);
    return NextResponse.json(
      { error: 'Failed to create dispute' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;

    // Verify the order exists and the user is part of it or is admin
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const isAdmin = user.roles?.includes('ADMIN');
    const isParty = order.clientId === user.id || order.fixerId === user.id;

    if (!isAdmin && !isParty) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get all disputes for this order
    const disputes = await prisma.dispute.findMany({
      where: { orderId },
      include: {
        initiatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
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
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ disputes });
  } catch (error) {
    console.error('Error fetching disputes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch disputes' },
      { status: 500 }
    );
  }
}
