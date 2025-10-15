import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ fixerId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const roles = user?.roles || [];

    if (!user || !roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fixerId } = await context.params;
    const body = await request.json();
    const { message } = body;

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Fetch the fixer
    const fixer = await prisma.user.findUnique({
      where: { id: fixerId },
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

    if (!fixer || !fixer.fixerProfile) {
      return NextResponse.json({ error: 'Fixer not found' }, { status: 404 });
    }

    // Send email to fixer
    if (fixer.email) {
      try {
        await sendEmail({
          to: fixer.email,
          subject: 'Additional Details Needed for Your Fixer Application',
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #2563eb;">Additional Details Needed</h2>
              <p>Dear ${fixer.name || 'Valued Fixer'},</p>
              <p>Our admin team is reviewing your fixer application and needs additional information before we can proceed with approval.</p>
              <div style="background-color: #eff6ff; padding: 16px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0;">
                <p style="margin: 4px 0;"><strong>Admin Message:</strong></p>
                <p style="margin: 8px 0; white-space: pre-wrap;">${message}</p>
              </div>
              <p>Please reply to this email with the requested information or update your profile on our platform.</p>
              <div style="margin: 30px 0; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010'}/fixer/profile" style="display: inline-block; padding: 12px 30px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 8px; font-weight: 600;">
                  Update Your Profile
                </a>
              </div>
              <p>Thank you for your cooperation!</p>
              <p style="margin-top: 30px;">Best regards,<br><strong>The Fixxers Team</strong></p>
            </div>
          `,
        });
      } catch (emailError) {
        console.error('Failed to send additional details request email:', emailError);
        return NextResponse.json(
          { error: 'Failed to send email to fixer' },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: 'Fixer email not found' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Additional details request sent successfully',
    });
  } catch (error) {
    console.error('Request additional details error:', error);
    return NextResponse.json(
      { error: 'Failed to request additional details' },
      { status: 500 }
    );
  }
}
