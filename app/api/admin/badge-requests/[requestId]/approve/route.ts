import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendBadgeApprovalEmail } from "@/lib/emails/badge-emails";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { requestId } = await params;

    if (!user || !user.roles.includes("ADMIN")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { adminNotes } = body;

    // Get the badge request
    const badgeRequest = await prisma.badgeRequest.findUnique({
      where: { id: requestId },
      include: {
        badge: true,
        fixer: true,
      },
    });

    if (!badgeRequest) {
      return NextResponse.json(
        { error: "Badge request not found" },
        { status: 404 }
      );
    }

    // Verify payment has been received
    if (badgeRequest.paymentStatus !== "PAID") {
      return NextResponse.json(
        { error: "Payment has not been confirmed" },
        { status: 400 }
      );
    }

    // Check if already approved
    if (badgeRequest.status === "APPROVED") {
      return NextResponse.json(
        { error: "This request has already been approved" },
        { status: 400 }
      );
    }

    // Calculate expiry date
    const expiresAt = badgeRequest.badge.expiryMonths
      ? (() => {
          const date = new Date();
          date.setMonth(date.getMonth() + badgeRequest.badge.expiryMonths);
          return date;
        })()
      : null;

    // Start transaction: Update request, create assignment, update fixer tier
    const result = await prisma.$transaction(async (tx) => {
      // Update the badge request
      const updatedRequest = await tx.badgeRequest.update({
        where: { id: requestId },
        data: {
          status: "APPROVED",
          adminNotes: adminNotes || null,
          reviewedAt: new Date(),
          reviewedBy: user.id,
        },
      });

      // Create badge assignment
      const assignment = await tx.badgeAssignment.create({
        data: {
          fixerId: badgeRequest.fixerId,
          badgeId: badgeRequest.badgeId,
          requestId: badgeRequest.id,
          status: "ACTIVE",
          assignedAt: new Date(),
          expiresAt,
        },
      });

      // Get all active badges for the fixer to update tier
      const activeBadges = await tx.badgeAssignment.count({
        where: {
          fixerId: badgeRequest.fixerId,
          status: "ACTIVE",
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      // Calculate new tier
      let newTier = "BRONZE";
      if (activeBadges >= 5) {
        newTier = "GOLD";
      } else if (activeBadges >= 3) {
        newTier = "SILVER";
      }

      // Update fixer's badge tier
      await tx.user.update({
        where: { id: badgeRequest.fixerId },
        data: {
          badgeTier: newTier,
          lastTierUpdate: new Date(),
        },
      });

      return { updatedRequest, assignment, newTier, activeBadges };
    });

    // Send email notification to fixer
    try {
      await sendBadgeApprovalEmail({
        to: badgeRequest.fixer.email!,
        fixerName: badgeRequest.fixer.name || "Fixer",
        badgeName: badgeRequest.badge.name,
        badgeIcon: badgeRequest.badge.icon,
        expiresAt,
        newTier: result.newTier,
        activeBadges: result.activeBadges,
        profileUrl: `${process.env.NEXT_PUBLIC_APP_URL}/profile/${badgeRequest.fixerId}`,
      });
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error("Failed to send approval email:", emailError);
    }

    return NextResponse.json({
      success: true,
      assignment: result.assignment,
      newTier: result.newTier,
      activeBadges: result.activeBadges,
      message: "Badge request approved successfully",
    });
  } catch (error) {
    console.error("Error approving badge request:", error);
    return NextResponse.json(
      { error: "Failed to approve badge request" },
      { status: 500 }
    );
  }
}
