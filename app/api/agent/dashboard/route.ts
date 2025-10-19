import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isActiveAgent } from "@/lib/agents/permissions";
import { getAgentCommissionSummary } from "@/lib/agents/commissions";

/**
 * GET /api/agent/dashboard - Get agent dashboard data
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAgent = await isActiveAgent(user.id);
    if (!isAgent) {
      return NextResponse.json(
        { error: "User is not an active agent" },
        { status: 403 }
      );
    }

    // Get agent data with counts
    const [agent, commissionSummary] = await Promise.all([
      prisma.agent.findUnique({
        where: { userId: user.id },
        include: {
          _count: {
            select: {
              managedFixers: true,
              managedClients: true,
              agentGigs: true,
              agentQuotes: true,
              agentRequests: true,
            },
          },
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
      }),
      getAgentCommissionSummary(user.id),
    ]);

    if (!agent) {
      return NextResponse.json(
        { error: "Agent profile not found" },
        { status: 404 }
      );
    }

    // Get pending vetting requests
    const pendingVetting = await prisma.agentFixer.count({
      where: {
        agentId: agent.id,
        vetStatus: "PENDING",
      },
    });

    // Get recent activities
    const recentGigs = await prisma.agentGig.findMany({
      where: { agentId: agent.id },
      include: {
        gig: {
          select: {
            id: true,
            title: true,
            slug: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    const recentQuotes = await prisma.agentQuote.findMany({
      where: { agentId: agent.id },
      include: {
        quote: {
          select: {
            id: true,
            totalAmount: true,
            isAccepted: true,
            createdAt: true,
            request: {
              select: {
                id: true,
                title: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    return NextResponse.json({
      agent: {
        id: agent.id,
        businessName: agent.businessName,
        status: agent.status,
        commissionPercentage: agent.commissionPercentage,
        approvedNeighborhoods: agent.approvedNeighborhoods,
        counts: {
          fixers: agent._count.managedFixers,
          clients: agent._count.managedClients,
          gigs: agent._count.agentGigs,
          quotes: agent._count.agentQuotes,
          requests: agent._count.agentRequests,
          maxFixers: 100, // Default limit
          maxClients: 200, // Default limit
          pendingVetting,
        },
      },
      commissions: commissionSummary,
      recentActivity: {
        gigs: recentGigs,
        quotes: recentQuotes,
      },
    });
  } catch (error) {
    console.error("Agent dashboard error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
