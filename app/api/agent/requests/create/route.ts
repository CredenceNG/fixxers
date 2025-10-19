import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isActiveAgent } from "@/lib/agents/permissions";
import { canCreateClientRequest } from "@/lib/agents/permissions";

/**
 * POST /api/agent/requests/create - Create a service request on behalf of a managed client
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      clientId,
      subcategoryId,
      neighborhoodId,
      title,
      description,
      budget,
      urgency,
      images,
      preferredDate,
    } = body;

    if (!clientId || !subcategoryId || !neighborhoodId || !title || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if agent can create request for this client in this neighborhood
    const permission = await canCreateClientRequest(user.id, clientId, neighborhoodId);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason || "Cannot create request for this client" },
        { status: 403 }
      );
    }

    const agent = await prisma.agent.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    // Create service request in a transaction
    const serviceRequest = await prisma.$transaction(async (tx) => {
      // Create the service request
      const newRequest = await tx.serviceRequest.create({
        data: {
          clientId,
          subcategoryId,
          neighborhoodId,
          title,
          description,
          budget: budget || null,
          urgency: urgency || "MEDIUM",
          images: images || [],
          preferredDate: preferredDate ? new Date(preferredDate) : null,
          status: "OPEN",
        },
      });

      // Record that this request was created by an agent
      await tx.agentServiceRequest.create({
        data: {
          agentId: agent!.id,
          requestId: newRequest.id,
        },
      });

      return newRequest;
    });

    // Notify the client
    await prisma.notification.create({
      data: {
        userId: clientId,
        type: "GENERAL",
        title: "Service Request Created",
        message: `Your agent created a service request: "${title}". Fixers can now submit quotes.`,
        link: `/client/requests/${serviceRequest.id}`,
      },
    });

    // Find and notify relevant fixers in the neighborhood
    const fixers = await prisma.fixerService.findMany({
      where: {
        subcategoryId,
        neighborhood: {
          id: neighborhoodId,
        },
      },
      select: {
        fixerId: true,
      },
      take: 10, // Notify up to 10 relevant fixers
    });

    // Notify fixers about new request
    if (fixers.length > 0) {
      await prisma.notification.createMany({
        data: fixers.map((fixer) => ({
          userId: fixer.fixerId,
          type: "SERVICE_REQUEST_RECEIVED",
          title: "New Service Request",
          message: `New request in your area: "${title}". Submit a quote now!`,
          link: `/fixer/requests/${serviceRequest.id}`,
        })),
      });
    }

    return NextResponse.json({
      message: "Service request created successfully",
      request: serviceRequest,
    });
  } catch (error) {
    console.error("Create agent request error:", error);
    return NextResponse.json(
      { error: "Failed to create service request" },
      { status: 500 }
    );
  }
}
