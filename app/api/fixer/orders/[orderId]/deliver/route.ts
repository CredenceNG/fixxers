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
    const body = await request.json();
    const { deliveryNote, deliveryFiles } = body;

    if (!deliveryNote || !deliveryNote.trim()) {
      return NextResponse.json(
        { error: 'Delivery note is required' },
        { status: 400 }
      );
    }

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

    // Only gig orders use the deliver workflow with delivery notes
    // Service request orders use the simpler complete endpoint
    if (!order.gigId) {
      return NextResponse.json(
        { error: 'This action is only available for gig orders' },
        { status: 400 }
      );
    }

    if (order.status !== 'IN_PROGRESS') {
      return NextResponse.json(
        { error: 'Only in-progress orders can be delivered' },
        { status: 400 }
      );
    }

    // Update order with delivery and get full order details for notification
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'COMPLETED',
        deliveryNote: deliveryNote.trim(),
        deliveryFiles: deliveryFiles || [],
        deliveredAt: new Date(),
        completedAt: new Date(),
      },
      include: {
        client: true,
        fixer: true,
        gig: true,
      },
    });

    // Send in-app notification to client
    try {
      const { notifyJobCompleted } = await import('@/lib/notifications');
      await notifyJobCompleted(
        updatedOrder.clientId,
        updatedOrder.id,
        updatedOrder.fixer.name || updatedOrder.fixer.email || 'Service Provider'
      );
    } catch (error) {
      console.error('Failed to send job completed notification:', error);
    }

    // Send email notification if client has email notifications enabled
    if (updatedOrder.client.email && updatedOrder.client.emailNotifications) {
      try {
        const { sendEmail } = await import('@/lib/email');
        await sendEmail({
          to: updatedOrder.client.email,
          subject: 'Your Order is Complete - Please Review',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10b981;">Work Completed! 🎉</h2>
              <p>Dear ${updatedOrder.client.name || 'Valued Client'},</p>
              <p><strong>${updatedOrder.fixer.name || 'Your service provider'}</strong> has completed work on your order for <strong>"${updatedOrder.gig?.title || 'your service'}"</strong>.</p>
              <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0; font-weight: 600; color: #374151;">Delivery Note:</p>
                <p style="margin: 8px 0 0 0; color: #6b7280; white-space: pre-wrap;">${deliveryNote}</p>
              </div>
              <p>Please review the work and process payment if you're satisfied.</p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/client/orders/${updatedOrder.id}" style="display: inline-block; padding: 12px 30px; background-color: #10b981; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  Review & Pay
                </a>
              </div>
              <p style="margin-top: 30px;">Best regards,<br><strong>The Fixers Team</strong></p>
            </div>
          `,
        });
      } catch (error) {
        console.error('Failed to send job completed email:', error);
      }
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('Error delivering order:', error);
    return NextResponse.json(
      { error: 'Failed to deliver order' },
      { status: 500 }
    );
  }
}
