import { NextRequest, NextResponse } from "next/server";
import { batchUpdateAllFixerResponseTimes } from "@/lib/quick-wins/response-time";

/**
 * Cron Job: Update Fixer Response Times
 *
 * This endpoint is called daily by Vercel Cron to update
 * all fixers' average response times based on their quotes.
 *
 * Schedule: Daily at 2:00 AM UTC (via vercel.json)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      console.error("[Cron] CRON_SECRET environment variable not set");
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    if (authHeader !== `Bearer ${cronSecret}`) {
      console.error("[Cron] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Cron] Starting batch update of fixer response times...");

    const startTime = Date.now();
    const result = await batchUpdateAllFixerResponseTimes();
    const duration = Date.now() - startTime;

    console.log(`[Cron] Batch update completed in ${duration}ms`);
    console.log(`[Cron] Updated: ${result.successCount} fixers`);
    console.log(`[Cron] Errors: ${result.errorCount} fixers`);

    return NextResponse.json({
      success: true,
      updated: result.successCount,
      errors: result.errorCount,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron] Error updating fixer response times:", error);
    return NextResponse.json(
      {
        error: "Failed to update response times",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Allow GET for manual testing (only in development)
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "GET method not allowed in production" },
      { status: 405 }
    );
  }

  // In development, allow GET with authorization
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Call the POST handler for testing
  return POST(request);
}
