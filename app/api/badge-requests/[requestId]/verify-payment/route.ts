/**
 * POST /api/badge-requests/[requestId]/verify-payment
 *
 * Verify payment for a badge request (callback from payment provider)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ requestId: string }> }
) {
  try {
    const params = await paramsPromise;
    const { paymentRef, status } = await request.json();

    // Get the badge request
    const badgeRequest = await prisma.badgeRequest.findUnique({
      where: { id: params.requestId },
    });

    if (!badgeRequest) {
      return NextResponse.json(
        { success: false, error: "Badge request not found" },
        { status: 404 }
      );
    }

    // Verify payment reference matches
    if (badgeRequest.paymentRef !== paymentRef) {
      return NextResponse.json(
        { success: false, error: "Invalid payment reference" },
        { status: 400 }
      );
    }

    // In production, verify with Paystack API here
    // For now, accept if status is 'success'

    if (status === "success") {
      // Update badge request
      await prisma.badgeRequest.update({
        where: { id: params.requestId },
        data: {
          paymentStatus: "PAID",
          status: "PAYMENT_RECEIVED", // Ready for admin review
          paidAt: new Date(),
        },
      });

      // TODO: Send email notification to fixer and admin

      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
      });
    } else {
      return NextResponse.json(
        { success: false, error: "Payment verification failed" },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to verify payment",
      },
      { status: 500 }
    );
  }
}
