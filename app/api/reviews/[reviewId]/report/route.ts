import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const params = await paramsPromise;
    const { reviewId } = params;
    const body = await request.json();
    const { reason } = body;

    // Validation
    if (!reason || typeof reason !== "string") {
      return NextResponse.json(
        { error: "Report reason is required" },
        { status: 400 }
      );
    }

    const trimmedReason = reason.trim();

    if (trimmedReason.length < 10) {
      return NextResponse.json(
        { error: "Report reason must be at least 10 characters" },
        { status: 400 }
      );
    }

    if (trimmedReason.length > 500) {
      return NextResponse.json(
        { error: "Report reason must be less than 500 characters" },
        { status: 400 }
      );
    }

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, reportCount: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Check if user already reported this review
    const existingReport = await prisma.reviewReport.findFirst({
      where: {
        reviewId,
        reportedBy: user.id,
      },
    });

    if (existingReport) {
      return NextResponse.json(
        { error: "You have already reported this review" },
        { status: 400 }
      );
    }

    // Create report and increment count
    await prisma.$transaction([
      prisma.reviewReport.create({
        data: {
          reviewId,
          reportedBy: user.id,
          reason: trimmedReason,
          status: "PENDING",
        },
      }),
      prisma.review.update({
        where: { id: reviewId },
        data: {
          reportCount: {
            increment: 1,
          },
        },
      }),
    ]);

    return NextResponse.json(
      {
        success: true,
        message: "Report submitted successfully. We'll review it shortly.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error reporting review:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}
