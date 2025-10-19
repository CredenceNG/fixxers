import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const agent = await prisma.agent.findUnique({
      where: { userId: user.id },
      include: {
        commissions: {
          include: {
            order: {
              select: {
                id: true,
                status: true,
                createdAt: true,
                gig: {
                  select: {
                    title: true,
                  },
                },
              },
            },
            agentFixer: {
              include: {
                fixer: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
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

    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const status = searchParams.get('status');

    let commissions = agent.commissions;

    // Filter by date range
    if (startDate) {
      commissions = commissions.filter(
        (c) => new Date(c.createdAt) >= new Date(startDate)
      );
    }
    if (endDate) {
      commissions = commissions.filter(
        (c) => new Date(c.createdAt) <= new Date(endDate)
      );
    }

    // Note: AgentCommission doesn't have a status field, so we skip status filtering

    // Calculate summary - use all commissions since there's no status
    const totalEarned = commissions.reduce((sum, c) => sum + Number(c.amount), 0);
    const totalPending = 0; // No pending status tracking

    return NextResponse.json({
      commissions,
      summary: {
        totalEarned: agent.totalEarned,
        walletBalance: agent.walletBalance,
        totalPending,
        commissionCount: commissions.length,
      },
    });
  } catch (error) {
    console.error('Error fetching earnings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch earnings' },
      { status: 500 }
    );
  }
}
