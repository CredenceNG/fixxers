import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireStripe } from "@/lib/stripe";

const prismaAny = prisma as any;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const { requestId } = await params;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!user.roles?.includes("FIXER")) {
      return NextResponse.json(
        { error: "Only fixers can confirm badge payments" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { paymentIntentId } = body;

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: "Payment intent ID is required" },
        { status: 400 }
      );
    }

    // Get the badge request
    const badgeRequest = await prismaAny.badgeRequest.findUnique({
      where: { id: requestId },
      include: {
        badge: true,
      },
    });

    if (!badgeRequest) {
      return NextResponse.json(
        { error: "Badge request not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (badgeRequest.fixerId !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Check if payment already confirmed
    if (badgeRequest.paymentStatus === "PAID") {
      return NextResponse.json(
        { error: "Payment already confirmed" },
        { status: 400 }
      );
    }

    // Verify payment intent with Stripe
    const stripe = requireStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      return NextResponse.json(
        {
          error: "Payment has not been completed",
          paymentStatus: paymentIntent.status,
        },
        { status: 400 }
      );
    }

    // Verify amount matches
    if (paymentIntent.amount !== badgeRequest.paymentAmount) {
      console.error("[Badge Payment] Amount mismatch:", {
        expected: badgeRequest.paymentAmount,
        received: paymentIntent.amount,
      });
      return NextResponse.json(
        { error: "Payment amount mismatch" },
        { status: 400 }
      );
    }

    // Update badge request with payment info
    const updatedRequest = await prismaAny.badgeRequest.update({
      where: { id: requestId },
      data: {
        paymentStatus: "PAID",
        paymentRef: paymentIntentId,
        paidAt: new Date(),
        status: "PAYMENT_RECEIVED",
      },
      include: {
        badge: true,
      },
    });

    console.log(
      `[Badge Payment Confirmed] Request ${requestId} - ₦${
        badgeRequest.paymentAmount / 100
      } paid by fixer ${user.id}`
    );

    return NextResponse.json({
      success: true,
      request: updatedRequest,
    });
  } catch (error) {
    console.error("[Badge Payment Confirmation] Error:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    );
  }
}
