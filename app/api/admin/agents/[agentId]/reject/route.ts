import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgentStatus } from "@prisma/client";

/**
 * POST /api/admin/agents/[agentId]/reject - Reject an agent application
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
    const { reason } = body;

    if (!reason || !reason.trim()) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

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

    // Update agent with rejection
    const updated = await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: AgentStatus.REJECTED,
        pendingChanges: false,
        rejectedAt: new Date(),
        rejectionReason: reason,
      },
    });

    // Notify the agent
    await prisma.notification.create({
      data: {
        userId: updated.userId,
        type: "AGENT_REJECTED",
        title: "Agent Application Rejected",
        message: `Your agent application was rejected: ${reason}`,
        link: `/agent/application`,
      },
    });

    return NextResponse.json({
      message: "Agent rejected successfully",
      agent: updated,
    });
  } catch (error) {
    console.error("Reject agent error:", error);
    return NextResponse.json(
      { error: "Failed to reject agent" },
      { status: 500 }
    );
  }
}
