import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateMagicLink } from '@/lib/auth';
import { sendMagicLinkEmail } from '@/lib/email';
import { sendMagicLinkSMS } from '@/lib/sms';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  name: z.string().optional(),
  role: z.enum(['CLIENT', 'FIXER']).optional(),
  roles: z.array(z.enum(['CLIENT', 'FIXER'])).optional(),
}).refine(data => data.email || data.phone, {
  message: 'Either email or phone is required',
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = registerSchema.parse(body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          validated.email ? { email: validated.email } : {},
          validated.phone ? { phone: validated.phone } : {},
        ],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists. Please login instead.' },
        { status: 400 }
      );
    }

    // Determine roles: use roles array if provided, otherwise fallback to role, default to CLIENT
    const roles = validated.roles && validated.roles.length > 0
      ? validated.roles
      : validated.role
        ? [validated.role]
        : ['CLIENT' as const];

    const primaryRole = roles[0] as 'CLIENT' | 'FIXER';

    // Create new user with PENDING status
    const user = await prisma.user.create({
      data: {
        email: validated.email,
        phone: validated.phone,
        name: validated.name,
        role: primaryRole,
        roles: roles,
      },
    });

    // Generate magic link
    const token = await generateMagicLink(user.id);

    // Send magic link via email or SMS
    if (validated.email) {
      await sendMagicLinkEmail(validated.email, token, true);
    } else if (validated.phone) {
      await sendMagicLinkSMS(validated.phone, token, true);
    }

    return NextResponse.json({
      success: true,
      message: `Registration link sent to your ${validated.email ? 'email' : 'phone'}`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues[0].message }, { status: 400 });
    }

    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
