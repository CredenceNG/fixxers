import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();
    const roles = currentUser?.roles || [];

    if (!currentUser || !roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { subject, message } = await request.json();

    if (!subject || !message) {
      return NextResponse.json({ error: 'Subject and message are required' }, { status: 400 });
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { id },
      select: { email: true, name: true },
    });

    if (!user || !user.email) {
      return NextResponse.json({ error: 'User not found or has no email' }, { status: 404 });
    }

    // Send email
    try {
      await sendEmail({
        to: user.email,
        subject: `[Fixers Platform] ${subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Message from Fixers Admin</h2>
            <p>Hello ${user.name || 'there'},</p>
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              ${message.replace(/\n/g, '<br>')}
            </div>
            <p style="color: #666; font-size: 14px;">
              This message was sent by the Fixers platform administration team.
            </p>
            <p style="color: #666; font-size: 14px;">
              If you have any questions, please reply to this email.
            </p>
          </div>
        `,
      });

      return NextResponse.json({
        success: true,
        message: 'Message sent successfully'
      });
    } catch (emailError) {
      console.error('Email send error:', emailError);
      return NextResponse.json({
        error: 'Failed to send email. Please try again later.'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
