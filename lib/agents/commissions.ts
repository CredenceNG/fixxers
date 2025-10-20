import { prisma } from "@/lib/prisma";
import { Decimal } from "@prisma/client/runtime/library";

/**
 * Agent Commission Calculation & Tracking
 *
 * Handles commission calculations, wallet credits, and commission history.
 */

export interface CommissionCalculation {
  orderAmount: Decimal;
  commissionPercentage: Decimal;
  commissionAmount: Decimal;
  netToFixer: Decimal;
}

/**
 * Calculate commission for an order
 */
export function calculateCommission(
  orderAmount: number | Decimal,
  commissionPercentage: number | Decimal
): CommissionCalculation {
  const amount = new Decimal(orderAmount);
  const percentage = new Decimal(commissionPercentage);

  const commissionAmount = amount.mul(percentage).div(100);
  const netToFixer = amount.sub(commissionAmount);

  return {
    orderAmount: amount,
    commissionPercentage: percentage,
    commissionAmount,
    netToFixer,
  };
}

/**
 * Record commission earned from an order
 */
export async function recordCommission(
  orderId: string,
  agentId: string,
  calculation: CommissionCalculation
) {
  const agent = await prisma.agent.findUnique({
    where: { userId: agentId },
    select: { id: true, commissionPercentage: true },
  });

  if (!agent) {
    throw new Error("Agent not found");
  }

  // Create commission record and update agent wallet in a transaction
  const commission = await prisma.$transaction(async (tx) => {
    // Create commission record
    const commission = await tx.agentCommission.create({
      data: {
        agentId: agent.id,
        orderId,
        type: "ORDER_COMMISSION",
        amount: calculation.commissionAmount,
        isPaid: false, // Will be true when agent withdraws
      },
    });

    // Update agent wallet balance
    await tx.agent.update({
      where: { id: agent.id },
      data: {
        walletBalance: {
          increment: calculation.commissionAmount,
        },
        totalEarned: {
          increment: calculation.commissionAmount,
        },
      },
    });

    return commission;
  });

  return commission;
}

/**
 * Get agent commission summary
 */
