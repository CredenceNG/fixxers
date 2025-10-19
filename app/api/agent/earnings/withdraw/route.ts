import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount, bankDetails } = await request.json();

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: 'Invalid withdrawal amount' },
        { status: 400 }
      );
    }

    const agent = await prisma.agent.findUnique({
      where: { userId: user.id },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'Agent profile not found' },
        { status: 404 }
      );
    }

    if (agent.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Agent must be active to withdraw funds' },
        { status: 403 }
      );
    }

    const withdrawAmount = new Decimal(amount);
    if (agent.walletBalance.lessThan(withdrawAmount)) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Create withdrawal request
    const withdrawal = await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.agent.update({
        where: { id: agent.id },
        data: {
          walletBalance: {
            decrement: withdrawAmount,
          },
        },
      });

      // Create withdrawal record (you may need to add a Withdrawal model)
      // For now, create a notification for admin to process
      await tx.notification.create({
        data: {
          userId: 'admin',
          type: 'GENERAL',
          title: 'Agent Withdrawal Request',
          message: `Agent ${agent.businessName || user.name} has requested withdrawal of ₦${amount.toLocaleString()}`,
          link: `/admin/agents/${agent.id}`,
        },
      });

      // Notify agent
      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'WITHDRAWAL_REQUESTED',
          title: 'Withdrawal Requested',
          message: `Your withdrawal request for ₦${amount.toLocaleString()} is being processed.`,
          link: '/agent/earnings',
        },
      });

      return { amount: withdrawAmount, status: 'PENDING' };
    });

    return NextResponse.json({
      message: 'Withdrawal request submitted successfully',
      withdrawal,
    });
  } catch (error) {
    console.error('Error processing withdrawal:', error);
    return NextResponse.json(
      { error: 'Failed to process withdrawal' },
      { status: 500 }
    );
  }
}
