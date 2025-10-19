import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isActiveAgent, hasReachedFixerLimit } from "@/lib/agents/permissions";
import { VetStatus } from "@prisma/client";

/**
 * GET /api/agent/fixers - Get all fixers managed by the agent
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

    const fixers = await prisma.agentFixer.findMany({
      where: { agentId: agent!.id },
      include: {
        fixer: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            fixerProfile: {
              select: {
                businessName: true,
                yearsOfExperience: true,
                approvalStatus: true,
                services: {
                  select: {
                    subcategory: {
                      select: {
                        id: true,
                        name: true,
                        category: {
                          select: {
                            id: true,
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
        },
      },
      orderBy: { registeredAt: "desc" },
    });

    return NextResponse.json({ fixers });
  } catch (error) {
    console.error("Get agent fixers error:", error);
    return NextResponse.json(
      { error: "Failed to fetch fixers" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/agent/fixers - Add a fixer to agent's management
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

    // Check fixer limit
    const reachedLimit = await hasReachedFixerLimit(user.id);
    if (reachedLimit) {
      return NextResponse.json(
        { error: "Maximum fixer limit reached" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { fixerId, name, email, phone, secondaryPhone, streetAddress, neighbourhood, city, state, country, vetNotes } = body;

    let actualFixerId = fixerId;

    // Case 1: Creating new fixer
    if (!fixerId && name && email && phone) {
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

      // Validate required fields for FixerProfile
      if (!neighbourhood || !city || !state) {
        return NextResponse.json(
          { error: "Location (neighbourhood, city, state) is required for new fixers" },
          { status: 400 }
        );
      }

      // Use transaction to ensure user and agent-fixer relationship are created together
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Create new user with FIXER role
          const newFixer = await tx.user.create({
            data: {
              email,
              name,
              phone,
              roles: ['FIXER'],
              fixerProfile: {
                create: {
                  primaryPhone: phone,
                  secondaryPhone: secondaryPhone || undefined,
                  streetAddress: streetAddress || undefined,
                  neighbourhood,
                  city,
                  state,
                  country: country || 'Nigeria',
                  yearsOfService: 0,
                  pendingChanges: true,
                },
              },
            },
          });

          // Create agent-fixer relationship
          const agentFixer = await tx.agentFixer.create({
            data: {
              agentId: agent!.id,
              fixerId: newFixer.id,
              vetStatus: VetStatus.PENDING,
              vetNotes: vetNotes || undefined,
            },
            include: {
              fixer: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  profileImage: true,
                },
              },
            },
          });

          // Notify the fixer
          await tx.notification.create({
            data: {
              userId: newFixer.id,
              type: "AGENT_APPLICATION_SUBMITTED",
              title: "Agent Added You",
              message: `You are now managed by ${user.name}. They can create gigs and submit quotes on your behalf.`,
              link: `/fixer/agents`,
            },
          });

          return { agentFixer };
        });

        return NextResponse.json({
          message: "Fixer added successfully",
          agentFixer: result.agentFixer,
        });
      } catch (txError: any) {
        // If transaction fails, nothing is saved
        console.error("Transaction error:", txError);
        throw txError; // Re-throw to be handled by outer catch
      }
    }
    // Case 2: Adding existing fixer by ID
    else if (!actualFixerId) {
      return NextResponse.json(
        { error: "Fixer ID or registration data is required" },
        { status: 400 }
      );
    }

    // Verify fixer exists (for existing fixer case)
    if (fixerId) {
      const fixer = await prisma.user.findUnique({
        where: { id: fixerId },
        include: {
          fixerProfile: true,
        },
      });

      if (!fixer || !fixer.fixerProfile) {
        return NextResponse.json(
          { error: "Fixer not found or not approved" },
          { status: 404 }
        );
      }
    }

    // Check if relationship already exists
    const existing = await prisma.agentFixer.findUnique({
      where: {
        agentId_fixerId: {
          agentId: agent!.id,
          fixerId: actualFixerId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Fixer is already managed by this agent" },
        { status: 400 }
      );
    }

    // Create agent-fixer relationship
    const agentFixer = await prisma.agentFixer.create({
      data: {
        agentId: agent!.id,
        fixerId: actualFixerId,
        vetStatus: VetStatus.PENDING,
        vetNotes: vetNotes || undefined,
      },
      include: {
        fixer: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
          },
        },
      },
    });

    // Notify the fixer
    await prisma.notification.create({
      data: {
        userId: actualFixerId,
        type: "AGENT_APPLICATION_SUBMITTED",
        title: "Agent Added You",
        message: `You are now managed by ${user.name}. They can create gigs and submit quotes on your behalf.`,
        link: `/fixer/agents`,
      },
    });

    return NextResponse.json({
      message: "Fixer added successfully",
      agentFixer,
    });
  } catch (error: any) {
    // Log the full error for debugging
    console.error("Add agent fixer error:", error);
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
      { error: "Failed to add fixer. Please try again or contact support if the problem persists." },
      { status: 500 }
    );
  }
}
