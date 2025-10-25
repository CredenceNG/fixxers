import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const rejectSchema = z.object({
  userId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const adminUser = await getCurrentUser();
    const roles = adminUser?.roles || [];

    if (!adminUser || !roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { userId } = rejectSchema.parse(body);

    // Get user with pending changes
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.emailChangeRequested && !user.phoneChangeRequested) {
      return NextResponse.json({ error: 'No pending changes for this user' }, { status: 400 });
    }

    // Clear pending changes and set status back to ACTIVE
    await prisma.user.update({
      where: { id: userId },
      data: {
        pendingEmail: null,
        pendingPhone: null,
        emailChangeRequested: false,
        phoneChangeRequested: false,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Contact changes rejected',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Reject error:', error);
    return NextResponse.json(
      { error: 'Failed to reject contact changes' },
      { status: 500 }
    );
  }
}
