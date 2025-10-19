import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AgentStatus } from "@prisma/client";

/**
 * GET /api/admin/agents/applications - Get all agent applications
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    const roles = user?.roles || [];
    if (!user || !roles.includes("ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const applications = await prisma.agent.findMany({
      where: {
        OR: [
          { status: AgentStatus.PENDING },
          { pendingChanges: true },
        ],
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
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
        _count: {
          select: {
            managedFixers: true,
            managedClients: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ applications });
  } catch (error) {
    console.error("Get agent applications error:", error);
    return NextResponse.json(
      { error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}
