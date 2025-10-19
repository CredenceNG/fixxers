import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { isActiveAgent } from '@/lib/agents/permissions';

/**
 * GET /api/service-requests/[id] - Get single service request for agent
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;

    // Fetch service request with city relations
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
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
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!serviceRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Verify agent has access to this territory
    const agent = await prisma.agent.findUnique({
      where: { userId: user.id },
      include: {
        territories: {
          where: {
            neighborhoodId: serviceRequest.neighborhoodId,
            status: 'APPROVED',
          },
        },
      },
    });

    if (!agent || agent.territories.length === 0) {
      return NextResponse.json(
        { error: 'Access denied - not in your approved territories' },
        { status: 403 }
      );
    }

    return NextResponse.json({ request: serviceRequest });
  } catch (error) {
    console.error('Service request fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service request' },
      { status: 500 }
    );
  }
}
