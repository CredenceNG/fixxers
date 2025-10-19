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

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, helpfulCount: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Check if user already marked this review as helpful
    const existingMark = await prisma.reviewHelpful.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: user.id,
        },
      },
    });

    if (existingMark) {
      // User already marked as helpful - remove the mark (toggle)
      await prisma.$transaction([
        prisma.reviewHelpful.delete({
          where: { id: existingMark.id },
        }),
        prisma.review.update({
          where: { id: reviewId },
          data: {
            helpfulCount: {
              decrement: 1,
            },
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        action: "removed",
        helpfulCount: review.helpfulCount - 1,
      });
    } else {
      // Mark as helpful
      await prisma.$transaction([
        prisma.reviewHelpful.create({
          data: {
            reviewId,
            userId: user.id,
          },
        }),
        prisma.review.update({
          where: { id: reviewId },
          data: {
            helpfulCount: {
              increment: 1,
            },
          },
        }),
      ]);

      return NextResponse.json({
        success: true,
        action: "added",
        helpfulCount: review.helpfulCount + 1,
      });
    }
  } catch (error) {
    console.error("Error toggling helpful mark:", error);
    return NextResponse.json(
      { error: "Failed to update helpful status" },
      { status: 500 }
    );
  }
}

// GET endpoint to check if current user marked review as helpful
export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ isHelpful: false });
    }

    const params = await paramsPromise;
    const { reviewId } = params;

    const existingMark = await prisma.reviewHelpful.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId: user.id,
        },
      },
    });

    return NextResponse.json({
      isHelpful: !!existingMark,
    });
  } catch (error) {
    console.error("Error checking helpful status:", error);
    return NextResponse.json({ isHelpful: false });
  }
}
