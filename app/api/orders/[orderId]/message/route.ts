import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const messageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
});

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
    const validated = messageSchema.parse(body);

    // Fetch the order from unified Order table
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

    // Verify user is the client or fixer
    if (order.clientId !== user.id && order.fixerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Create message in database (unified Message table)
    const message = await prisma.message.create({
      data: {
        orderId,
        senderId: user.id,
        content: validated.message,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    // TODO: Send notification to receiver via email/SMS
    // TODO: Send real-time notification via Pusher

    return NextResponse.json({
      success: true,
      message: 'Message sent successfully',
      data: message,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
