import { prisma } from './prisma';
import { Prisma } from '@prisma/client';
import {
  getPlatformPurse,
  getOrCreateUserPurse,
  createPurseTransaction,
  getCommissionPercentage,
  getCommissionRefundPercentage,
} from './purse';

/**
 * Record payment received from client and split into commission + escrow
 */
export async function recordPaymentReceived(
  orderId: string,
  paymentId: string,
  totalAmount: number
) {
  return await prisma.$transaction(async (tx) => {
    const platformPurse = await getPlatformPurse(tx);
    const commissionPercentage = await getCommissionPercentage();

    const commission = totalAmount * commissionPercentage;
    const escrowAmount = totalAmount - commission;

    // 1. Record payment received from client
    const paymentTx = await createPurseTransaction(tx, {
      type: 'PAYMENT_RECEIVED',
      amount: totalAmount,
      toPurseId: platformPurse.id,
      orderId,
      paymentId,
      description: `Payment received for order ${orderId}`,
      metadata: { totalAmount, commissionPercentage },
    });

    // Update platform purse available balance
    await tx.purse.update({
      where: { id: platformPurse.id },
      data: {
        availableBalance: { increment: new Prisma.Decimal(totalAmount) },
      },
    });

    // Update transaction with after balance
    await tx.purseTransaction.update({
      where: { id: paymentTx.id },
      data: {
        toBalanceAfter: new Prisma.Decimal(
          Number(await getUpdatedBalance(tx, platformPurse.id))
        ),
      },
    });

    // 2. Hold commission (non-refundable by default)
    const commissionTx = await createPurseTransaction(tx, {
      type: 'COMMISSION_HOLD',
      amount: commission,
      fromPurseId: platformPurse.id,
      orderId,
      paymentId,
      description: `Platform commission (${commissionPercentage * 100}%)`,
      metadata: { commission, percentage: commissionPercentage },
    });

    await tx.purse.update({
      where: { id: platformPurse.id },
      data: {
        availableBalance: { decrement: new Prisma.Decimal(commission) },
        commissionBalance: { increment: new Prisma.Decimal(commission) },
      },
    });

    await tx.purseTransaction.update({
      where: { id: commissionTx.id },
      data: {
        fromBalanceAfter: new Prisma.Decimal(
          Number(await getUpdatedBalance(tx, platformPurse.id))
        ),
      },
    });

    // 3. Hold remaining in escrow for fixer
    const escrowTx = await createPurseTransaction(tx, {
      type: 'ESCROW_HOLD',
      amount: escrowAmount,
      fromPurseId: platformPurse.id,
      orderId,
      paymentId,
      description: `Funds held in escrow for fixer`,
      metadata: { escrowAmount },
    });

    await tx.purse.update({
      where: { id: platformPurse.id },
      data: {
        availableBalance: { decrement: new Prisma.Decimal(escrowAmount) },
        pendingBalance: { increment: new Prisma.Decimal(escrowAmount) },
      },
    });

    await tx.purseTransaction.update({
      where: { id: escrowTx.id },
      data: {
        fromBalanceAfter: new Prisma.Decimal(
          Number(await getUpdatedBalance(tx, platformPurse.id))
        ),
      },
    });

    return {
      paymentTransaction: paymentTx,
      commissionTransaction: commissionTx,
      escrowTransaction: escrowTx,
      totalAmount,
      commission,
      escrowAmount,
    };
  });
}

/**
 * Release payout to fixer when order is settled
 */
export async function releasePayout(orderId: string, fixerId: string) {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const platformPurse = await getPlatformPurse(tx);
    const fixerPurse = await getOrCreateUserPurse(fixerId, tx);

    const commission = Number(order.platformFee);
    const fixerAmount = Number(order.fixerAmount);

    // 1. Move commission from commissionBalance to availableBalance (finalized)
    const commissionRevenueTx = await createPurseTransaction(tx, {
      type: 'COMMISSION_TO_REVENUE',
      amount: commission,
      fromPurseId: platformPurse.id,
      orderId,
      paymentId: order.payment?.id,
      description: `Commission finalized for order ${orderId}`,
      metadata: { commission },
    });

    await tx.purse.update({
      where: { id: platformPurse.id },
      data: {
        commissionBalance: { decrement: new Prisma.Decimal(commission) },
        availableBalance: { increment: new Prisma.Decimal(commission) },
        totalRevenue: { increment: new Prisma.Decimal(commission) },
      },
    });

    await tx.purseTransaction.update({
      where: { id: commissionRevenueTx.id },
      data: {
        fromBalanceAfter: new Prisma.Decimal(
          Number(await getUpdatedBalance(tx, platformPurse.id))
        ),
      },
    });

    // 2. Transfer escrow to fixer
    const payoutTx = await createPurseTransaction(tx, {
      type: 'PAYOUT',
      amount: fixerAmount,
      fromPurseId: platformPurse.id,
      toPurseId: fixerPurse.id,
      orderId,
      paymentId: order.payment?.id,
      description: `Payout to fixer for order ${orderId}`,
      metadata: { fixerAmount, fixerId },
    });

    await tx.purse.update({
      where: { id: platformPurse.id },
      data: {
        pendingBalance: { decrement: new Prisma.Decimal(fixerAmount) },
      },
    });

    await tx.purse.update({
      where: { id: fixerPurse.id },
      data: {
        availableBalance: { increment: new Prisma.Decimal(fixerAmount) },
      },
    });

    await tx.purseTransaction.update({
      where: { id: payoutTx.id },
      data: {
        fromBalanceAfter: new Prisma.Decimal(
          Number(await getUpdatedBalance(tx, platformPurse.id))
        ),
        toBalanceAfter: new Prisma.Decimal(
          Number(await getUpdatedBalance(tx, fixerPurse.id))
        ),
      },
    });

    return {
      commissionTransaction: commissionRevenueTx,
      payoutTransaction: payoutTx,
      commission,
      fixerAmount,
    };
  });
}