export async function getAgentCommissionSummary(agentId: string) {
  const agent = await prisma.agent.findUnique({
    where: { userId: agentId },
    select: {
      walletBalance: true,
      totalEarned: true,
      totalWithdrawn: true,
      commissionPercentage: true,
      commissions: {
        select: {
          id: true,
          amount: true,
          isPaid: true,
          paidAt: true,
          type: true,
          createdAt: true,
          order: {
            select: {
              id: true,
              totalAmount: true,
              status: true,
              fixer: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
    },
  });

  if (!agent) {
    throw new Error("Agent not found");
  }

  const pendingCommissions = await prisma.agentCommission.aggregate({
    where: {
      agent: { userId: agentId },
      isPaid: false,
    },
    _sum: {
      amount: true,
    },
  });

  const paidCommissions = await prisma.agentCommission.aggregate({
    where: {
      agent: { userId: agentId },
      isPaid: true,
    },
    _sum: {
      amount: true,
    },
  });

  return {
    walletBalance: agent.walletBalance,
    totalEarned: agent.totalEarned,
    totalWithdrawn: agent.totalWithdrawn,
    commissionPercentage: agent.commissionPercentage,
    pendingAmount: pendingCommissions._sum.amount || new Decimal(0),
    paidAmount: paidCommissions._sum.amount || new Decimal(0),
    recentCommissions: agent.commissions,
  };
}

/**
 * Get commission breakdown for a specific order
 */
export async function getOrderCommission(orderId: string) {
  const commission = await prisma.agentCommission.findFirst({
    where: { orderId },
    include: {
      agent: {
        select: {
          userId: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      order: {
        select: {
          id: true,
          totalAmount: true,
          status: true,
          fixer: {
            select: {
              id: true,
              name: true,
            },
          },
          client: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  return commission;
}

/**
 * Mark commissions as paid (when agent withdraws)
 */
export async function markCommissionsAsPaid(
  agentId: string,
  commissionIds: string[],
  withdrawalAmount: Decimal
) {
  const agent = await prisma.agent.findUnique({
    where: { userId: agentId },
    select: { id: true, walletBalance: true },
  });

  if (!agent) {
    throw new Error("Agent not found");
  }

  if (agent.walletBalance.lessThan(withdrawalAmount)) {
    throw new Error("Insufficient wallet balance");
  }

  await prisma.$transaction(async (tx) => {
    // Mark commissions as paid
    await tx.agentCommission.updateMany({
      where: {
        id: { in: commissionIds },
        agentId: agent.id,
        isPaid: false,
      },
      data: {
        isPaid: true,
        paidAt: new Date(),
      },
    });

    // Update agent wallet
    await tx.agent.update({
      where: { id: agent.id },
      data: {
        walletBalance: {
          decrement: withdrawalAmount,
        },
        totalWithdrawn: {
          increment: withdrawalAmount,
        },
      },
    });
  });
}

/**
 * Get agent earnings analytics
 */
export async function getAgentEarningsAnalytics(
  agentId: string,
  startDate?: Date,
  endDate?: Date
) {
  const whereClause: any = {
    agent: { userId: agentId },
  };

  if (startDate || endDate) {
    whereClause.createdAt = {};
    if (startDate) whereClause.createdAt.gte = startDate;
    if (endDate) whereClause.createdAt.lte = endDate;
  }

  const [totalStats, statusBreakdown, monthlyEarnings] = await Promise.all([
    // Total statistics
    prisma.agentCommission.aggregate({
      where: whereClause,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
      _avg: {
        amount: true,
      },
    }),

    // Breakdown by paid status
    prisma.agentCommission.groupBy({
      by: ["isPaid"],
      where: whereClause,
      _sum: {
        amount: true,
      },
      _count: {
        id: true,
      },
    }),

    // Monthly earnings (last 12 months)
    prisma.$queryRaw<
      Array<{ month: string; total: number; count: number }>
    >`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM') as month,
        SUM(amount::numeric)::float as total,
        COUNT(*)::int as count
      FROM "AgentCommission"
      WHERE "agentId" = (SELECT id FROM "Agent" WHERE "userId" = ${agentId})
        AND "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
    `,
  ]);

  return {
    total: {
      amount: totalStats._sum.amount || new Decimal(0),
      count: totalStats._count.id,
      average: totalStats._avg.amount || new Decimal(0),
    },
    byStatus: statusBreakdown.map((s) => ({
      status: s.isPaid ? "PAID" : "PENDING",
      amount: s._sum?.amount || new Decimal(0),
      count: s._count?.id || 0,
    })),
    monthlyTrend: monthlyEarnings,
  };
}

/**
 * Calculate potential commission for an order (before creation)
 */
export async function calculatePotentialCommission(
  agentId: string,
  orderAmount: number
): Promise<CommissionCalculation> {
  const agent = await prisma.agent.findUnique({
    where: { userId: agentId },
    select: { commissionPercentage: true },
  });

  if (!agent) {
    throw new Error("Agent not found");
  }

  return calculateCommission(orderAmount, agent.commissionPercentage);
}

/**
 * Fixer Bonus Tiers (based on total fixers managed)
 */
const FIXER_BONUS_TIERS = [
  { min: 1, max: 10, bonus: 50 },
  { min: 11, max: 25, bonus: 75 },
  { min: 26, max: 50, bonus: 100 },
  { min: 51, max: Infinity, bonus: 150 },
];

/**
 * Get fixer registration bonus amount based on agent's total fixers
 */
export function getFixerBonusAmount(totalFixers: number): number {
  const tier = FIXER_BONUS_TIERS.find(
    (t) => totalFixers >= t.min && totalFixers <= t.max
  );
  return tier?.bonus || 0;
}

/**
 * Check if fixer should receive registration bonus
 * (First completed order for agent-managed fixer)
 */
export async function shouldPayFixerBonus(
  orderId: string,
  agentFixerId: string
): Promise<boolean> {
  const agentFixer = await prisma.agentFixer.findUnique({
    where: { id: agentFixerId },
    select: {
      bonusPaid: true,
      firstOrderId: true,
    },
  });

  if (!agentFixer) return false;
  if (agentFixer.bonusPaid) return false;
  if (agentFixer.firstOrderId && agentFixer.firstOrderId !== orderId)
    return false;

  return true;
}

/**
 * Pay fixer registration bonus
 */
export async function payFixerBonus(
  agentFixerId: string,
  orderId: string
): Promise<void> {
  const agentFixer = await prisma.agentFixer.findUnique({
    where: { id: agentFixerId },
    include: {
      agent: true,
    },
  });

  if (!agentFixer) {
    throw new Error("AgentFixer relationship not found");
  }

  if (agentFixer.bonusPaid) {
    return; // Already paid
  }

  if (!agentFixer.agent.fixerBonusEnabled) {
    return; // Bonus not enabled for this agent
  }

  // Calculate bonus based on agent's total fixers
  const bonusAmount = getFixerBonusAmount(agentFixer.agent.totalFixersManaged);

  if (bonusAmount <= 0) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    // Create bonus commission record
    await tx.agentCommission.create({
      data: {
        agentId: agentFixer.agentId,
        agentFixerId: agentFixer.id,
        type: "FIXER_BONUS",
        amount: new Decimal(bonusAmount),
        isPaid: true,
        paidAt: new Date(),
      },
    });

    // Mark bonus as paid on AgentFixer
    await tx.agentFixer.update({
      where: { id: agentFixerId },
      data: {
        bonusPaid: true,
        bonusAmount: new Decimal(bonusAmount),
        bonusPaidAt: new Date(),
        firstOrderId: orderId,
      },
    });

    // Update agent wallet
    await tx.agent.update({
      where: { id: agentFixer.agentId },
      data: {
        walletBalance: {
          increment: bonusAmount,
        },
        totalEarned: {
          increment: bonusAmount,
        },
      },
    });

    // Notify agent
    await tx.notification.create({
      data: {
        userId: agentFixer.agent.userId,
        type: "AGENT_COMMISSION_EARNED",
        title: "Fixer Registration Bonus Earned",
        message: `You earned ₦${bonusAmount.toLocaleString()} bonus for your fixer completing their first order!`,
        link: "/agent/earnings",
      },
    });
  });
}
