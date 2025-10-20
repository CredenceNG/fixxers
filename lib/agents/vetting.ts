import { prisma } from "@/lib/prisma";
import { VetStatus } from "@prisma/client";

/**
 * Agent Vetting Workflow
 *
 * Handles the vetting process for fixers and clients managed by agents.
 */

export interface VettingResult {
  vetId: string;
  status: VetStatus;
  approvedBy?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
}

/**
 * Submit a fixer for vetting by an agent
 */
export async function submitFixerForVetting(
  agentId: string,
  fixerId: string,
  notes?: string
) {
  // Verify the relationship exists
  const agentFixer = await prisma.agentFixer.findUnique({
    where: {
      agentId_fixerId: {
        agentId,
        fixerId,
      },
    },
    select: { id: true, vetStatus: true },
  });

  if (!agentFixer) {
    throw new Error("Agent-Fixer relationship not found");
  }

  if (agentFixer.vetStatus !== VetStatus.PENDING) {
    throw new Error(
      `Fixer vetting status is already ${agentFixer.vetStatus}`
    );
  }

  // Update vetting status to pending (ready for admin review)
  const updated = await prisma.agentFixer.update({
    where: { id: agentFixer.id },
    data: {
      vetStatus: VetStatus.PENDING,
      vetNotes: notes,
    },
    include: {
      agent: {
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      fixer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Create notification for all admins
  const admins = await prisma.user.findMany({
    where: {
      roles: {
        has: 'ADMIN',
      },
    },
    select: {
      id: true,
    },
  });

  // Send notification to each admin
  await Promise.all(
    admins.map((admin) =>
      prisma.notification.create({
        data: {
          userId: admin.id,
          type: "AGENT_FIXER_NEEDS_VETTING",
          title: "Fixer Ready for Admin Review",
          message: `Agent ${updated.agent.user.name} has submitted ${updated.fixer.name} for admin vetting approval`,
          link: `/admin/agents/${agentId}/fixers/${fixerId}/vet`,
        },
      })
    )
  );

  return updated;
}

/**
 * Approve a vetted fixer (Admin action)
 */
export async function approveVettedFixer(
  agentId: string,
  fixerId: string,
  approvedByUserId: string,
  notes?: string
) {
  const agentFixer = await prisma.agentFixer.findUnique({
    where: {
      agentId_fixerId: {
        agentId,
        fixerId,
      },
    },
    select: { id: true, vetStatus: true },
  });

  if (!agentFixer) {
    throw new Error("Agent-Fixer relationship not found");
  }

  if (agentFixer.vetStatus !== VetStatus.PENDING) {
    throw new Error("Fixer is not pending vetting approval");
  }

  const updated = await prisma.agentFixer.update({
    where: { id: agentFixer.id },
    data: {
      vetStatus: VetStatus.APPROVED,
      vettedById: approvedByUserId,
      vettedAt: new Date(),
      vetNotes: notes,
    },
    include: {
      agent: {
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      fixer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Notify the agent
  await prisma.notification.create({
    data: {
      userId: updated.agent.userId,
      type: "AGENT_APPROVED",
      title: "Fixer Vetting Approved",
      message: `${updated.fixer.name} has been approved for your management`,
      link: `/agent/fixers/${fixerId}`,
    },
  });

  return updated;
}

/**
 * Reject a vetted fixer (Admin action)
 */
export async function rejectVettedFixer(
  agentId: string,
  fixerId: string,
  reason: string
) {
  const agentFixer = await prisma.agentFixer.findUnique({
    where: {
      agentId_fixerId: {
        agentId,
        fixerId,
      },
    },
    select: { id: true, vetStatus: true },
  });

  if (!agentFixer) {
    throw new Error("Agent-Fixer relationship not found");
  }

  if (agentFixer.vetStatus !== VetStatus.PENDING) {
    throw new Error("Fixer is not pending vetting approval");
  }

  const updated = await prisma.agentFixer.update({
    where: { id: agentFixer.id },
    data: {
      vetStatus: VetStatus.REJECTED,
      vetNotes: reason,
    },
    include: {
      agent: {
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      fixer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Notify the agent
  await prisma.notification.create({
    data: {
      userId: updated.agent.userId,
      type: "AGENT_REJECTED",
      title: "Fixer Vetting Rejected",
      message: `${updated.fixer.name} was not approved: ${reason}`,
      link: `/agent/fixers/${fixerId}`,
    },
  });

  return updated;
}

/**
 * Get all fixers pending vetting (Admin view)
 */
export async function getPendingVettingRequests() {
  const pending = await prisma.agentFixer.findMany({
    where: {
      vetStatus: VetStatus.PENDING,
    },
    include: {
      agent: {
        select: {
          id: true,
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      fixer: {
        select: {
          id: true,
          name: true,
          email: true,
          fixerProfile: {
            select: {
              yearsOfService: true,
            },
          },
          fixerServices: {
            select: {
              subcategory: {
                select: {
                  name: true,
                  category: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      registeredAt: "asc",
    },
  });

  return pending;
}

/**
 * Get vetting status for a specific agent-fixer relationship
 */
export async function getVettingStatus(
  agentId: string,
  fixerId: string
): Promise<VettingResult> {
  const agentFixer = await prisma.agentFixer.findUnique({
    where: {
      agentId_fixerId: {
        agentId,
        fixerId,
      },
    },
    select: {
      id: true,
      vetStatus: true,
      vettedById: true,
      vettedAt: true,
      vetNotes: true,
    },
  });

  if (!agentFixer) {
    throw new Error("Agent-Fixer relationship not found");
  }

  return {
    vetId: agentFixer.id,
    status: agentFixer.vetStatus,
    approvedBy: agentFixer.vettedById || undefined,
    approvedAt: agentFixer.vettedAt || undefined,
    rejectedAt: agentFixer.vetStatus === VetStatus.REJECTED ? agentFixer.vettedAt || undefined : undefined,
    rejectionReason:
      agentFixer.vetStatus === VetStatus.REJECTED
        ? agentFixer.vetNotes || undefined
        : undefined,
  };
}

/**
 * Get all fixers managed by an agent with their vetting status
 */
export async function getAgentFixersWithVettingStatus(agentId: string) {
  const agentFixers = await prisma.agentFixer.findMany({
    where: {
      agentId,
    },
    include: {
      fixer: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          fixerProfile: {
            select: {
              yearsOfService: true,
            },
          },
          fixerServices: {
            select: {
              subcategory: {
                select: {
                  name: true,
                  category: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      registeredAt: "desc",
    },
  });

  return agentFixers.map((af) => ({
    relationshipId: af.id,
    fixer: af.fixer,
    vetStatus: af.vetStatus,
    vetting: {
      status: af.vetStatus,
      vettedAt: af.vettedAt,
      notes: af.vetNotes,
    },
    addedAt: af.registeredAt,
  }));
}

/**
 * Check if a fixer needs vetting before they can receive work
 */
export async function requiresVetting(
  agentId: string,
  fixerId: string
): Promise<boolean> {
  const agentFixer = await prisma.agentFixer.findUnique({
    where: {
      agentId_fixerId: {
        agentId,
        fixerId,
      },
    },
    select: { vetStatus: true },
  });

  if (!agentFixer) {
    return true; // Not managed by agent
  }

  // Only approved fixers can receive work
  return agentFixer.vetStatus !== VetStatus.APPROVED;
}
