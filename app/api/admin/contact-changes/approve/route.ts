import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { z } from 'zod';

const approveSchema = z.object({
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
    const { userId } = approveSchema.parse(body);

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

    // Update user: apply pending changes, clear pending fields, set status to ACTIVE
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: user.pendingEmail || user.email,
        phone: user.pendingPhone || user.phone,
        pendingEmail: null,
        pendingPhone: null,
        emailChangeRequested: false,
        phoneChangeRequested: false,
        status: 'ACTIVE',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Contact changes approved successfully',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }

    console.error('Approve error:', error);
    return NextResponse.json(
      { error: 'Failed to approve contact changes' },
      { status: 500 }
    );
  }
}
