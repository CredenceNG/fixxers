import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agent = await prisma.agent.findUnique({
      where: { userId: user.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        approvedNeighborhoods: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
            country: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent profile not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error('Error fetching agent profile:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent profile' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    const agent = await prisma.agent.findUnique({
      where: { userId: user.id },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent profile not found' },
        { status: 404 }
      );
    }

    const { businessName, businessAddress, taxId } = await request.json();

    // If agent is already approved, mark changes as pending
    const pendingChanges = agent.status === 'ACTIVE';

    const updatedAgent = await prisma.agent.update({
      where: { id: agent.id },
      data: {
        businessName,
        businessAddress,
        taxId,
        pendingChanges,
      },
    });

    // Notify admins if changes need approval
    if (pendingChanges) {
      await prisma.notification.create({
        data: {
          userId: 'admin', // Send to all admins
          type: 'AGENT_PROFILE_CHANGES_PENDING',
          title: 'Agent Profile Changes Pending',
          message: `Agent ${businessName || user.name} has updated their profile and requires re-approval.`,
          link: `/admin/agents/${agent.id}`,
        },
      });
    }

    return NextResponse.json({ agent: updatedAgent });
  } catch (error) {
    console.error('Error updating agent profile:', error);
    return NextResponse.json(
      { error: 'Failed to update agent profile' },
      { status: 500 }
    );
  }
}
