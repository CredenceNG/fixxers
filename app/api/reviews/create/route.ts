import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canLeaveReview } from "@/lib/utils/review-window";
import { Resend } from "resend";
import { render } from "@react-email/render";
import ReviewReceivedEmail from "@/emails/review-received";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderId, fixerId, rating, comment, photos, isAnonymous } = body;

    // Validation
    if (!orderId || !fixerId) {
      return NextResponse.json(
        { error: "Order ID and Fixer ID are required" },
        { status: 400 }
      );
    }

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Rating must be between 1 and 5 stars" },
        { status: 400 }
      );
    }

    if (!comment || comment.trim().length < 50) {
      return NextResponse.json(
        { error: "Review comment must be at least 50 characters" },
        { status: 400 }
      );
    }

    if (comment.trim().length > 2000) {
      return NextResponse.json(
        { error: "Review comment must be less than 2000 characters" },
        { status: 400 }
      );
    }

    if (photos && photos.length > 5) {
      return NextResponse.json(
        { error: "Maximum 5 photos allowed" },
        { status: 400 }
      );
    }

    // Check if user can leave a review
    const reviewStatus = await canLeaveReview(orderId, user.id);

    if (!reviewStatus.canLeaveReview) {
      return NextResponse.json(
        { error: reviewStatus.reason || "Cannot leave review for this order" },
        { status: 403 }
      );
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        orderId,
        reviewerId: user.id,
        revieweeId: fixerId,
        rating,
        comment: comment.trim(),
        photos: photos || [],
        isVerified: true, // Verified because it's linked to a completed order
        isAnonymous: isAnonymous || false,
      },
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
            email: true,
          },
        },
        order: {
          select: {
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

    // Send notification email to fixer about new review
    try {
      if (review.reviewee.email) {
        // Get service name
        let serviceName = "your service";
        if (review.order.request) {
          serviceName = review.order.request.title;
        } else if (review.order.gig) {
          serviceName = review.order.gig.title;
        }

        // Truncate comment for email preview
        const commentExcerpt =
          review.comment && review.comment.length > 100
            ? review.comment.substring(0, 100) + "..."
            : review.comment || "";

        const emailHtml = await render(
          ReviewReceivedEmail({
            fixerName: review.reviewee.name || "Service Provider",
            rating: review.rating,
            commentExcerpt,
            reviewerName: review.reviewer.name || "Client",
            isAnonymous: review.isAnonymous,
            reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/reviews`,
            orderId,
            serviceName,
          })
        );

        await resend.emails.send({
          from: "Fixers <noreply@fixxers.com>",
          to: review.reviewee.email,
          subject: "You received a new review",
          html: emailHtml,
        });
      }
    } catch (emailError) {
      // Log email error but don't fail the review creation
      console.error("Failed to send review notification email:", emailError);
    }

    return NextResponse.json(
      {
        success: true,
        review: {
          id: review.id,
          rating: review.rating,
          comment: review.comment,
          photos: review.photos,
          isAnonymous: review.isAnonymous,
          createdAt: review.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
