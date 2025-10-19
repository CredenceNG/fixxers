import { prisma } from "@/lib/prisma";
import { differenceInDays, addDays, isPast } from "date-fns";

export const REVIEW_WINDOW_DAYS = 30;

export interface ReviewWindowStatus {
  canLeaveReview: boolean;
  reason?: string;
  daysRemaining?: number;
  expiresAt?: Date;
}

/**
 * Check if a user can leave a review for a specific order
 * @param orderId - The ID of the order to check
 * @param userId - The ID of the user attempting to leave a review
 * @returns ReviewWindowStatus object with eligibility info
 */
export async function canLeaveReview(
  orderId: string,
  userId: string
): Promise<ReviewWindowStatus> {
  // Fetch order with related data
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      review: true,
      client: true,
      fixer: true,
    },
  });

  // Order doesn't exist
  if (!order) {
    return {
      canLeaveReview: false,
      reason: "Order not found",
    };
  }

  // User is not the client for this order
  if (order.clientId !== userId) {
    return {
      canLeaveReview: false,
      reason: "You are not authorized to review this order",
    };
  }

  // Order is not completed
  if (order.status !== "COMPLETED") {
    return {
      canLeaveReview: false,
      reason: "Order must be completed before leaving a review",
    };
  }

  // Review already exists
  if (order.review) {
    return {
      canLeaveReview: false,
      reason: "You have already reviewed this order",
    };
  }

  // Check if order was completed (using updatedAt as proxy for completion date)
  // In production, you might want a dedicated completedAt field
  const completionDate = order.updatedAt;
  const expiresAt = addDays(completionDate, REVIEW_WINDOW_DAYS);
  const daysRemaining = differenceInDays(expiresAt, new Date());

  // Review window has expired
  if (isPast(expiresAt)) {
    return {
      canLeaveReview: false,
      reason: `Review window expired ${Math.abs(daysRemaining)} days ago`,
      daysRemaining: 0,
      expiresAt,
    };
  }

  // All checks passed - user can leave a review
  return {
    canLeaveReview: true,
    daysRemaining: Math.max(0, daysRemaining),
    expiresAt,
  };
}

/**
 * Get the review window expiry date for an order
 * @param orderId - The ID of the order
 * @returns Date when the review window expires, or null if not applicable
 */
export async function getReviewWindowExpiry(
  orderId: string
): Promise<Date | null> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      status: true,
      updatedAt: true,
    },
  });

  if (!order || order.status !== "COMPLETED") {
    return null;
  }

  return addDays(order.updatedAt, REVIEW_WINDOW_DAYS);
}

/**
 * Get days remaining in review window
 * @param orderId - The ID of the order
 * @returns Number of days remaining, or null if not applicable
 */
export async function getDaysRemainingInWindow(
  orderId: string
): Promise<number | null> {
  const expiresAt = await getReviewWindowExpiry(orderId);

  if (!expiresAt) {
    return null;
  }

  if (isPast(expiresAt)) {
    return 0;
  }

  return differenceInDays(expiresAt, new Date());
}

/**
 * Get all orders that are eligible for review reminder emails
 * (Orders completed 3 days ago that don't have reviews yet)
 * @returns Array of orders eligible for review request emails
 */
export async function getOrdersEligibleForReviewRequest() {
  const threeDaysAgo = addDays(new Date(), -3);
  const thirtyDaysAgo = addDays(new Date(), -30);

  return await prisma.order.findMany({
    where: {
      status: "COMPLETED",
      updatedAt: {
        gte: thirtyDaysAgo,
        lte: threeDaysAgo,
      },
      review: null, // No review exists yet
    },
    include: {
      client: true,
      fixer: true,
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
  });
}

/**
 * Get all orders that are expiring soon (3 days before deadline)
 * @returns Array of orders with expiring review windows
 */
export async function getOrdersWithExpiringReviewWindow() {
  const twentySevenDaysAgo = addDays(new Date(), -27);
  const twentySixDaysAgo = addDays(new Date(), -26);

  return await prisma.order.findMany({
    where: {
      status: "COMPLETED",
      updatedAt: {
        gte: twentySevenDaysAgo,
        lte: twentySixDaysAgo,
      },
      review: null, // No review exists yet
    },
    include: {
      client: true,
      fixer: true,
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
  });
}
