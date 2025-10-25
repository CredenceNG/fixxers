import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser, generateSessionToken } from '@/lib/auth';
import { z } from 'zod';

const contactUpdateSchema = z.object({
  newEmail: z.string().email().optional(),
  newPhone: z.string().optional(),
}).refine((data) => data.newEmail || data.newPhone, {
  message: "At least one of email or phone must be provided",
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = contactUpdateSchema.parse(body);

    // Check if user is trying to change to same values
    if (validated.newEmail && validated.newEmail === user.email) {
      return NextResponse.json({ error: 'New email is the same as current email' }, { status: 400 });
    }

    if (validated.newPhone && validated.newPhone === user.phone) {
      return NextResponse.json({ error: 'New phone is the same as current phone' }, { status: 400 });
    }

    // Check if new email or phone is already taken by another user
    if (validated.newEmail) {
      const existingUserWithEmail = await prisma.user.findFirst({
        where: {
          email: validated.newEmail,
          id: { not: user.id }
        }
      });

      if (existingUserWithEmail) {
        return NextResponse.json({ error: 'Email is already in use by another account' }, { status: 400 });
      }
    }

    if (validated.newPhone) {
      const existingUserWithPhone = await prisma.user.findFirst({
        where: {
          phone: validated.newPhone,
          id: { not: user.id }
        }
      });

      if (existingUserWithPhone) {
        return NextResponse.json({ error: 'Phone number is already in use by another account' }, { status: 400 });
      }
    }

    // Update user with pending changes and set status to PENDING
    await prisma.user.update({
      where: { id: user.id },
      data: {
        pendingEmail: validated.newEmail || user.pendingEmail,
        pendingPhone: validated.newPhone || user.pendingPhone,
        emailChangeRequested: validated.newEmail ? true : user.emailChangeRequested,
        phoneChangeRequested: validated.newPhone ? true : user.phoneChangeRequested,
        status: 'PENDING',
      },
    });

    // Regenerate session token with updated status
    const roles = user.roles || [];
    const newSessionToken = generateSessionToken({
      userId: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      role: roles[0] || 'CLIENT',
      roles,
      userStatus: 'PENDING',
      hasProfile: true,
      hasFixerProfile: !!user.fixerProfile,
      hasClientProfile: !!user.clientProfile,
    });

    const response = NextResponse.json({
      success: true,
      message: 'Contact change request submitted for admin approval. You will be notified once approved.',
    });

    response.cookies.set('auth_token', newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Contact update error:', error);
    return NextResponse.json(
      { error: 'Failed to submit contact change request' },
      { status: 500 }
    );
  }
}
