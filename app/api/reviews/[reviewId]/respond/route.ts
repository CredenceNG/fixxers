import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";
import { render } from "@react-email/render";

const resend = new Resend(process.env.RESEND_API_KEY);

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
    const { responseText } = body;

    // Validation
    if (!responseText || typeof responseText !== "string") {
      return NextResponse.json(
        { error: "Response text is required" },
        { status: 400 }
      );
    }

    const trimmedResponse = responseText.trim();

    if (trimmedResponse.length < 10) {
      return NextResponse.json(
        { error: "Response must be at least 10 characters" },
        { status: 400 }
      );
    }

    if (trimmedResponse.length > 1000) {
      return NextResponse.json(
        { error: "Response must be less than 1000 characters" },
        { status: 400 }
      );
    }

    // Get the review and verify the user is the reviewee (fixer)
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        reviewee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
          select: {
            id: true,
            request: {
              select: {
                title: true,
              },
            },
            gig: {
              select: {
                title: true,
              },
            },
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Verify the user is the reviewee (the fixer who received the review)
    if (review.revieweeId !== user.id) {
      return NextResponse.json(
        { error: "You can only respond to reviews you received" },
        { status: 403 }
      );
    }

    // Update the review with the response
    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        responseText: trimmedResponse,
        respondedAt: new Date(),
      },
      include: {
        reviewee: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
      },
    });

    // TODO: Send email notification to reviewer (client) about the response
    // This could be implemented as a follow-up feature
    try {
      if (review.reviewer.email && !review.isAnonymous) {
        // Get service name
        let serviceName = "the service";
        if (review.order.request) {
          serviceName = review.order.request.title;
        } else if (review.order.gig) {
          serviceName = review.order.gig.title;
        }

        // Note: We'll create this email template later if needed
        // For now, just log that we would send an email
        console.log(
          `Would send email to ${review.reviewer.email} about response to their review`
        );
      }
    } catch (emailError) {
      // Log email error but don't fail the response creation
      console.error("Failed to send response notification email:", emailError);
    }

    return NextResponse.json(
      {
        success: true,
        review: {
          id: updatedReview.id,
          responseText: updatedReview.responseText,
          respondedAt: updatedReview.respondedAt,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error responding to review:", error);
    return NextResponse.json(
      { error: "Failed to respond to review" },
      { status: 500 }
    );
  }
}

// DELETE endpoint to remove a response
export async function DELETE(
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

    // Get the review and verify ownership
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        revieweeId: true,
        responseText: true,
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    // Verify the user is the reviewee
    if (review.revieweeId !== user.id) {
      return NextResponse.json(
        { error: "You can only delete your own responses" },
        { status: 403 }
      );
    }

    if (!review.responseText) {
      return NextResponse.json(
        { error: "No response to delete" },
        { status: 400 }
      );
    }

    // Remove the response
    await prisma.review.update({
      where: { id: reviewId },
      data: {
        responseText: null,
        respondedAt: null,
      },
    });

    return NextResponse.json(
      { success: true, message: "Response deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting response:", error);
    return NextResponse.json(
      { error: "Failed to delete response" },
      { status: 500 }
    );
  }
}
