import { prisma } from './prisma';
import { Prisma, TransactionType } from '@prisma/client';

/**
 * Get or create platform purse (userId = null)
 */
export async function getPlatformPurse(tx?: Prisma.TransactionClient) {
  const db = tx || prisma;

  let platformPurse = await db.purse.findFirst({
    where: { userId: null },
  });

  if (!platformPurse) {
    platformPurse = await db.purse.create({
      data: {
        userId: null,
        currency: 'USD',
        isActive: true,
      },
    });
  }

  return platformPurse;
}

/**
 * Get or create user purse
 */
export async function getOrCreateUserPurse(userId: string, tx?: Prisma.TransactionClient) {
  const db = tx || prisma;

  let purse = await db.purse.findUnique({
    where: { userId },
  });

  if (!purse) {
    purse = await db.purse.create({
      data: {
        userId,
        currency: 'USD',
        isActive: true,
      },
    });
  }

  return purse;
}

/**
 * Get purse balance details
 */
export async function getPurseBalance(purseId: string) {
  const purse = await prisma.purse.findUnique({
    where: { id: purseId },
    select: {
      id: true,
      userId: true,
      availableBalance: true,
      pendingBalance: true,
      commissionBalance: true,
      totalRevenue: true,
      currency: true,
      isActive: true,
    },
  });

  if (!purse) {
    throw new Error('Purse not found');
  }

  return {
    ...purse,
    availableBalance: Number(purse.availableBalance),
    pendingBalance: Number(purse.pendingBalance),
    commissionBalance: Number(purse.commissionBalance),
    totalRevenue: Number(purse.totalRevenue),
    totalBalance: Number(purse.availableBalance) + Number(purse.pendingBalance) + Number(purse.commissionBalance),
  };
}

/**
 * Verify purse integrity - compare balance with sum of transactions
 */
export async function verifyPurseIntegrity(purseId: string): Promise<{
  isValid: boolean;
  purseBalance: number;
  calculatedBalance: number;
  difference: number;
}> {
  const purse = await prisma.purse.findUnique({
    where: { id: purseId },
  });

  if (!purse) {
    throw new Error('Purse not found');
  }

  // Calculate balance from transactions
  const credits = await prisma.purseTransaction.aggregate({
    where: { toPurseId: purseId },
    _sum: { amount: true },
  });

  const debits = await prisma.purseTransaction.aggregate({
    where: { fromPurseId: purseId },
    _sum: { amount: true },
  });

  const creditsTotal = Number(credits._sum.amount || 0);
  const debitsTotal = Number(debits._sum.amount || 0);
  const calculatedBalance = creditsTotal - debitsTotal;

  const currentBalance = Number(purse.availableBalance) +
                        Number(purse.pendingBalance) +
                        Number(purse.commissionBalance);

  const difference = Math.abs(currentBalance - calculatedBalance);
  const isValid = difference < 0.01; // Allow for rounding errors

  return {
    isValid,
    purseBalance: currentBalance,
    calculatedBalance,
    difference,
  };
}

/**
 * Create a purse transaction with balance verification
 */
export async function createPurseTransaction(
  tx: Prisma.TransactionClient,
  data: {
    type: TransactionType;
    amount: number;
    fromPurseId?: string;
    toPurseId?: string;
    orderId?: string;
    paymentId?: string;
    description: string;
    metadata?: any;
    processedBy?: string;
  }
) {
  const { type, amount, fromPurseId, toPurseId, orderId, paymentId, description, metadata, processedBy } = data;

  if (amount <= 0) {
    throw new Error('Transaction amount must be positive');
  }

  // Get current balances
  let fromBalanceBefore: number | null = null;
  let toBalanceBefore: number | null = null;

  if (fromPurseId) {
    const fromPurse = await tx.purse.findUnique({ where: { id: fromPurseId } });
    if (!fromPurse) throw new Error('From purse not found');
    fromBalanceBefore = Number(fromPurse.availableBalance) +
                       Number(fromPurse.pendingBalance) +
                       Number(fromPurse.commissionBalance);
  }

  if (toPurseId) {
    const toPurse = await tx.purse.findUnique({ where: { id: toPurseId } });
    if (!toPurse) throw new Error('To purse not found');
    toBalanceBefore = Number(toPurse.availableBalance) +
                     Number(toPurse.pendingBalance) +
                     Number(toPurse.commissionBalance);
  }

  // Create transaction record
  const transaction = await tx.purseTransaction.create({
    data: {
      type,
      amount: new Prisma.Decimal(amount),
      fromPurseId,
      toPurseId,
      fromBalanceBefore: fromBalanceBefore !== null ? new Prisma.Decimal(fromBalanceBefore) : null,
      toBalanceBefore: toBalanceBefore !== null ? new Prisma.Decimal(toBalanceBefore) : null,
      orderId,
      paymentId,
      description,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : null,
      processedBy,
    },
  });

  return transaction;
}

/**
 * Get platform settings value
 */
export async function getPlatformSetting(key: string, defaultValue: string): Promise<string> {
  const setting = await prisma.platformSettings.findUnique({
    where: { key },
  });
  return setting?.value ?? defaultValue;
}

/**
 * Get commission percentage from platform settings
 */
export async function getCommissionPercentage(): Promise<number> {
  const value = await getPlatformSetting('platformCommissionPercentage', '0.20');
  return parseFloat(value);
}

/**
 * Get commission refund percentage from platform settings
 */
export async function getCommissionRefundPercentage(): Promise<number> {
  const value = await getPlatformSetting('commissionRefundPercentage', '0.50');
  const percentage = parseFloat(value);

  // Validate range
  if (percentage < 0 || percentage > 1) {
    console.warn(`Invalid commissionRefundPercentage: ${percentage}, using default 0.50`);
    return 0.50;
  }

  return percentage;
}
