import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Temporary cast to avoid stale Prisma type errors
const prismaAny = prisma as any;

/**
 * DELETE /api/badge-requests/[requestId]/delete
 *
 * Delete a pending badge request (only allowed by the fixer who created it)
 */
export async function DELETE(
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

    // Fetch the badge request
    const badgeRequest = await prismaAny.badgeRequest.findUnique({
      where: { id: requestId },
    });

    if (!badgeRequest) {
      return NextResponse.json(
        { success: false, error: "Badge request not found" },
        { status: 404 }
      );
    }

    // Only the fixer who created the request can delete it
    if (badgeRequest.fixerId !== user.id) {
      return NextResponse.json(
        {
          success: false,
          error: "You can only delete your own badge requests",
        },
        { status: 403 }
      );
    }

    // Only allow deletion of pending requests
    if (
      badgeRequest.status !== "PENDING" &&
      badgeRequest.paymentStatus !== "PENDING"
    ) {
      return NextResponse.json(
        { success: false, error: "Only pending badge requests can be deleted" },
        { status: 400 }
      );
    }

    // Delete the badge request
    await prismaAny.badgeRequest.delete({
      where: { id: requestId },
    });

    console.log(
      `[Badge Request Delete] Fixer ${
        user.email || user.phone
      } deleted request ${requestId}`
    );

    return NextResponse.json({
      success: true,
      message: "Badge request deleted successfully",
    });
  } catch (error) {
    console.error("[Badge Request Delete] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete badge request" },
      { status: 500 }
    );
  }
}
