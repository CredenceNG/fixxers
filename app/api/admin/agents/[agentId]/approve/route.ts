import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgentStatus } from "@prisma/client";

/**
 * POST /api/admin/agents/[agentId]/approve - Approve an agent application or territory change
 */
export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ agentId: string }> }
) {
  try {
    const user = await getCurrentUser();

    const roles = user?.roles || [];
    if (!user || !roles.includes("ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const params = await paramsPromise;
    const { agentId } = params;
    const body = await request.json();
    const { approvedNeighborhoodIds, commissionPercentage } = body;

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    // Verify neighborhoods exist
    if (approvedNeighborhoodIds?.length) {
      const neighborhoods = await prisma.neighborhood.findMany({
        where: { id: { in: approvedNeighborhoodIds } },
      });

      if (neighborhoods.length !== approvedNeighborhoodIds.length) {
        return NextResponse.json(
          { error: "Invalid neighborhood IDs provided" },
          { status: 400 }
        );
      }
    }

    // Update agent with approval
    const updated = await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: AgentStatus.ACTIVE,
        pendingChanges: false,
        approvedNeighborhoods: approvedNeighborhoodIds
          ? {
              set: approvedNeighborhoodIds.map((id: string) => ({ id })),
            }
          : undefined,
        commissionPercentage: commissionPercentage !== undefined
          ? commissionPercentage
          : agent.commissionPercentage,
        approvedById: user.id,
        approvedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
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
    });

    // Notify the agent
    await prisma.notification.create({
      data: {
        userId: updated.userId,
        type: "AGENT_APPROVED",
        title: "Agent Application Approved",
        message: `Your agent application has been approved! You can now manage fixers and clients.`,
        link: `/agent/dashboard`,
      },
    });

    return NextResponse.json({
      message: "Agent approved successfully",
      agent: updated,
    });
  } catch (error) {
    console.error("Approve agent error:", error);
    return NextResponse.json(
      { error: "Failed to approve agent" },
      { status: 500 }
    );
  }
}
