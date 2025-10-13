import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await params;

    // Verify user is part of this request
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        quotes: {
          where: { isAccepted: true },
          select: { fixerId: true },
        },
      },
    });

    if (!serviceRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Check if user is client or fixer involved in this request
    const acceptedQuote = serviceRequest.quotes[0];
    const isClient = serviceRequest.clientId === user.id;
    const isFixer = acceptedQuote && acceptedQuote.fixerId === user.id;

    if (!isClient && !isFixer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Fetch all messages for this request
    const messages = await prisma.requestMessage.findMany({
      where: { requestId },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Mark unread messages as read
    await prisma.requestMessage.updateMany({
      where: {
        requestId,
        senderId: { not: user.id },
        isRead: false,
      },
      data: { isRead: true },
    });

    return NextResponse.json({
      success: true,
      messages,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { requestId } = await params;
    const body = await request.json();
    const { message } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400 });
    }

    // Verify user is part of this request
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        quotes: {
          where: { isAccepted: true },
          select: { fixerId: true },
        },
      },
    });

    if (!serviceRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Check if user is client or fixer involved in this request
    const acceptedQuote = serviceRequest.quotes[0];
    const isClient = serviceRequest.clientId === user.id;
    const isFixer = acceptedQuote && acceptedQuote.fixerId === user.id;

    if (!isClient && !isFixer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create message
    const newMessage = await prisma.requestMessage.create({
      data: {
        requestId,
        senderId: user.id,
        message: message.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            role: true,
          },
        },
      },
    });

    // Create notification for the other party
    const recipientId = isClient ? acceptedQuote?.fixerId : serviceRequest.clientId;

    if (recipientId) {
      await prisma.notification.create({
        data: {
          userId: recipientId,
          type: 'QUOTE_ACCEPTED', // Reusing existing type, ideally would be MESSAGE_RECEIVED
          title: 'New Message',
          message: `${user.name || 'Someone'} sent you a message about "${serviceRequest.title}"`,
          link: `/client/requests/${requestId}`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: newMessage,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
