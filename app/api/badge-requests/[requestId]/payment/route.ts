/**
 * POST /api/badge-requests/[requestId]/payment
 *
 * Initialize payment for a badge request
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ requestId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const params = await paramsPromise;
    // Get the badge request
    const badgeRequest = await prisma.badgeRequest.findUnique({
      where: { id: params.requestId },
      include: { badge: true },
    });

    if (!badgeRequest) {
      return NextResponse.json(
        { success: false, error: "Badge request not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (badgeRequest.fixerId !== user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if already paid
    if (badgeRequest.paymentStatus === "PAID") {
      return NextResponse.json(
        { success: false, error: "Request already paid" },
        { status: 400 }
      );
    }

    // For now, we'll use a simple direct payment approach
    // In production, this would integrate with Paystack API

    // Generate payment reference
    const paymentRef = `BADGE_${badgeRequest.id}_${Date.now()}`;

    // Update request with payment reference
    await prisma.badgeRequest.update({
      where: { id: params.requestId },
      data: {
        paymentRef,
        status: "PENDING", // Will change to PAYMENT_RECEIVED after verification
      },
    });

    // Return payment details
    // In production, this would return Paystack payment URL
    return NextResponse.json({
      success: true,
      payment: {
        reference: paymentRef,
        amount: badgeRequest.paymentAmount,
        currency: "NGN",
        email: user.email,
        // For now, return a mock payment URL
        // In production: authorization_url from Paystack
        paymentUrl: `/fixer/badges/payment/${badgeRequest.id}`,
      },
    });
  } catch (error) {
    console.error("Error initializing payment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize payment",
      },
      { status: 500 }
    );
  }
}
