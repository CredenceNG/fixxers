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
        approvedNeighborhoods: {
          select: {
            id: true,
            name: true,
            city: {
              select: {
                name: true,
                state: {
                  select: {
                    name: true,
                  },
                },
              },
            },
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

    // Get pending/requested neighborhoods
    let pendingNeighborhoods: any[] = [];
    if (agent.requestedNeighborhoodIds.length > 0) {
      pendingNeighborhoods = await prisma.neighborhood.findMany({
        where: {
          id: {
            in: agent.requestedNeighborhoodIds,
          },
        },
        select: {
          id: true,
          name: true,
          city: {
            select: {
              name: true,
              state: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
      });
    }

    return NextResponse.json({
      approvedNeighborhoods: agent.approvedNeighborhoods,
      pendingNeighborhoods,
    });
  } catch (error) {
    console.error('Error fetching territories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch territories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agent = await prisma.agent.findUnique({
      where: { userId: user.id },
      include: {
        user: true,
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent profile not found' },
        { status: 404 }
      );
    }

    if (agent.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Agent must be active to request territory changes' },
        { status: 403 }
      );
    }

    const { neighborhoodIds } = await request.json();

    if (!Array.isArray(neighborhoodIds) || neighborhoodIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid neighborhood IDs' },
        { status: 400 }
      );
    }

    // Update requested neighborhoods and mark as pending changes
    const updatedAgent = await prisma.agent.update({
      where: { id: agent.id },
      data: {
        requestedNeighborhoodIds: neighborhoodIds,
        pendingChanges: true,
      },
    });

    // Notify admins
    const admins = await prisma.user.findMany({
      where: { roles: { has: 'ADMIN' } },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: 'GENERAL',
          title: 'Agent Territory Change Requested',
          message: `Agent ${agent.businessName || user.name || 'Unknown'} has requested territory changes and requires approval.`,
          link: `/admin/agents/${agent.id}`,
        })),
      });
    }

    return NextResponse.json({ agent: updatedAgent });
  } catch (error) {
    console.error('Error requesting territory change:', error);
    return NextResponse.json(
      { error: 'Failed to request territory change' },
      { status: 500 }
    );
  }
}
