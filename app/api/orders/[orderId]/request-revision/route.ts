import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const revisionSchema = z.object({
  note: z.string().min(10, 'Please provide detailed feedback (at least 10 characters)'),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.roles?.includes('CLIENT')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;
    const body = await request.json();
    const validated = revisionSchema.parse(body);

    // Fetch the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify user is the buyer
    if (order.clientId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify order is completed
    if (order.status !== 'COMPLETED') {
      return NextResponse.json(
        { error: 'Only completed orders can request revision' },
        { status: 400 }
      );
    }

    // Check revisions remaining
    if (order.revisionsUsed >= order.revisionsAllowed) {
      return NextResponse.json(
        { error: 'No revisions remaining for this order' },
        { status: 400 }
      );
    }

    // Update order to request revision and get full order details
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'IN_PROGRESS',
        revisionRequested: true,
        revisionNote: validated.note,
        revisionsUsed: order.revisionsUsed + 1,
        deliveryNote: null, // Clear previous delivery note
      },
      include: {
        client: true,
        gig: true,
      },
    });

    // Send in-app notification to fixer about revision request
    try {
      await prisma.notification.create({
        data: {
          userId: order.fixerId,
          type: 'GENERAL',
          title: 'Revision Requested',
          message: `Client has requested a revision for "${updatedOrder.gig?.title || 'your order'}". Revisions used: ${updatedOrder.revisionsUsed}/${updatedOrder.revisionsAllowed}`,
          link: `/fixer/orders/${order.id}`,
        },
      });
    } catch (error) {
      console.error('Failed to send revision notification:', error);
    }

    // Send email notification if fixer has email notifications enabled
    const fixer = await prisma.user.findUnique({
      where: { id: order.fixerId },
      select: { email: true, name: true, emailNotifications: true },
    });

    if (fixer?.email && fixer.emailNotifications) {
      try {
        const { sendEmail } = await import('@/lib/email');
        await sendEmail({
          to: fixer.email,
          subject: 'Revision Requested on Your Order',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #f59e0b;">Revision Requested</h2>
              <p>Dear ${fixer.name || 'Service Provider'},</p>
              <p><strong>${updatedOrder.client.name || 'Your client'}</strong> has requested a revision on the order for <strong>"${updatedOrder.gig?.title || 'your service'}"</strong>.</p>
              <div style="background-color: #fef3c7; padding: 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0;">
                <p style="margin: 0; font-weight: 600; color: #92400e;">Revision Feedback:</p>
                <p style="margin: 8px 0 0 0; color: #78350f; white-space: pre-wrap;">${validated.note}</p>
              </div>
              <p style="color: #6b7280;">Revisions used: <strong>${updatedOrder.revisionsUsed}</strong> of <strong>${updatedOrder.revisionsAllowed}</strong></p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/fixer/orders/${order.id}" style="display: inline-block; padding: 12px 30px; background-color: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  View Order & Update
                </a>
              </div>
              <p style="margin-top: 30px;">Best regards,<br><strong>The Fixxers Team</strong></p>
            </div>
          `,
        });
      } catch (error) {
        console.error('Failed to send revision email:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Revision requested successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('Error requesting revision:', error);
    return NextResponse.json(
      { error: 'Failed to request revision' },
      { status: 500 }
    );
  }
}
