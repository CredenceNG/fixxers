import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateMagicLink } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';
import { sendMagicLinkSMS } from '@/lib/sms';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  redirect: z.string().optional(),
}).refine(data => data.email || data.phone, {
  message: 'Either email or phone is required',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = loginSchema.parse(body);

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
        { error: 'No account found. Please register first.' },
        { status: 404 }
      );
    }

    // Check if user is suspended
    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        { error: 'Your account has been suspended. Please contact support.' },
        { status: 403 }
      );
    }

    // Check if user is rejected
    if (user.status === 'REJECTED') {
      return NextResponse.json(
        { error: 'Your account application was not approved.' },
        { status: 403 }
      );
    }

    // Generate magic link with optional redirect
    const token = await generateMagicLink(user.id);
    const verifyUrl = validated.redirect
      ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}&redirect=${encodeURIComponent(validated.redirect)}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify?token=${token}`;

    // Send magic link via email or SMS
    if (validated.email && user.email) {
      await sendMagicLinkEmail(user.email, token, false, validated.redirect);
    } else if (validated.phone && user.phone) {
      await sendMagicLinkSMS(user.phone, token, false);
    }

    return NextResponse.json({
      success: true,
      message: `Login link sent to your ${validated.email ? 'email' : 'phone'}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors?.[0]?.message || 'Validation error';
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
