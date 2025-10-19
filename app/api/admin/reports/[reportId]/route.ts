import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ReviewReportStatus } from "@prisma/client";

interface RouteParams {
  params: Promise<{
    reportId: string;
  }>;
}

// UPDATE report status
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();

    // Check if user is authenticated and is admin
    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in to perform this action" },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { roles: true },
    });

    if (!user?.roles?.includes("ADMIN")) {
      return NextResponse.json(
        { error: "You must be an admin to perform this action" },
        { status: 403 }
      );
    }

    const { reportId } = await params;
    const body = await request.json();
    const { status, resolution } = body;

    // Validate status
    if (!status || !Object.values(ReviewReportStatus).includes(status)) {
      return NextResponse.json(
        {
          error:
            "Invalid status. Must be PENDING, REVIEWING, RESOLVED, or DISMISSED",
        },
        { status: 400 }
      );
    }

    // Check if report exists
    const existingReport = await prisma.reviewReport.findUnique({
      where: { id: reportId },
      include: {
        review: true,
      },
    });

    if (!existingReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Update report status
    const updatedReport = await prisma.reviewReport.update({
      where: { id: reportId },
      data: {
        status,
        resolution: resolution || null,
        resolvedAt: status !== "PENDING" ? new Date() : null,
        resolvedBy: status !== "PENDING" ? currentUser.id : null,
      },
      include: {
        review: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
            reviewee: {
              select: {
                id: true,
                name: true,
                profileImage: true,
              },
            },
          },
        },
        reporter: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      report: updatedReport,
    });
  } catch (error) {
    console.error("Error updating report:", error);
    return NextResponse.json(
      { error: "Failed to update report" },
      { status: 500 }
    );
  }
}

// DELETE review (admin action from report)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const currentUser = await getCurrentUser();

    // Check if user is authenticated and is admin
    if (!currentUser) {
      return NextResponse.json(
        { error: "You must be logged in to perform this action" },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const user = await prisma.user.findUnique({
      where: { id: currentUser.id },
      select: { roles: true },
    });

    if (!user?.roles?.includes("ADMIN")) {
      return NextResponse.json(
        { error: "You must be an admin to perform this action" },
        { status: 403 }
      );
    }

    const { reportId } = await params;

    // Get report to find associated review
    const report = await prisma.reviewReport.findUnique({
      where: { id: reportId },
      select: { reviewId: true },
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Delete review and all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all helpful marks for this review
      await tx.reviewHelpful.deleteMany({
        where: { reviewId: report.reviewId },
      });

      // Delete all reports for this review
      await tx.reviewReport.deleteMany({
        where: { reviewId: report.reviewId },
      });

      // Delete the review itself
      await tx.review.delete({
        where: { id: report.reviewId },
      });
    });

    return NextResponse.json({
      success: true,
      message: "Review and all related data deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json(
      { error: "Failed to delete review" },
      { status: 500 }
    );
  }
}
