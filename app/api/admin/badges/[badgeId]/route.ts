import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const prismaAny = prisma as any;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ badgeId: string }> }
) {
  try {
    const { badgeId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!currentUser.roles?.includes("ADMIN")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      name,
      description,
      icon,
      cost,
      isActive,
      expiryMonths,
      requiredDocuments,
      minJobsRequired,
      minAverageRating,
      maxCancellationRate,
      maxComplaintRate,
      maxResponseMinutes,
    } = body;

    // Validate badge exists
    const existingBadge = await prismaAny.badge.findUnique({
      where: { id: badgeId },
    });

    if (!existingBadge) {
      return NextResponse.json(
        { success: false, error: "Badge not found" },
        { status: 404 }
      );
    }

    // Validate required fields
    if (!name || !description || !icon || cost === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate cost is non-negative
    if (cost < 0) {
      return NextResponse.json(
        { success: false, error: "Cost cannot be negative" },
        { status: 400 }
      );
    }

    // Update badge
    const updatedBadge = await prismaAny.badge.update({
      where: { id: badgeId },
      data: {
        name,
        description,
        icon,
        cost: Math.round(cost), // Ensure integer (kobo)
        isActive,
        expiryMonths,
        requiredDocuments,
        minJobsRequired,
        minAverageRating,
        maxCancellationRate,
        maxComplaintRate,
        maxResponseMinutes,
      },
    });

    console.log(
      `[Badge Update] Badge ${badgeId} updated by admin ${currentUser.id}`
    );

    return NextResponse.json({
      success: true,
      message: "Badge updated successfully",
      badge: updatedBadge,
    });
  } catch (error) {
    console.error("[Badge Update] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update badge" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ badgeId: string }> }
) {
  try {
    const { badgeId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!currentUser.roles?.includes("ADMIN")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }

    const badge = await prismaAny.badge.findUnique({
      where: { id: badgeId },
      include: {
        _count: {
          select: {
            requests: true,
            assignments: true,
          },
        },
      },
    });

    if (!badge) {
      return NextResponse.json(
        { success: false, error: "Badge not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      badge,
    });
  } catch (error) {
    console.error("[Badge Get] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch badge" },
      { status: 500 }
    );
  }
}
