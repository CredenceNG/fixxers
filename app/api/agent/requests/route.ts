import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isActiveAgent } from "@/lib/agents/permissions";

/**
 * GET /api/agent/requests - Get all service requests from agent's managed clients
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

    const agent = await prisma.agent.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    if (!agent) {
      return NextResponse.json(
        { error: "Agent profile not found" },
        { status: 404 }
      );
    }

    // Get all service requests from agent's managed clients
    const requests = await prisma.serviceRequest.findMany({
      where: {
        client: {
          managedAsClientBy: {
            some: {
              agentId: agent.id,
            },
          },
        },
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
              include: {
                state: true,
              },
            },
          },
        },
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            quotes: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ requests });
  } catch (error) {
    console.error("Get agent requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch service requests" },
      { status: 500 }
    );
  }
}
