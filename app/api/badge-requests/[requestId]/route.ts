import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Temporary cast to avoid stale Prisma type errors
const prismaAny = prisma as any;

/**
 * GET /api/badge-requests/[requestId]
 *
 * Fetch a single badge request by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { requestId } = await params;

    console.log(
      "[Badge Request API] Fetching request:",
      requestId,
      "for user:",
      user.email
    );

    // Fetch the badge request
    const badgeRequest = await prismaAny.badgeRequest.findUnique({
      where: { id: requestId },
      include: {
        badge: true,
        fixer: {
          select: {
            id: true,
            email: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!badgeRequest) {
      console.log("[Badge Request API] Request not found:", requestId);
      return NextResponse.json(
        { success: false, error: "Badge request not found" },
        { status: 404 }
      );
    }

    // Ensure user is either the fixer who made the request or an admin
    const isAdmin = Array.isArray(user.roles)
      ? user.roles.includes("ADMIN")
      : user.roles === "ADMIN";
    const isFixer = badgeRequest.fixerId === user.id;

    console.log("[Badge Request API] Authorization check:", {
      isAdmin,
      isFixer,
      userId: user.id,
      fixerId: badgeRequest.fixerId,
    });

    if (!isAdmin && !isFixer) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    console.log("[Badge Request API] Request fetched successfully");

    return NextResponse.json({
      success: true,
      request: badgeRequest,
    });
  } catch (error) {
    console.error("[Badge Request API] Error fetching request:", error);
    console.error("[Badge Request API] Error details:", {
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      requestId: await params.then((p) => p.requestId).catch(() => "unknown"),
    });
    return NextResponse.json(
      { success: false, error: "Failed to fetch badge request" },
      { status: 500 }
    );
  }
}
