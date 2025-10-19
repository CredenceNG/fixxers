/**
 * Trust Badges System - Utility Functions
 *
 * Helper functions for badge operations including tier calculation,
 * badge eligibility checks, and badge management.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Badge tier type (define locally since it may not be in Prisma yet)
export type BadgeTier = "BRONZE" | "SILVER" | "GOLD" | "PLATINUM";

// Badge status type
export type BadgeStatus = "ACTIVE" | "EXPIRED" | "REVOKED";

/**
 * Calculate badge tier based on number of active badges (simple version)
 *
 * Tiers:
 * - BRONZE: 1-2 active badges
 * - SILVER: 3-4 active badges
 * - GOLD: 5+ badges
 * - PLATINUM: 5+ badges + Top 5% performer (calculated separately)
 */
export function calculateBadgeTierFromCount(
  badgeCount: number
): BadgeTier | null {
  if (badgeCount === 0) return null;
  if (badgeCount >= 1 && badgeCount <= 2) return "BRONZE";
  if (badgeCount >= 3 && badgeCount <= 4) return "SILVER";
  if (badgeCount >= 5) return "GOLD"; // Default to GOLD, PLATINUM requires additional checks
  return null;
}

/**
 * Calculate badge tier based on number of active badges
 *
 * Tiers:
 * - BRONZE: 1-2 active badges
 * - SILVER: 3-4 active badges
 * - GOLD: All 5 badges
 * - PLATINUM: All 5 badges + Top 5% performer
 */
export async function calculateBadgeTier(
  fixerId: string
): Promise<BadgeTier | null> {
  try {
    // Count active badges
    const activeBadges = await prisma.badgeAssignment.count({
      where: {
        fixerId: fixerId,
        expiresAt: { gt: new Date() }, // Not expired
      },
    });

    if (activeBadges === 0) return null;
    if (activeBadges >= 1 && activeBadges <= 2) return "BRONZE";
    if (activeBadges >= 3 && activeBadges <= 4) return "SILVER";

    // For GOLD/PLATINUM, need all 5 badges
    if (activeBadges >= 5) {
      // Check if top 5% performer
      const isTopPerformer = await checkTopPerformerStatus(fixerId);
      return isTopPerformer ? "PLATINUM" : "GOLD";
    }

    return null;
  } catch (error) {
    console.error("Error calculating badge tier:", error);
    return null;
  }
}

/**
```
 * Check if fixer is in top 5% of performers
 *
 * Weighted scoring:
 * - Total jobs completed (30%)
 * - Average rating (25%)
 * - Response time (20%)
 * - Client satisfaction (15%)
 * - Platform tenure (10%)
 */
