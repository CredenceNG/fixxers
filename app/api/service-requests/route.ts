import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isActiveAgent } from '@/lib/agents/permissions';

/**
 * GET /api/service-requests - Get service requests for agent
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const isAgent = await isActiveAgent(user.id);
    if (!isAgent) {
      return NextResponse.json(
        { error: 'User is not an active agent' },
        { status: 403 }
      );
    }

    // Get agent's approved territories
    const agent = await prisma.agent.findUnique({
      where: { userId: user.id },
      include: {
        territories: {
          where: { status: 'APPROVED' },
          select: {
            neighborhoodId: true,
          },
        },
      },
    });

    if (!agent || agent.territories.length === 0) {
      return NextResponse.json({ requests: [] });
    }

    const neighborhoodIds = agent.territories.map((t) => t.neighborhoodId);

    // Fetch service requests in agent's territories
    const requests = await prisma.serviceRequest.findMany({
      where: {
        neighborhoodId: { in: neighborhoodIds },
        status: 'APPROVED',
      },
      include: {
        subcategory: {
          include: {
            category: true,
          },
        },
        neighborhood: {
          include: {
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
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error('Service requests fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service requests' },
      { status: 500 }
    );
  }
}
