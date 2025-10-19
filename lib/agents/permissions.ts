import { prisma } from "@/lib/prisma";
import { AgentStatus } from "@prisma/client";

/**
 * Agent Permissions & Authorization
 *
 * Handles all permission checks for agent actions on behalf of fixers and clients.
 */

export interface AgentPermissionResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if user is an active agent
 */
export async function isActiveAgent(userId: string): Promise<boolean> {
  const agent = await prisma.agent.findUnique({
    where: { userId },
    select: { status: true },
  });

  return agent?.status === AgentStatus.ACTIVE;
}

/**
 * Check if agent can manage a specific fixer
 */
export async function canManageFixer(
  agentId: string,
  fixerId: string
): Promise<AgentPermissionResult> {
  const agent = await prisma.agent.findUnique({
    where: { userId: agentId },
    select: {
      status: true,
      managedFixers: {
        where: {
          fixerId,
          status: "ACTIVE",
        },
      },
    },
  });

  if (!agent) {
    return { allowed: false, reason: "Agent not found" };
  }

  if (agent.status !== AgentStatus.ACTIVE) {
    return { allowed: false, reason: "Agent is not active" };
  }

  if (agent.managedFixers.length === 0) {
    return { allowed: false, reason: "Fixer is not managed by this agent" };
  }

  return { allowed: true };
}

/**
 * Check if agent can manage a specific client
 */
export async function canManageClient(
  agentId: string,
  clientId: string
): Promise<AgentPermissionResult> {
  const agent = await prisma.agent.findUnique({
    where: { userId: agentId },
    select: {
      status: true,
      managedClients: {
        where: {
          clientId,
          status: "ACTIVE",
        },
      },
    },
  });

  if (!agent) {
    return { allowed: false, reason: "Agent not found" };
  }

  if (agent.status !== AgentStatus.ACTIVE) {
    return { allowed: false, reason: "Agent is not active" };
  }

  if (agent.managedClients.length === 0) {
    return { allowed: false, reason: "Client is not managed by this agent" };
  }

  return { allowed: true };
}

/**
 * Check if agent can create/manage a gig for a fixer
 */
export async function canManageFixerGig(
  agentId: string,
  fixerId: string,
  gigId?: string
): Promise<AgentPermissionResult> {
  // First check if agent can manage this fixer
  const fixerPermission = await canManageFixer(agentId, fixerId);
  if (!fixerPermission.allowed) {
    return fixerPermission;
  }

  // If editing an existing gig, verify it belongs to the fixer and was created by this agent
  if (gigId) {
    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      select: {
        sellerId: true,
        agentGig: {
          select: { agentId: true },
        },
      },
    });

    if (!gig) {
      return { allowed: false, reason: "Gig not found" };
    }

    if (gig.sellerId !== fixerId) {
      return { allowed: false, reason: "Gig does not belong to this fixer" };
    }

    if (gig.agentGig?.agentId !== agentId) {
      return {
        allowed: false,
        reason: "Gig was not created by this agent",
      };
    }
  }

  return { allowed: true };
}

/**
 * Check if agent can submit a quote on behalf of a fixer
 */
export async function canSubmitFixerQuote(
  agentId: string,
  fixerId: string,
  requestId: string
): Promise<AgentPermissionResult> {
  // Check if agent can manage this fixer
  const fixerPermission = await canManageFixer(agentId, fixerId);
  if (!fixerPermission.allowed) {
    return fixerPermission;
  }

  // Verify the service request is in the agent's approved neighborhoods
  const [agent, request] = await Promise.all([
    prisma.agent.findUnique({
      where: { userId: agentId },
      select: {
        approvedNeighborhoods: {
          select: { id: true },
        },
      },
    }),
    prisma.serviceRequest.findUnique({
      where: { id: requestId },
      select: { neighborhoodId: true, status: true },
    }),
  ]);

  if (!request) {
    return { allowed: false, reason: "Service request not found" };
  }

  if (request.status !== "OPEN") {
    return { allowed: false, reason: "Service request is not open" };
  }

  const approvedNeighborhoodIds =
    agent?.approvedNeighborhoods.map((n) => n.id) || [];
  if (!approvedNeighborhoodIds.includes(request.neighborhoodId)) {
    return {
      allowed: false,
      reason: "Service request is outside agent's approved territory",
    };
  }

  return { allowed: true };
}

/**
 * Check if agent can create a service request on behalf of a client
 */
export async function canCreateClientRequest(
  agentId: string,
  clientId: string,
  neighborhoodId: string
): Promise<AgentPermissionResult> {
  // Check if agent can manage this client
  const clientPermission = await canManageClient(agentId, clientId);
  if (!clientPermission.allowed) {
    return clientPermission;
  }

  // Verify the neighborhood is in the agent's approved territory
  const agent = await prisma.agent.findUnique({
    where: { userId: agentId },
    select: {
      approvedNeighborhoods: {
        select: { id: true },
      },
    },
  });

  const approvedNeighborhoodIds =
    agent?.approvedNeighborhoods.map((n) => n.id) || [];
  if (!approvedNeighborhoodIds.includes(neighborhoodId)) {
    return {
      allowed: false,
      reason: "Neighborhood is outside agent's approved territory",
    };
  }

  return { allowed: true };
}

/**
 * Check if agent can operate in a specific neighborhood
 */
export async function canOperateInNeighborhood(
  agentId: string,
  neighborhoodId: string
): Promise<boolean> {
  const agent = await prisma.agent.findUnique({
    where: { userId: agentId },
    select: {
      status: true,
      approvedNeighborhoods: {
        where: { id: neighborhoodId },
        select: { id: true },
      },
    },
  });

  return (
    agent?.status === AgentStatus.ACTIVE &&
    agent.approvedNeighborhoods.length > 0
  );
}

/**
 * Get all neighborhoods an agent can operate in
 */
export async function getAgentNeighborhoods(agentId: string) {
  const agent = await prisma.agent.findUnique({
    where: { userId: agentId },
    select: {
      approvedNeighborhoods: {
        select: {
          id: true,
          name: true,
          city: true,
          state: true,
          country: true,
        },
      },
    },
  });

  return agent?.approvedNeighborhoods || [];
}

/**
 * Check if agent has reached their client limit
 * Note: Currently no limit enforced - returns false
 */
export async function hasReachedClientLimit(agentId: string): Promise<boolean> {
  // No client limit currently enforced
  return false;
}

/**
 * Check if agent has reached their fixer limit
 * Note: Currently no limit enforced - returns false
 */
export async function hasReachedFixerLimit(agentId: string): Promise<boolean> {
  // No fixer limit currently enforced
  return false;
}
