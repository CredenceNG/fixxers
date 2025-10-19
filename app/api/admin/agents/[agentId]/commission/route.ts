import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function PUT(
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
    const { commissionPercentage, fixerBonusEnabled } = await request.json();

    if (
      commissionPercentage === undefined ||
      commissionPercentage < 0 ||
      commissionPercentage > 100
    ) {
      return NextResponse.json(
        { error: 'Invalid commission percentage (must be between 0-100)' },
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

    const updatedAgent = await prisma.agent.update({
      where: { id: params.agentId },
      data: {
        commissionPercentage: new Decimal(commissionPercentage),
        fixerBonusEnabled:
          fixerBonusEnabled !== undefined
            ? fixerBonusEnabled
            : agent.fixerBonusEnabled,
      },
    });

    // Notify agent
    await prisma.notification.create({
      data: {
        userId: agent.userId,
        type: 'AGENT_COMMISSION_UPDATED',
        title: 'Commission Rate Updated',
        message: `Your commission rate has been updated to ${commissionPercentage}% by the admin.`,
        link: '/agent/dashboard',
      },
    });

    return NextResponse.json({
      message: 'Commission settings updated successfully',
      agent: updatedAgent,
    });
  } catch (error) {
    console.error('Error updating commission:', error);
    return NextResponse.json(
      { error: 'Failed to update commission settings' },
      { status: 500 }
    );
  }
}
