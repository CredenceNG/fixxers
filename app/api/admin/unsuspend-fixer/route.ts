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

    if (fixer.status !== 'PENDING' && fixer.status !== 'SUSPENDED') {
      return NextResponse.json({ error: 'Fixer is not suspended (must be PENDING or SUSPENDED status)' }, { status: 400 });
    }

    // Reactivate the fixer by approving them
    await prisma.user.update({
      where: { id: fixerId },
      data: { status: 'ACTIVE' },
    });

    // Also update the fixer profile to mark as approved
    await prisma.fixerProfile.updateMany({
      where: { fixerId },
      data: { approvedAt: new Date(), pendingChanges: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Fixer reactivated successfully',
    });
  } catch (error) {
    console.error('Error reactivating fixer:', error);
    return NextResponse.json(
      { error: 'Failed to reactivate fixer' },
      { status: 500 }
    );
  }
}
