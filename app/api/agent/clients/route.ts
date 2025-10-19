import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isActiveAgent, hasReachedClientLimit } from "@/lib/agents/permissions";

/**
 * GET /api/agent/clients - Get all clients managed by the agent
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

    const clients = await prisma.agentClient.findMany({
      where: { agentId: agent!.id },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            createdAt: true,
          },
        },
      },
      orderBy: { addedAt: "desc" },
    });

    return NextResponse.json({ clients });
  } catch (error) {
    console.error("Get agent clients error:", error);
    return NextResponse.json(
      { error: "Failed to fetch clients" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agent/clients - Add a client to agent's management
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

    const agent = await prisma.agent.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    // Check client limit
    const reachedLimit = await hasReachedClientLimit(user.id);
    if (reachedLimit) {
      return NextResponse.json(
        { error: "Maximum client limit reached" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { clientId, clientEmail, notes, name, email, phone, password, secondaryPhone, alternateEmail, streetAddress, neighbourhood, city, state, country } = body;

    let actualClientId = clientId;

    // Case 1: Adding existing client by email
    if (clientEmail && !clientId) {
      const existingClient = await prisma.user.findUnique({
        where: { email: clientEmail },
      });

      if (!existingClient) {
        return NextResponse.json(
          { error: "Client with this email not found" },
          { status: 404 }
        );
      }

      actualClientId = existingClient.id;
    }
    // Case 2: Creating new client
    else if (!clientId && name && email) {
      // Check if email or phone already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email },
            { phone },
          ],
        },
      });

      if (existingUser) {
        if (existingUser.email === email) {
          return NextResponse.json(
            { error: "A user with this email already exists" },
            { status: 400 }
          );
        }
        if (existingUser.phone === phone) {
          return NextResponse.json(
            { error: "A user with this phone number already exists" },
            { status: 400 }
          );
        }
      }

      // Validate required fields for ClientProfile
      if (!phone) {
        return NextResponse.json(
          { error: "Primary phone is required for new clients" },
          { status: 400 }
        );
      }

      if (!neighbourhood || !city || !state) {
        return NextResponse.json(
          { error: "Location (neighbourhood, city, state) is required for new clients" },
          { status: 400 }
        );
      }

      // Use transaction to ensure user and agent-client relationship are created together
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Create new user with CLIENT role
          const newClient = await tx.user.create({
            data: {
              email,
              name,
              phone,
              roles: ['CLIENT'],
              clientProfile: {
                create: {
                  primaryPhone: phone,
                  secondaryPhone: secondaryPhone || undefined,
                  alternateEmail: alternateEmail || undefined,
                  streetAddress: streetAddress || undefined,
                  neighbourhood,
                  city,
                  state,
                  country: country || 'Nigeria',
                },
              },
            },
          });

          // Create agent-client relationship
          const agentClient = await tx.agentClient.create({
            data: {
              agentId: agent!.id,
              clientId: newClient.id,
              notes,
            },
            include: {
              client: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profileImage: true,
                },
              },
            },
          });

          // Notify the client
          await tx.notification.create({
            data: {
              userId: newClient.id,
              type: "AGENT_APPLICATION_SUBMITTED",
              title: "Agent Added You",
              message: `You are now managed by ${user.name}. They can create service requests on your behalf.`,
              link: `/client/agents`,
            },
          });

          return { agentClient, clientId: newClient.id };
        });

        return NextResponse.json({
          message: "Client added successfully",
          agentClient: result.agentClient,
        });
      } catch (txError: any) {
        // If transaction fails, nothing is saved
        console.error("Transaction error:", txError);
        throw txError; // Re-throw to be handled by outer catch
      }
    }
    // Case 3: Direct client ID provided
    else if (!actualClientId) {
      return NextResponse.json(
        { error: "Client ID or email is required" },
        { status: 400 }
      );
    }

    // For existing client case (Case 1 and Case 3)
    // Verify client exists
    const client = await prisma.user.findUnique({
      where: { id: actualClientId },
    });

    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Check if relationship already exists
    const existing = await prisma.agentClient.findUnique({
      where: {
        agentId_clientId: {
          agentId: agent!.id,
          clientId: actualClientId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Client is already managed by this agent" },
        { status: 400 }
      );
    }

    // Create agent-client relationship
    const agentClient = await prisma.agentClient.create({
      data: {
        agentId: agent!.id,
        clientId: actualClientId,
        notes,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    // Notify the client
    await prisma.notification.create({
      data: {
        userId: actualClientId,
        type: "AGENT_APPLICATION_SUBMITTED",
        title: "Agent Added You",
        message: `You are now managed by ${user.name}. They can create service requests on your behalf.`,
        link: `/client/agents`,
      },
    });

    return NextResponse.json({
      message: "Client added successfully",
      agentClient,
    });
  } catch (error: any) {
    // Log the full error for debugging
    console.error("Add agent client error:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);

    // Handle Prisma unique constraint errors (duplicate email/phone)
    if (error.code === 'P2002') {
      const field = error.meta?.target?.[0];
      if (field === 'email') {
        return NextResponse.json(
          { error: "A user with this email already exists" },
          { status: 400 }
        );
      }
      if (field === 'phone') {
        return NextResponse.json(
          { error: "A user with this phone number already exists" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: "A user with these details already exists" },
        { status: 400 }
      );
    }

    // Handle Prisma validation errors (wrong field names, missing required fields)
    if (error.code === 'P2009' || error.name === 'PrismaClientValidationError') {
      console.error("Validation error details:", error);
      return NextResponse.json(
        { error: "Invalid data provided. Please check all required fields are filled correctly." },
        { status: 400 }
      );
    }

    // Return user-friendly message while logging technical details
    return NextResponse.json(
      { error: "Failed to add client. Please try again or contact support if the problem persists." },
      { status: 500 }
    );
  }
}
