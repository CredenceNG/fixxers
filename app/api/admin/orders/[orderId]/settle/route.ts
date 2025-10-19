import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { calculateCommission, recordCommission, payFixerBonus, shouldPayFixerBonus } from '@/lib/agents/commissions';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getCurrentUser();
    const roles = user?.roles || [];

    if (!user || !roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { orderId } = await params;

    // Fetch the order with payment and agent information
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        fixer: true,
        agentCommissions: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Verify order is PAID or already SETTLED (for idempotency)
    if (order.status !== 'PAID' && order.status !== 'SETTLED') {
      return NextResponse.json(
        { error: 'Order must be in PAID or SETTLED status' },
        { status: 400 }
      );
    }

    // If already settled, just ensure balance is updated
    if (order.status === 'SETTLED') {
      await prisma.purse.upsert({
        where: {
          userId: order.fixerId,
        },
        create: {
          userId: order.fixerId,
          availableBalance: order.fixerAmount,
          pendingBalance: 0,
          commissionBalance: 0,
          totalRevenue: order.fixerAmount,
        },
        update: {
          availableBalance: { increment: order.fixerAmount },
          totalRevenue: { increment: order.fixerAmount },
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Balance updated for already settled order',
        sellerAmount: order.fixerAmount,
      });
    }

    if (!order.payment) {
      return NextResponse.json(
        { error: 'No payment found for this order' },
        { status: 400 }
      );
    }

    const paymentId = order.payment.id;

    // Check if this order was handled by an agent
    const agentGig = order.gigId ? await prisma.agentGig.findUnique({
      where: { gigId: order.gigId },
      include: { agent: true },
    }) : null;

    const agentQuote = order.quoteId ? await prisma.agentQuote.findUnique({
      where: { quoteId: order.quoteId },
      include: { agent: true },
    }) : null;

    const agentRequest = order.requestId ? await prisma.agentServiceRequest.findUnique({
      where: { requestId: order.requestId },
      include: { agent: true },
    }) : null;

    const agent = agentGig?.agent || agentQuote?.agent || agentRequest?.agent;

    await prisma.$transaction(async (tx) => {
      // Update payment status to RELEASED
      await tx.payment.update({
        where: { id: paymentId },
        data: {
          status: 'RELEASED',
          releasedAt: new Date(),
        },
      });

      // Update order status to SETTLED
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'SETTLED',
        },
      });

      // Update fixer's purse balance
      await tx.purse.upsert({
        where: {
          userId: order.fixerId,
        },
        create: {
          userId: order.fixerId,
          availableBalance: order.fixerAmount,
          pendingBalance: 0,
          commissionBalance: 0,
          totalRevenue: order.fixerAmount,
        },
        update: {
          availableBalance: { increment: order.fixerAmount },
          totalRevenue: { increment: order.fixerAmount },
        },
      });

      // Send notification to fixer about payment settlement
      await tx.notification.create({
        data: {
          userId: order.fixerId,
          type: 'PAYMENT_RECEIVED',
          title: 'Payment Settled',
          message: `Your payment of ₦${order.fixerAmount.toLocaleString()} has been settled and added to your purse.`,
          link: '/fixer/purse',
        },
      });

      // If order was handled by an agent, record commission
      if (agent && order.agentCommissions.length === 0) {
        const commissionCalc = calculateCommission(
          order.fixerAmount,
          agent.commissionPercentage
        );

        // Create commission record
        await tx.agentCommission.create({
          data: {
            agentId: agent.id,
            orderId: order.id,
            amount: commissionCalc.commissionAmount,
            percentage: commissionCalc.commissionPercentage,
            orderAmount: commissionCalc.orderAmount,
            status: 'PENDING',
            type: 'ORDER_COMMISSION',
          },
        });

        // Update agent wallet
        await tx.agent.update({
          where: { id: agent.id },
          data: {
            walletBalance: {
              increment: commissionCalc.commissionAmount,
            },
            totalEarned: {
              increment: commissionCalc.commissionAmount,
            },
          },
        });

        // Notify agent about commission
        await tx.notification.create({
          data: {
            userId: agent.userId,
            type: 'AGENT_COMMISSION_EARNED',
            title: 'Commission Earned',
            message: `You earned ₦${Number(commissionCalc.commissionAmount).toLocaleString()} commission (${Number(agent.commissionPercentage)}%) from order #${order.id.slice(0, 8)}.`,
            link: '/agent/commissions',
          },
        });
      }
    });

    // After transaction, check if fixer bonus should be paid
    if (agent) {
      // Find the AgentFixer relationship
      const agentFixer = await prisma.agentFixer.findFirst({
        where: {
          agentId: agent.id,
          fixerId: order.fixerId,
        },
      });

      if (agentFixer) {
        const shouldPay = await shouldPayFixerBonus(orderId, agentFixer.id);
        if (shouldPay) {
          try {
            await payFixerBonus(agentFixer.id, orderId);
          } catch (error) {
            console.error('Error paying fixer bonus:', error);
            // Don't fail the settlement if bonus payment fails
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Payment settled successfully',
      sellerAmount: order.fixerAmount,
    });
  } catch (error) {
    console.error('Error settling payment:', error);
    return NextResponse.json(
      { error: 'Failed to settle payment' },
      { status: 500 }
    );
  }
}
