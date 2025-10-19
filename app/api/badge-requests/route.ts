/**
 * POST /api/badge-requests
 *
 * Create a new badge request for a fixer
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireStripe } from "@/lib/stripe";
import { strictLimiter, getClientIdentifier, rateLimitResponse } from "@/lib/ratelimit";

// Temporary cast to avoid stale Prisma type errors
const prismaAny = prisma as any;

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Apply strict rate limiting for badge requests (10 per hour per user)
    const identifier = getClientIdentifier(request, user.id);
    const rateLimitResult = await strictLimiter.limit(identifier);

    if (!rateLimitResult.success) {
      return rateLimitResponse(rateLimitResult);
    }

    const body = await request.json();
    console.log(
      "[Badge Request API] Received body:",
      JSON.stringify(body, null, 2)
    );
    const { badgeId, documents, notes } = body;

    // Validate request data
    if (!badgeId) {
      console.log("[Badge Request API] Error: Missing badgeId");
      return NextResponse.json(
        { success: false, error: "Badge ID is required" },
        { status: 400 }
      );
    }

    if (!documents || !Array.isArray(documents) || documents.length === 0) {
      console.log("[Badge Request API] Error: Invalid documents array", {
        documents,
      });
      return NextResponse.json(
        { success: false, error: "Documents are required" },
        { status: 400 }
      );
    }

    // Verify fixer role
    console.log("[Badge Request API] Checking user role:", user.roles);
    if (!user.roles.includes("FIXER")) {
      console.log("[Badge Request API] Error: User is not a FIXER");
      return NextResponse.json(
        { success: false, error: "Only fixers can request badges" },
        { status: 403 }
      );
    }

    // Get badge details
    console.log("[Badge Request API] Looking up badge:", badgeId);
    const badge = await prismaAny.badge.findUnique({
      where: { id: badgeId },
    });

    if (!badge) {
      console.log("[Badge Request API] Error: Badge not found");
      return NextResponse.json(
        { success: false, error: "Badge not found" },
        { status: 404 }
      );
    }

    if (!badge.isActive) {
      console.log("[Badge Request API] Error: Badge is inactive");
      return NextResponse.json(
        { success: false, error: "Badge is inactive" },
        { status: 404 }
      );
    }

    // Check if automatic badge (shouldn't be manually requested)
    if (badge.isAutomatic) {
      console.log("[Badge Request API] Error: Badge is automatic");
      return NextResponse.json(
        { success: false, error: "This badge is automatically awarded" },
        { status: 400 }
      );
    }

    console.log("[Badge Request API] Badge validated:", badge.name);

    // Check if already has active badge assignment
    console.log("[Badge Request API] Checking for existing assignment...");
    const existingAssignment = await prismaAny.badgeAssignment.findFirst({
      where: {
        fixerId: user.id,
        badgeId,
        status: "ACTIVE",
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
    });

    if (existingAssignment) {
      console.log("[Badge Request API] Error: User already has this badge");
      return NextResponse.json(
        { success: false, error: "You already have this badge" },
        { status: 400 }
      );
    }

    // Check if pending request exists
    console.log("[Badge Request API] Checking for pending request...");
    const pendingRequest = await prismaAny.badgeRequest.findFirst({
      where: {
        fixerId: user.id,
        badgeId,
        status: {
          in: ["PENDING", "PAYMENT_RECEIVED", "UNDER_REVIEW"],
        },
      },
    });

    if (pendingRequest) {
      console.log(
        "[Badge Request API] Error: User already has pending request"
      );
      return NextResponse.json(
        {
          success: false,
          error: "You already have a pending request for this badge",
        },
        { status: 400 }
      );
    }

    console.log(
      "[Badge Request API] All validations passed. Creating badge request..."
    );

    // Create Stripe PaymentIntent first
    console.log("[Badge Request API] Creating Stripe PaymentIntent...");
    const stripe = requireStripe();

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(badge.cost), // Already in kobo
        currency: "ngn",
        metadata: {
          badgeId: badge.id,
          badgeName: badge.name,
          badgeType: badge.type,
          fixerId: user.id,
          fixerEmail: user.email || "",
          fixerPhone: user.phone || "",
          paymentType: "BADGE_VERIFICATION",
        },
        description: `Badge verification fee: ${badge.name}`,
        automatic_payment_methods: {
          enabled: true,
        },
      });
      console.log(
        `[Badge Payment Intent] Created: ${paymentIntent.id} - ₦${
          badge.cost / 100
        } for badge ${badge.name}`
      );
    } catch (stripeError) {
      console.error("[Badge Request API] Stripe error:", stripeError);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to create payment intent. Please try again.",
        },
        { status: 500 }
      );
    }

    // Create badge request with payment details
    console.log("[Badge Request API] Creating badge request in database...");
    const badgeRequest = await prismaAny.badgeRequest.create({
      data: {
        fixerId: user.id,
        badgeId,
        documents: documents.map((doc: any) => ({
          ...doc,
          uploadedAt: new Date().toISOString(),
        })),
        notes: notes || null,
        paymentAmount: badge.cost,
        paymentStatus: "PENDING",
        paymentRef: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        status: "PENDING",
      },
      include: {
        badge: true,
      },
    });

    console.log("[Badge Request API] Created badge request:", badgeRequest.id);

    return NextResponse.json({
      success: true,
      request: badgeRequest,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: badge.cost,
    });
  } catch (error) {
    console.error("[Badge Request API] Error creating badge request:", error);

    // Provide more detailed error message
    let errorMessage = "Failed to create badge request";
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("[Badge Request API] Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/badge-requests
 *
 * Get all badge requests for the current fixer
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const requests = await prismaAny.badgeRequest.findMany({
      where: {
        fixerId: user.id,
      },
      include: {
        badge: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      requests,
    });
  } catch (error) {
    console.error("Error fetching badge requests:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch badge requests",
      },
      { status: 500 }
    );
  }
}
