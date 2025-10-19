import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgentStatus } from "@prisma/client";

/**
 * POST /api/agent/application - Apply to become an agent
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has an agent profile
    const existingAgent = await prisma.agent.findUnique({
      where: { userId: user.id },
    });

    if (existingAgent) {
      return NextResponse.json(
        { error: "Agent application already exists" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { businessName, requestedNeighborhoodIds } = body;

    if (!businessName || !requestedNeighborhoodIds?.length) {
      return NextResponse.json(
        { error: "Business name and neighborhoods are required" },
        { status: 400 }
      );
    }

    // Verify neighborhoods exist
    const neighborhoods = await prisma.neighborhood.findMany({
      where: { id: { in: requestedNeighborhoodIds } },
    });

    if (neighborhoods.length !== requestedNeighborhoodIds.length) {
      return NextResponse.json(
        { error: "Invalid neighborhood IDs provided" },
        { status: 400 }
      );
    }

    // Create agent profile with PENDING status
    const agent = await prisma.agent.create({
      data: {
        userId: user.id,
        businessName,
        requestedNeighborhoodIds,
        status: AgentStatus.PENDING,
        pendingChanges: true,
      },
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

    // Create notification for admins
    const admins = await prisma.user.findMany({
      where: { roles: { has: "ADMIN" } },
      select: { id: true },
    });

    await prisma.notification.createMany({
      data: admins.map((admin) => ({
        userId: admin.id,
        type: "AGENT_APPLICATION_SUBMITTED",
        title: "New Agent Application",
        message: `${user.name} has applied to become an agent`,
        link: `/admin/agents/${agent.id}`,
      })),
    });

    return NextResponse.json({
      message: "Agent application submitted successfully",
      agent,
    });
  } catch (error) {
    console.error("Agent application error:", error);
    return NextResponse.json(
      { error: "Failed to submit application" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/agent/application - Get current user's agent application status
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agent = await prisma.agent.findUnique({
      where: { userId: user.id },
      include: {
        approvedNeighborhoods: {
          select: {
            id: true,
            name: true,
            city: true,
            state: true,
          },
        },
      },
    });

    if (!agent) {
      return NextResponse.json(
        { error: "No agent application found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ agent });
  } catch (error) {
    console.error("Get agent application error:", error);
    return NextResponse.json(
      { error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}
