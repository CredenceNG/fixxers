/**
 * GET /api/badges
 *
 * Returns all active badges available for fixers to request
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const badges = await prisma.badge.findMany({
      where: {
        isActive: true,
      },
      orderBy: [
        { isAutomatic: "asc" }, // Manual badges first
        { cost: "asc" }, // Then by cost
      ],
    });

    return NextResponse.json({
      success: true,
      badges,
    });
  } catch (error) {
    console.error("Error fetching badges:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch badges",
      },
      { status: 500 }
    );
  }
}
