import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  try {
    const user = await getCurrentUser();

    const roles = user?.roles || [];
    if (!user || !roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { agentId } = await params;

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        _count: {
          select: {
            managedFixers: true,
            managedClients: true,
            agentGigs: true,
            agentQuotes: true,
            commissions: true,
          },
        },
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
            roles: true,
            createdAt: true,
          },
        },
        approvedNeighborhoods: true,
        approver: {
          select: {
            name: true,
            email: true,
          },
        },
        managedFixers: {
          include: {
            fixer: {
              select: {
                id: true,
                name: true,
                email: true,
                status: true,
                fixerProfile: true,
              },
            },
          },
        },
        managedClients: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        commissions: {
          include: {
            order: {
              select: {
                id: true,
                status: true,
                totalAmount: true,
                fixerAmount: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        agentGigs: {
          include: {
            gig: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          take: 10,
        },
        agentQuotes: {
          include: {
            quote: {
              select: {
                id: true,
                totalAmount: true,
                isAccepted: true,
              },
            },
          },
          take: 10,
        },
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent not found' },
        { status: 404 }
      );
    }

    // Get requested neighborhoods if any
    let requestedNeighborhoods = [];
    if (agent.requestedNeighborhoodIds.length > 0) {
      requestedNeighborhoods = await prisma.neighborhood.findMany({
        where: {
          id: {
            in: agent.requestedNeighborhoodIds,
          },
        },
      });
    }

    return NextResponse.json({ agent, requestedNeighborhoods });
  } catch (error) {
    console.error('Error fetching agent details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch agent details' },
      { status: 500 }
    );
  }
}
