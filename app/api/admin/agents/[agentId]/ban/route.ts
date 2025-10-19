import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ agentId: string }> }
) {
  try {
    const user = await getCurrentUser();

    const roles = user?.roles || [];
    if (!user || !roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const params = await paramsPromise;
    const { reason } = await request.json();

    if (!reason) {
      return NextResponse.json(
        { error: 'Ban reason is required' },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.findUnique({
      where: { id: params.agentId },
      include: {
        user: true,
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Update agent status to BANNED
    const updatedAgent = await prisma.agent.update({
      where: { id: params.agentId },
      data: {
        status: 'BANNED',
        banReason: reason,
        bannedAt: new Date(),
      },
    });

    // Notify agent
    await prisma.notification.create({
      data: {
        userId: agent.userId,
        type: 'AGENT_BANNED',
        title: 'Agent Account Banned',
        message: `Your agent account has been permanently banned. Reason: ${reason}`,
        link: '/agent/dashboard',
      },
    });

    return NextResponse.json({
      message: 'Agent banned successfully',
      agent: updatedAgent,
    });
  } catch (error) {
    console.error('Error banning agent:', error);
    return NextResponse.json(
      { error: 'Failed to ban agent' },
      { status: 500 }
    );
  }
}
