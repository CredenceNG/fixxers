import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgentStatus } from "@prisma/client";

/**
 * POST /api/admin/agents/[agentId]/suspend - Suspend an active agent
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
        { error: "Suspension reason is required" },
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

    // Update agent with suspension
    const updated = await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: AgentStatus.SUSPENDED,
        suspendedAt: new Date(),
        suspensionReason: reason,
      },
    });

    // Notify the agent
    await prisma.notification.create({
      data: {
        userId: updated.userId,
        type: "AGENT_REJECTED",
        title: "Agent Account Suspended",
        message: `Your agent account has been suspended: ${reason}`,
        link: `/agent/dashboard`,
      },
    });

    return NextResponse.json({
      message: "Agent suspended successfully",
      agent: updated,
    });
  } catch (error) {
    console.error("Suspend agent error:", error);
    return NextResponse.json(
      { error: "Failed to suspend agent" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/agents/[agentId]/suspend - Unsuspend an agent (restore to active)
 */
export async function DELETE(
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

    const agent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return NextResponse.json(
        { error: "Agent not found" },
        { status: 404 }
      );
    }

    if (agent.status !== AgentStatus.SUSPENDED) {
      return NextResponse.json(
        { error: "Agent is not suspended" },
        { status: 400 }
      );
    }

    // Restore agent to active status
    const updated = await prisma.agent.update({
      where: { id: agentId },
      data: {
        status: AgentStatus.ACTIVE,
        suspendedAt: null,
        suspensionReason: null,
      },
    });

    // Notify the agent
    await prisma.notification.create({
      data: {
        userId: updated.userId,
        type: "AGENT_APPROVED",
        title: "Agent Account Restored",
        message: `Your agent account has been restored and is now active.`,
        link: `/agent/dashboard`,
      },
    });

    return NextResponse.json({
      message: "Agent unsuspended successfully",
      agent: updated,
    });
  } catch (error) {
    console.error("Unsuspend agent error:", error);
    return NextResponse.json(
      { error: "Failed to unsuspend agent" },
      { status: 500 }
    );
  }
}
