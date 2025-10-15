import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const roles = user?.roles || [];

    if (!user || !roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { fixerId } = body;

    if (!fixerId) {
      return NextResponse.json({ error: 'Fixer ID is required' }, { status: 400 });
    }

    // Check if user exists and has FIXER role
    const fixer = await prisma.user.findUnique({
      where: { id: fixerId },
      select: { id: true, roles: true, status: true },
    });

    if (!fixer) {
      return NextResponse.json({ error: 'Fixer not found' }, { status: 404 });
    }

    if (!fixer.roles.includes('FIXER')) {
      return NextResponse.json({ error: 'User is not a fixer' }, { status: 400 });
    }

    if (fixer.status === 'SUSPENDED') {
      return NextResponse.json({ error: 'Fixer is already suspended' }, { status: 400 });
    }

    // Suspend the fixer
    await prisma.user.update({
      where: { id: fixerId },
      data: { status: 'SUSPENDED' },
    });

    return NextResponse.json({
      success: true,
      message: 'Fixer suspended successfully',
    });
  } catch (error) {
    console.error('Error suspending fixer:', error);
    return NextResponse.json(
      { error: 'Failed to suspend fixer' },
      { status: 500 }
    );
  }
}
