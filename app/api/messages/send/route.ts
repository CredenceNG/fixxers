import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendSMS } from '@/lib/twilio';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { recipientId, message, gigId, orderId, requestId } = body;

    if (!recipientId || !message) {
      return NextResponse.json(
        { error: 'Recipient ID and message are required' },
        { status: 400 }
      );
    }

    // Get recipient details
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        emailNotifications: true,
        smsNotifications: true,
      },
    });

    if (!recipient) {
      return NextResponse.json({ error: 'Recipient not found' }, { status: 404 });
    }

    // Create the direct message
    const directMessage = await prisma.directMessage.create({
      data: {
        senderId: user.id,
        recipientId,
        message,
        gigId: gigId || null,
        orderId: orderId || null,
        requestId: requestId || null,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Get context details (gig, order, or request)
    let contextTitle = '';
    let contextType = '';
    if (gigId) {
      const gig = await prisma.gig.findUnique({
        where: { id: gigId },
        select: { title: true, slug: true },
      });
      contextTitle = gig?.title || '';
      contextType = 'gig';
    } else if (orderId) {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: {
          gig: { select: { title: true } },
          request: { select: { title: true } },
        },
      });
      contextTitle = order?.gig?.title || order?.request?.title || 'Order';
      contextType = 'order';
    } else if (requestId) {
      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id: requestId },
        select: { title: true },
      });
      contextTitle = serviceRequest?.title || '';
      contextType = 'request';
    }

    // Create in-app notification
    await prisma.notification.create({
      data: {
        userId: recipientId,
        type: 'GENERAL',
        title: 'New Message',
        message: `${user.name || 'A user'} sent you a message${contextTitle ? ` about "${contextTitle}"` : ''}`,
        link: `/messages`,
      },
    });

    // Send email notification if enabled
    if (recipient.emailNotifications && recipient.email) {
      try {
        await sendEmail({
          to: recipient.email,
          subject: `New Message from ${user.name || 'A User'} on Fixxers`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1DBF73;">New Message on Fixxers</h2>
              <p><strong>${user.name || user.email || 'A user'}</strong> sent you a message:</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0;">${message}</p>
              </div>
              ${contextTitle ? `<p><strong>Regarding:</strong> ${contextTitle}${contextType === 'order' ? ' (Order)' : contextType === 'request' ? ' (Service Request)' : ''}</p>` : ''}
              <p>
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/messages"
                   style="background-color: #1DBF73; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Message
                </a>
              </p>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">
                This is an automated message from Fixxers. To stop receiving email notifications, please update your notification preferences in your account settings.
              </p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
      }
    }

    // Send SMS notification if enabled
    if (recipient.smsNotifications && recipient.phone) {
      try {
        await sendSMS(
          recipient.phone,
          `New message from ${user.name || 'a user'} on Fixxers${contextTitle ? ` about "${contextTitle}"` : ''}: "${message.substring(0, 100)}${message.length > 100 ? '...' : ''}" - Reply at ${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/messages`
        );
      } catch (smsError) {
        console.error('Failed to send SMS notification:', smsError);
      }
    }

    return NextResponse.json({
      success: true,
      message: directMessage,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