/**
 * Process full refund with configurable commission refund
 */
export async function processFullRefund(orderId: string, clientId: string) {
  return await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });

    if (!order) {
      throw new Error('Order not found');
    }

    const totalAmount = Number(order.totalAmount);
    const commission = Number(order.platformFee);
    const escrowAmount = totalAmount - commission;

    const platformPurse = await getPlatformPurse(tx);
    const clientPurse = await getOrCreateUserPurse(clientId, tx);

    // Get configurable commission refund percentage
    const commissionRefundPercentage = await getCommissionRefundPercentage();
    const commissionRefund = commission * commissionRefundPercentage;
    const commissionRetained = commission - commissionRefund;

    const totalRefund = escrowAmount + commissionRefund;

    // 1. Refund escrow to client
    const escrowRefundTx = await createPurseTransaction(tx, {
      type: 'REFUND_ESCROW',
      amount: escrowAmount,
      fromPurseId: platformPurse.id,
      toPurseId: clientPurse.id,
      orderId,
      paymentId: order.payment?.id,
      description: `Escrow refund for cancelled order ${orderId}`,
      metadata: { escrowAmount },
    });

    await tx.purse.update({
      where: { id: platformPurse.id },
      data: {
        pendingBalance: { decrement: new Prisma.Decimal(escrowAmount) },
      },
    });

    await tx.purseTransaction.update({
      where: { id: escrowRefundTx.id },
      data: {
        fromBalanceAfter: new Prisma.Decimal(
          Number(await getUpdatedBalance(tx, platformPurse.id))
        ),
      },
    });

    // 2. Refund commission (if percentage > 0)
    let commissionRefundTx = null;
    if (commissionRefund > 0) {
      commissionRefundTx = await createPurseTransaction(tx, {
        type: 'REFUND_COMMISSION',
        amount: commissionRefund,
        fromPurseId: platformPurse.id,
        toPurseId: clientPurse.id,
        orderId,
        paymentId: order.payment?.id,
        description: `Commission refund (${commissionRefundPercentage * 100}% of ${commission})`,
        metadata: { commissionRefund, commissionRefundPercentage },
      });

      await tx.purse.update({
        where: { id: platformPurse.id },
        data: {
          commissionBalance: { decrement: new Prisma.Decimal(commissionRefund) },
        },
      });

      await tx.purseTransaction.update({
        where: { id: commissionRefundTx.id },
        data: {
          fromBalanceAfter: new Prisma.Decimal(
            Number(await getUpdatedBalance(tx, platformPurse.id))
          ),
        },
      });
    }

    // 3. Move retained commission to revenue
    let commissionRevenueTx = null;
    if (commissionRetained > 0) {
      commissionRevenueTx = await createPurseTransaction(tx, {
        type: 'COMMISSION_TO_REVENUE',
        amount: commissionRetained,
        fromPurseId: platformPurse.id,
        orderId,
        paymentId: order.payment?.id,
        description: `Commission retained (${(1 - commissionRefundPercentage) * 100}%) from cancelled order`,
        metadata: { commissionRetained, commissionRefundPercentage },
      });

      await tx.purse.update({
        where: { id: platformPurse.id },
        data: {
          commissionBalance: { decrement: new Prisma.Decimal(commissionRetained) },
          availableBalance: { increment: new Prisma.Decimal(commissionRetained) },
          totalRevenue: { increment: new Prisma.Decimal(commissionRetained) },
        },
      });

      await tx.purseTransaction.update({
        where: { id: commissionRevenueTx.id },
        data: {
          fromBalanceAfter: new Prisma.Decimal(
            Number(await getUpdatedBalance(tx, platformPurse.id))
          ),
        },
      });
    }

    // 4. Update client purse
    await tx.purse.update({
      where: { id: clientPurse.id },
      data: {
        availableBalance: { increment: new Prisma.Decimal(totalRefund) },
      },
    });

    // Update all transaction after balances for client
    if (commissionRefundTx) {
      await tx.purseTransaction.update({
        where: { id: commissionRefundTx.id },
        data: {
          toBalanceAfter: new Prisma.Decimal(
            Number(await getUpdatedBalance(tx, clientPurse.id))
          ),
        },
      });
    }

    await tx.purseTransaction.update({
      where: { id: escrowRefundTx.id },
      data: {
        toBalanceAfter: new Prisma.Decimal(
          Number(await getUpdatedBalance(tx, clientPurse.id))
        ),
      },
    });

    return {
      totalRefund,
      escrowRefund: escrowAmount,
      commissionRefund,
      platformRetained: commissionRetained,
      escrowRefundTransaction: escrowRefundTx,
      commissionRefundTransaction: commissionRefundTx,
      commissionRevenueTransaction: commissionRevenueTx,
    };
  });
}

/**
 * Helper: Get current total balance of a purse
 */
async function getUpdatedBalance(tx: Prisma.TransactionClient, purseId: string): Promise<number> {
  const purse = await tx.purse.findUnique({ where: { id: purseId } });
  if (!purse) return 0;

  return Number(purse.availableBalance) +
         Number(purse.pendingBalance) +
         Number(purse.commissionBalance);
}
