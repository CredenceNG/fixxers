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

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has ADMIN role
    const roles = currentUser.roles || [];
    if (!roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { id } = await params;

    // Get the user who needs to complete their profile
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        fixerProfile: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.email) {
      return NextResponse.json({ error: 'User does not have an email address' }, { status: 400 });
    }

    // Check if they already have a profile
    if (user.fixerProfile) {
      return NextResponse.json(
        { error: 'User has already completed their profile' },
        { status: 400 }
      );
    }

    // Send reminder email
    await sendEmail({
      to: user.email,
      subject: 'Complete Your Service Provider Profile - Fixers',
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Complete Your Service Provider Profile</h2>

  <p>Hello ${user.name || 'there'},</p>

  <p>We noticed that you started the process to become a service provider on Fixers, but haven't completed your profile yet.</p>

  <div style="background-color: #FEF5E7; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F39C12;">
    <p style="margin: 0; color: #95620D;">
      <strong>⚠️ Action Required:</strong> To complete your service provider registration, you need to fill out your profile information (Step 1).
    </p>
  </div>

  <p>Completing your profile will allow you to:</p>
  <ul>
    <li>Get approved as a service provider</li>
    <li>Start offering your services to clients</li>
    <li>Earn money using the platform</li>
    <li>Build your reputation and grow your business</li>
  </ul>

  <p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/fixer/profile"
       style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
      Complete Your Profile Now
    </a>
  </p>

  <p style="margin-top: 30px; color: #6b7280; font-size: 14px;">
    If you have any questions or need assistance, please don't hesitate to reach out to our support team.
  </p>

  <p style="color: #6b7280; font-size: 14px;">
    Best regards,<br>
    Fixers Team
  </p>
</div>
      `.trim(),
    });

    // Create notification for the user
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'GENERAL',
          title: 'Complete Your Service Provider Profile',
          message:
            'Please complete your service provider profile to get approved and start offering your services.',
          link: '/fixer/profile',
        },
      });
    } catch (error) {
      console.error('Failed to create notification:', error);
      // Don't fail the request if notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'Reminder email sent successfully',
    });
  } catch (error: any) {
    console.error('Error sending profile reminder:', error);
    return NextResponse.json(
      { error: 'Failed to send reminder email' },
      { status: 500 }
    );
  }
}
