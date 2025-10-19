import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.roles?.includes('FIXER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;

    // Verify order belongs to user - works for both service request and gig orders
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { fixerId: true, status: true, gigId: true, requestId: true },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.fixerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only gig orders use the PENDING → IN_PROGRESS workflow
    // Service request orders go straight to IN_PROGRESS when quote is accepted
    if (!order.gigId) {
      return NextResponse.json(
        { error: 'This action is only available for gig orders' },
        { status: 400 }
      );
    }

    if (order.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Only pending orders can be started' },
        { status: 400 }
      );
    }

    // Update order status and get full order details for notification
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
      include: {
        client: true,
        fixer: true,
        gig: true,
      },
    });

    // Send in-app notification to client
    try {
      const { notifyJobStarted } = await import('@/lib/notifications');
      await notifyJobStarted(
        updatedOrder.clientId,
        updatedOrder.id,
        updatedOrder.fixer.name || updatedOrder.fixer.email || 'Service Provider'
      );
    } catch (error) {
      console.error('Failed to send job started notification:', error);
    }

    // Send email notification if client has email notifications enabled
    if (updatedOrder.client.email && updatedOrder.client.emailNotifications) {
      try {
        const { sendEmail } = await import('@/lib/email');
        await sendEmail({
          to: updatedOrder.client.email,
          subject: 'Work Started on Your Order',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Work Started!</h2>
              <p>Dear ${updatedOrder.client.name || 'Valued Client'},</p>
              <p><strong>${updatedOrder.fixer.name || 'Your service provider'}</strong> has started working on your order for <strong>"${updatedOrder.gig?.title || 'your service'}"</strong>.</p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/client/orders/${updatedOrder.id}" style="display: inline-block; padding: 12px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  View Order Details
                </a>
              </div>
              <p>You'll receive another notification when the work is completed.</p>
              <p style="margin-top: 30px;">Best regards,<br><strong>The Fixers Team</strong></p>
            </div>
          `,
        });
      } catch (error) {
        console.error('Failed to send job started email:', error);
      }
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error starting order:', error);
    return NextResponse.json(
      { error: 'Failed to start order' },
      { status: 500 }
    );
  }
}
