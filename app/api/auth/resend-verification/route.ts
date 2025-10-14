import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateMagicLink } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';
import { sendMagicLinkSMS } from '@/lib/sms';
import { z } from 'zod';

const resendSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
}).refine(data => data.email || data.phone, {
  message: 'Either email or phone is required',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = resendSchema.parse(body);

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          validated.email ? { email: validated.email } : {},
          validated.phone ? { phone: validated.phone } : {},
        ],
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'No account found with this email or phone.' },
        { status: 404 }
      );
    }

    // Check if user is already active (already verified)
    if (user.status === 'ACTIVE') {
      return NextResponse.json(
        { message: 'Your account is already verified. You can login now.' },
        { status: 200 }
      );
    }

    // Check if user is suspended or rejected
    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact support.' },
        { status: 403 }
      );
    }

    if (user.status === 'REJECTED') {
      return NextResponse.json(
        { error: 'Your account application was not approved.' },
        { status: 403 }
      );
    }

    // Delete any old unused magic links for this user
    await prisma.magicLink.deleteMany({
      where: {
        userId: user.id,
        used: false,
        expiresAt: {
          lt: new Date()
        }
      }
    });

    // Generate new magic link
    const token = await generateMagicLink(user.id);
    const verifyUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;

    // Send magic link via email or SMS
    if (validated.email && user.email) {
      await sendMagicLinkEmail(user.email, token, true); // true = resend
    } else if (validated.phone && user.phone) {
      await sendMagicLinkSMS(user.phone, token, true); // true = resend
    }

    console.log(`[Resend Verification] New verification link sent to ${user.email || user.phone}`);

    return NextResponse.json({
      success: true,
      message: `New verification link sent to your ${validated.email ? 'email' : 'phone'}. Please check your inbox.`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.issues[0]?.message || 'Validation error';
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
