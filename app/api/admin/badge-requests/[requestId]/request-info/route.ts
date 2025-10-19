import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendBadgeMoreInfoEmail } from "@/lib/emails/badge-emails";

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

    if (!adminNotes || !adminNotes.trim()) {
      return NextResponse.json(
        { error: "Admin notes are required to request more information" },
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
        { error: "Cannot request info for an approved request" },
        { status: 400 }
      );
    }

    if (badgeRequest.status === "REJECTED") {
      return NextResponse.json(
        { error: "Cannot request info for a rejected request" },
        { status: 400 }
      );
    }

    // Update the badge request
    const updatedRequest = await prisma.badgeRequest.update({
      where: { id: requestId },
      data: {
        status: "MORE_INFO_NEEDED",
        adminNotes,
      },
    });

    // Send email notification to fixer
    try {
      await sendBadgeMoreInfoEmail({
        to: badgeRequest.fixer.email!,
        fixerName: badgeRequest.fixer.name || "Fixer",
        badgeName: badgeRequest.badge.name,
        badgeIcon: badgeRequest.badge.icon,
        adminNotes,
        requestUrl: `${process.env.NEXT_PUBLIC_APP_URL}/fixer/badges/requests/${badgeRequest.id}`,
        supportUrl: `${process.env.NEXT_PUBLIC_APP_URL}/support`,
      });
    } catch (emailError) {
      // Log email error but don't fail the request
      console.error("Failed to send more info email:", emailError);
    }

    return NextResponse.json({
      success: true,
      request: updatedRequest,
      message: "More information requested successfully",
    });
  } catch (error) {
    console.error("Error requesting more info:", error);
    return NextResponse.json(
      { error: "Failed to request more information" },
      { status: 500 }
    );
  }
}
