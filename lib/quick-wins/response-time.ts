/**
 * Quick Win: Response Time Utilities
 *
 * Utilities to calculate and track fixer response times
 */

import { prisma } from "@/lib/prisma";

/**
 * Calculate response time for a new quote
 * Call this when a fixer submits a quote
 */
export async function calculateQuoteResponseTime(
  quoteId: string,
  requestId: string
): Promise<number | null> {
  try {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      select: { createdAt: true },
    });

    if (!request) return null;

    const now = new Date();
    const responseTimeMinutes = Math.floor(
      (now.getTime() - request.createdAt.getTime()) / (1000 * 60)
    );

    // Update the quote with response time
    await prisma.quote.update({
      where: { id: quoteId },
      data: { responseTimeMinutes },
    });

    return responseTimeMinutes;
  } catch (error) {
    console.error("Error calculating quote response time:", error);
    return null;
  }
}

/**
 * Update fixer's average response time
 * Call this after a new quote is submitted or periodically
 */
export async function updateFixerAverageResponseTime(
  fixerId: string
): Promise<number | null> {
  try {
    // Get all quotes from this fixer with response times
    const quotes = await prisma.quote.findMany({
      where: {
        fixerId,
        responseTimeMinutes: { not: null },
      },
      select: { responseTimeMinutes: true },
      orderBy: { createdAt: "desc" },
      take: 50, // Last 50 quotes for more recent average
    });

    if (quotes.length === 0) return null;

    // Calculate average
    const totalMinutes = quotes.reduce(
      (sum, quote) => sum + (quote.responseTimeMinutes || 0),
      0
    );
    const averageMinutes = Math.round(totalMinutes / quotes.length);

    // Update fixer profile
    await prisma.fixerProfile.update({
      where: { fixerId },
      data: { averageResponseMinutes: averageMinutes },
    });

    return averageMinutes;
  } catch (error) {
    console.error("Error updating fixer average response time:", error);
    return null;
  }
}

/**
 * Get response time category for display
 */
export function getResponseTimeCategory(minutes: number): {
  label: string;
  color: string;
  icon: string;
} {
  if (minutes < 60) {
    return {
      label: "Lightning Fast",
      color: "green",
      icon: "⚡",
    };
  } else if (minutes < 180) {
    return {
      label: "Fast",
      color: "blue",
      icon: "✓",
    };
  } else if (minutes < 720) {
    return {
      label: "Good",
      color: "yellow",
      icon: "⏱️",
    };
  } else {
    return {
      label: "Standard",
      color: "gray",
      icon: "📋",
    };
  }
}

/**
 * Format response time for display
 */
export function formatResponseTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  } else if (minutes < 1440) {
    const hours = Math.round(minutes / 60);
    return `${hours} ${hours === 1 ? "hour" : "hours"}`;
  } else {
    const days = Math.round(minutes / 1440);
    return `${days} ${days === 1 ? "day" : "days"}`;
  }
}

/**
 * Batch update all fixers' average response times
 * Run this as a cron job daily
 */
export async function batchUpdateAllFixerResponseTimes() {
  console.log("🔄 Starting batch update of fixer response times...");

  try {
    // Get all fixers who have submitted quotes
    const fixers = await prisma.user.findMany({
      where: {
        roles: { has: "FIXER" },
        fixerQuotes: { some: {} },
      },
      select: { id: true, name: true },
    });

    console.log(`📊 Found ${fixers.length} fixers with quotes`);

    let successCount = 0;
    let errorCount = 0;

    for (const fixer of fixers) {
      try {
        const avgMinutes = await updateFixerAverageResponseTime(fixer.id);

        if (avgMinutes !== null) {
          console.log(`✅ ${fixer.name}: ${formatResponseTime(avgMinutes)}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating ${fixer.name}:`, error);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ Successfully updated ${successCount} fixers`);
    if (errorCount > 0) {
      console.log(`❌ Failed to update ${errorCount} fixers`);
    }
    console.log("=".repeat(50));

    return { successCount, errorCount };
  } catch (error) {
    console.error("❌ Fatal error in batch update:", error);
    throw error;
  }
}
