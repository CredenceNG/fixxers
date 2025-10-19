import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendBadgeRejectionEmail } from "@/lib/emails/badge-emails";

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
    const { rejectionReason } = body;

    if (!rejectionReason || !rejectionReason.trim()) {
      return NextResponse.json(
        { error: "Rejection reason is required" },
        { status: 400 }
      );
    }

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

    // Check if already processed
    if (badgeRequest.status === "APPROVED") {
      return NextResponse.json(
        { error: "Cannot reject an approved request" },
        { status: 400 }
      );
    }

    if (badgeRequest.status === "REJECTED") {
      return NextResponse.json(
        { error: "This request has already been rejected" },
        { status: 400 }
      );
    }

    // Update the badge request
    const updatedRequest = await prisma.badgeRequest.update({
      where: { id: requestId },
      data: {
        status: "REJECTED",
        rejectionReason,
        reviewedAt: new Date(),
        reviewedBy: user.id,
      },
    });

    // TODO: Process refund if payment was made
    // if (badgeRequest.paymentStatus === 'PAID') {
    //   await processRefund({
    //     requestId: badgeRequest.id,
    //     amount: badgeRequest.paymentAmount,
    //     paymentReference: badgeRequest.paymentReference,
    //   });
    // }

    // Send email notification to fixer
    try {
      await sendBadgeRejectionEmail({
        to: badgeRequest.fixer.email!,
        fixerName: badgeRequest.fixer.name || "Fixer",
        badgeName: badgeRequest.badge.name,
        badgeIcon: badgeRequest.badge.icon,
        rejectionReason,
        refundAmount:
          badgeRequest.paymentStatus === "PAID"
            ? badgeRequest.paymentAmount
            : undefined,
        supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
        badgesUrl: `${process.env.NEXT_PUBLIC_APP_URL}/fixer/badges`,
      });
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error("Failed to send rejection email:", emailError);
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: "Badge request rejected successfully",
    });
  } catch (error) {
    console.error("Error rejecting badge request:", error);
    return NextResponse.json(
      { error: "Failed to reject badge request" },
      { status: 500 }
    );
  }
}
