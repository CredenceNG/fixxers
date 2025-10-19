import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated', user: null });
    }

    const agent = await prisma.agent.findUnique({
      where: { userId: user.id },
      select: {
        id: true,
        userId: true,
        businessName: true,
        status: true,
        approvedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        roles: user.roles,
      },
      agent,
      hasAgent: !!agent,
      isActive: agent?.status === 'ACTIVE',
    });
  } catch (error) {
    console.error('Error checking agent:', error);
    return NextResponse.json(
      { error: 'Failed to check agent status', details: String(error) },
      { status: 500 }
    );
  }
}