export async function checkTopPerformerStatus(
  fixerId: string
): Promise<boolean> {
  const fixer = await prisma.user.findUnique({
    where: { id: fixerId },
    include: {
      fixerProfile: true,
      reviewsReceived: {
        where: { isVisible: true },
      },
      fixerOrders: {
        where: { status: "COMPLETED" },
      },
    },
  });

  if (!fixer || !fixer.fixerProfile) return false;

  // Get all fixers for percentile calculation
  const allFixers = await prisma.user.findMany({
    where: {
      roles: { has: "FIXER" },
      fixerProfile: { isNot: null },
    },
    include: {
      fixerProfile: true,
      reviewsReceived: {
        where: { isVisible: true },
      },
      fixerOrders: {
        where: { status: "COMPLETED" },
      },
    },
  });

  // Calculate scores for all fixers
  const scores = allFixers.map((f) => {
    const jobsCompleted = f.fixerProfile?.totalJobsCompleted || 0;
    const avgRating =
      f.reviewsReceived.length > 0
        ? f.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) /
          f.reviewsReceived.length
        : 0;
    const responseMinutes = f.fixerProfile?.averageResponseMinutes || 999;
    const satisfaction = f.reviewsReceived.filter((r) => r.rating >= 4).length;
    const tenure = Math.floor(
      (Date.now() - new Date(f.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    ); // days

    // Normalize and weight
    const score =
      (jobsCompleted / 100) * 0.3 + // Jobs (max 100 for normalization)
      (avgRating / 5) * 0.25 + // Rating (max 5)
      (1 - Math.min(responseMinutes, 240) / 240) * 0.2 + // Response (inverse, max 4 hours)
      (satisfaction / Math.max(f.reviewsReceived.length, 1)) * 0.15 + // Satisfaction %
      (Math.min(tenure, 365) / 365) * 0.1; // Tenure (max 1 year)

    return { fixerId: f.id, score };
  });

  // Sort by score descending
  scores.sort((a, b) => b.score - a.score);

  // Find fixer's rank
  const fixerRank = scores.findIndex((s) => s.fixerId === fixerId);
  if (fixerRank === -1) return false;

  // Check if in top 5%
  const top5PercentThreshold = Math.ceil(scores.length * 0.05);
  return fixerRank < top5PercentThreshold;
}

/**
 * Check if fixer meets Quality Performance badge criteria
 */
export async function checkQualityPerformanceCriteria(
  fixerId: string
): Promise<{
  eligible: boolean;
  reasons: string[];
}> {
  const fixer = await prisma.user.findUnique({
    where: { id: fixerId },
    include: {
      fixerProfile: true,
      fixerOrders: {
        where: {
          OR: [
            { status: "COMPLETED" },
            { status: "CANCELLED" },
            { status: "DISPUTED" },
          ],
        },
      },
      reviewsReceived: {
        where: { isVisible: true },
      },
    },
  });

  if (!fixer || !fixer.fixerProfile) {
    return { eligible: false, reasons: ["Fixer profile not found"] };
  }

  const reasons: string[] = [];
  const profile = fixer.fixerProfile;

  // Get Quality Performance badge criteria
  const qualityBadge = await prisma.badge.findFirst({
    where: { type: "QUALITY_PERFORMANCE" },
  });

  if (!qualityBadge) {
    return { eligible: false, reasons: ["Quality badge not configured"] };
  }

  // Check minimum jobs
  if (
    qualityBadge.minJobsRequired &&
    profile.totalJobsCompleted < qualityBadge.minJobsRequired
  ) {
    reasons.push(
      `Need ${qualityBadge.minJobsRequired} completed jobs (have ${profile.totalJobsCompleted})`
    );
  }

  // Check average rating
  const avgRating =
    fixer.reviewsReceived.length > 0
      ? fixer.reviewsReceived.reduce((sum, r) => sum + r.rating, 0) /
        fixer.reviewsReceived.length
      : 0;

  if (
    qualityBadge.minAverageRating &&
    avgRating < qualityBadge.minAverageRating
  ) {
    reasons.push(
      `Need ${
        qualityBadge.minAverageRating
      }+ star rating (have ${avgRating.toFixed(1)})`
    );
  }

  // Check response time
  if (
    qualityBadge.maxResponseMinutes &&
    profile.averageResponseMinutes &&
    profile.averageResponseMinutes > qualityBadge.maxResponseMinutes
  ) {
    reasons.push(
      `Response time too slow (${profile.averageResponseMinutes} min, need <${qualityBadge.maxResponseMinutes} min)`
    );
  }

  // Check cancellation rate
  const cancelledOrders = fixer.fixerOrders.filter(
    (o) => o.status === "CANCELLED"
  ).length;
  const totalOrders = fixer.fixerOrders.length;
  const cancellationRate = totalOrders > 0 ? cancelledOrders / totalOrders : 0;

  if (
    qualityBadge.maxCancellationRate &&
    cancellationRate > qualityBadge.maxCancellationRate
  ) {
    reasons.push(
      `Cancellation rate too high (${(cancellationRate * 100).toFixed(
        1
      )}%, need <${(qualityBadge.maxCancellationRate * 100).toFixed(0)}%)`
    );
  }

  // Note: Complaint rate would require a complaints table - skip for now

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

/**
 * Update fixer's badge tier
 */
export async function updateFixerBadgeTier(fixerId: string): Promise<void> {
  const tier = await calculateBadgeTier(fixerId);

  await prisma.user.update({
    where: { id: fixerId },
    data: {
      badgeTier: tier,
      lastTierUpdate: new Date(),
    },
  });
}

/**
 * Get fixer's active badges
 */
export async function getFixerActiveBadges(fixerId: string) {
  return await prisma.badgeAssignment.findMany({
    where: {
      fixerId,
      status: "ACTIVE",
      OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
    },
    include: {
      badge: true,
    },
    orderBy: {
      assignedAt: "desc",
    },
  });
}

/**
 * Check if badge is expiring soon (within 30 days)
 */
export function isExpiringSoon(expiresAt: Date | null): boolean {
  if (!expiresAt) return false;

  const daysUntilExpiry = Math.floor(
    (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
}

/**
 * Get badge display name with tier
 */
export function getBadgeDisplayName(
  badgeName: string,
  tier: BadgeTier | null
): string {
  if (!tier) return badgeName;

  const tierLabels = {
    ["BRONZE"]: "Verified",
    ["SILVER"]: "Trusted Professional",
    ["GOLD"]: "Premium Verified",
    ["PLATINUM"]: "Elite Professional",
  };

  return tierLabels[tier];
}

/**
 * Get tier color for styling
 */
export function getTierColor(tier: BadgeTier | null): string {
  if (!tier) return "#6B7280"; // Gray

  const colors = {
    ["BRONZE"]: "#CD7F32",
    ["SILVER"]: "#C0C0C0",
    ["GOLD"]: "#FFD700",
    ["PLATINUM"]: "#E5E4E2",
  };

  return colors[tier];
}

/**
 * Format price in Naira (from kobo)
 */
export function formatBadgePrice(kobo: number): string {
  const naira = kobo / 100;
  return `₦${naira.toLocaleString("en-NG")}`;
}
