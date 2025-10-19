import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ agentId: string }> }
) {
  try {
    const params = await paramsPromise;
    const user = await getCurrentUser();

    const roles = user?.roles || [];
    if (!user || !roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
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

    if (!agent.pendingChanges) {
      return NextResponse.json(
        { error: 'No pending changes to approve' },
        { status: 400 }
      );
    }

    // Approve territory changes if any
    const updatedAgent = await prisma.$transaction(async (tx) => {
      let updateData: any = {
        pendingChanges: false,
        approvedAt: new Date(),
        approvedById: user.id,
      };

      // If there are requested neighborhoods, approve them
      if (agent.requestedNeighborhoodIds.length > 0) {
        // Connect the requested neighborhoods
        updateData.approvedNeighborhoods = {
          connect: agent.requestedNeighborhoodIds.map((id) => ({ id })),
        };
        updateData.requestedNeighborhoodIds = [];
      }

      const updated = await tx.agent.update({
        where: { id: params.agentId },
        data: updateData,
        include: {
          approvedNeighborhoods: {
            include: {
              city: true,
            },
          },
        },
      });

      // Notify agent
      await tx.notification.create({
        data: {
          userId: agent.userId,
          type: 'AGENT_CHANGES_APPROVED',
          title: 'Profile Changes Approved',
          message: 'Your profile/territory changes have been approved by the admin.',
          link: '/agent/profile',
        },
      });

      return updated;
    });

    return NextResponse.json({
      message: 'Changes approved successfully',
      agent: updatedAgent,
    });
  } catch (error) {
    console.error('Error approving changes:', error);
    return NextResponse.json(
      { error: 'Failed to approve changes' },
      { status: 500 }
    );
  }
}
