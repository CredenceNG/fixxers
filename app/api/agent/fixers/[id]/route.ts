import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agent = await prisma.agent.findUnique({
      where: { userId: user.id },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent profile not found' },
        { status: 404 }
      );
    }

    const params = await paramsPromise;
    const agentFixer = await prisma.agentFixer.findFirst({
      where: {
        agentId: agent.id,
        fixerId: params.id,
      },
      include: {
        fixer: {
          include: {
            fixerProfile: {
              include: {
                neighborhood: true,
              },
            },
            fixerServices: {
              include: {
                subcategory: {
                  include: {
                    category: true,
                  },
                },
              },
            },
            gigs: {
              where: {
                agentGig: {
                  agentId: agent.id,
                },
              },
              include: {
                subcategory: {
                  include: {
                    category: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!agentFixer) {
      return NextResponse.json(
        { error: 'Fixer not managed by this agent' },
        { status: 403 }
      );
    }

    return NextResponse.json({ agentFixer });
  } catch (error) {
    console.error('Error fetching fixer details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch fixer details' },
      { status: 500 }
    );
  }
}
