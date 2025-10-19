import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const reviewSchema = z.object({
  rating: z.number().min(1).max(4),
  comment: z.string().min(1, 'Review comment is required'),
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
    const validated = reviewSchema.parse(body);

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
        { error: 'Only completed orders can be reviewed' },
        { status: 400 }
      );
    }

    // Check if already reviewed
    if (order.rating) {
      return NextResponse.json(
        { error: 'Order has already been reviewed' },
        { status: 400 }
      );
    }

    // Save review and get full order details
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        rating: validated.rating,
        reviewComment: validated.comment,
        reviewedAt: new Date(),
      },
      include: {
        client: true,
        gig: true,
      },
    });

    // Send in-app notification to fixer about review
    try {
      const ratingEmoji = ['😞', '😐', '🙂', '😄'][validated.rating - 1];
      await prisma.notification.create({
        data: {
          userId: order.fixerId,
          type: 'REVIEW_RECEIVED',
          title: 'New Review Received',
          message: `${updatedOrder.client.name || 'Client'} left you a ${validated.rating}/4 ${ratingEmoji} review for "${updatedOrder.gig?.title || 'your order'}"`,
          link: `/fixer/orders/${order.id}`,
        },
      });
    } catch (error) {
      console.error('Failed to send review notification:', error);
    }

    // Send email notification if fixer has email notifications enabled
    const fixer = await prisma.user.findUnique({
      where: { id: order.fixerId },
      select: { email: true, name: true, emailNotifications: true },
    });

    if (fixer?.email && fixer.emailNotifications) {
      try {
        const { sendEmail } = await import('@/lib/email');
        const ratingEmoji = ['😞', '😐', '🙂', '😄'][validated.rating - 1];
        const ratingText = ['Poor', 'Fair', 'Good', 'Excellent'][validated.rating - 1];
        const ratingColor = ['#ef4444', '#f59e0b', '#10b981', '#10b981'][validated.rating - 1];

        await sendEmail({
          to: fixer.email,
          subject: `New ${ratingText} Review Received!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: ${ratingColor};">New Review ${ratingEmoji}</h2>
              <p>Dear ${fixer.name || 'Service Provider'},</p>
              <p><strong>${updatedOrder.client.name || 'Your client'}</strong> has left a review for your work on <strong>"${updatedOrder.gig?.title || 'the order'}"</strong>.</p>
              <div style="background-color: #f9fafb; padding: 24px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <div style="font-size: 48px; margin-bottom: 8px;">${ratingEmoji}</div>
                <div style="font-size: 24px; font-weight: 700; color: ${ratingColor}; margin-bottom: 8px;">
                  ${validated.rating}/4 - ${ratingText}
                </div>
                <div style="background-color: white; padding: 16px; border-radius: 8px; margin-top: 16px; text-align: left;">
                  <p style="margin: 0; font-weight: 600; color: #374151; margin-bottom: 8px;">Review:</p>
                  <p style="margin: 0; color: #6b7280; line-height: 1.6; white-space: pre-wrap;">${validated.comment}</p>
                </div>
              </div>
              <p style="color: #6b7280; font-size: 14px;">This review will be visible on your profile and helps build trust with potential clients.</p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/fixer/orders/${order.id}" style="display: inline-block; padding: 12px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  View Full Order
                </a>
              </div>
              <p style="margin-top: 30px;">Best regards,<br><strong>The Fixers Team</strong></p>
            </div>
          `,
        });
      } catch (error) {
        console.error('Failed to send review email:', error);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Failed to submit review' },
      { status: 500 }
    );
  }
}
