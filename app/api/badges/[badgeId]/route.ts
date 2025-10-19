/**
 * GET /api/badges/[badgeId]
 *
 * Returns detailed information about a specific badge
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ badgeId: string }> }
) {
  try {
    const params = await paramsPromise;
    const badge = await prisma.badge.findUnique({
      where: {
        id: params.badgeId,
      },
    });

    if (!badge) {
      return NextResponse.json(
        {
          success: false,
          error: "Badge not found",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      badge,
    });
  } catch (error) {
    console.error("Error fetching badge:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch badge",
      },
      { status: 500 }
    );
  }
}
