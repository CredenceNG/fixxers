/**
 * Calculate Response Times for Existing Quotes
 *
 * This script retroactively calculates response times for quotes
 * that were created before this feature was added.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function calculateExistingResponseTimes() {
  console.log("🚀 Calculating response times for existing quotes...\n");

  try {
    // Get all quotes with their request creation times
    const quotes = await prisma.quote.findMany({
      where: {
        responseTimeMinutes: null, // Only quotes without response time
      },
      include: {
        request: {
          select: {
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    console.log(`📊 Found ${quotes.length} quotes without response times\n`);

    if (quotes.length === 0) {
      console.log("✅ All quotes already have response times!");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const quote of quotes) {
      try {
        // Calculate response time
        const responseTimeMinutes = Math.floor(
          (quote.createdAt.getTime() - quote.request.createdAt.getTime()) /
            (1000 * 60)
        );

        // Update quote
        await prisma.quote.update({
          where: { id: quote.id },
          data: { responseTimeMinutes },
        });

        const hours = Math.round(responseTimeMinutes / 60);
        const display =
          responseTimeMinutes < 60 ? `${responseTimeMinutes}min` : `${hours}h`;

        console.log(`✅ Quote ${quote.id.substring(0, 8)}: ${display}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error updating quote ${quote.id}:`, error);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ Successfully calculated ${successCount} response times`);
    if (errorCount > 0) {
      console.log(`❌ Failed to calculate ${errorCount} response times`);
    }
    console.log("=".repeat(50));

    // Now update fixer average response times
    console.log("\n🔄 Updating fixer average response times...\n");

    const fixers = await prisma.user.findMany({
      where: {
        roles: { has: "FIXER" },
        fixerQuotes: {
          some: {
            responseTimeMinutes: { not: null },
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    console.log(`📊 Found ${fixers.length} fixers with quotes\n`);

    let fixerSuccessCount = 0;
    let fixerErrorCount = 0;

    for (const fixer of fixers) {
      try {
        // Get all quotes from this fixer
        const fixerQuotes = await prisma.quote.findMany({
          where: {
            fixerId: fixer.id,
            responseTimeMinutes: { not: null },
          },
          select: { responseTimeMinutes: true },
          orderBy: { createdAt: "desc" },
          take: 50, // Last 50 quotes
        });

        if (fixerQuotes.length === 0) continue;

        // Calculate average
        const totalMinutes = fixerQuotes.reduce(
          (sum, q) => sum + (q.responseTimeMinutes || 0),
          0
        );
        const averageMinutes = Math.round(totalMinutes / fixerQuotes.length);

        // Update fixer profile
        await prisma.fixerProfile.update({
          where: { fixerId: fixer.id },
          data: { averageResponseMinutes: averageMinutes },
        });

        const hours = Math.round(averageMinutes / 60);
        const display =
          averageMinutes < 60 ? `${averageMinutes}min` : `${hours}h`;

        console.log(
          `✅ ${fixer.name}: ${display} (from ${fixerQuotes.length} quotes)`
        );
        fixerSuccessCount++;
      } catch (error) {
        console.error(`❌ Error updating ${fixer.name}:`, error);
        fixerErrorCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ Successfully updated ${fixerSuccessCount} fixer profiles`);
    if (fixerErrorCount > 0) {
      console.log(`❌ Failed to update ${fixerErrorCount} fixer profiles`);
    }
    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ Fatal error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
calculateExistingResponseTimes()
  .then(() => {
    console.log("\n🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
