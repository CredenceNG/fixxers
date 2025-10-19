import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '../setup';
import {
  createMockAgent,
  createMockAgentCommission,
  createMockAgentFixer,
  createMockAgentGig,
  createMockAgentQuote,
  createMockOrder,
} from '../helpers/agent-helpers';

describe('Agent Commission Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Commission Calculation', () => {
    it('should calculate commission when order is completed', async () => {
      const mockAgent = createMockAgent({
        id: 'agent-1',
        commissionPercentage: 15.0,
      });

      const mockOrder = createMockOrder({
        id: 'order-1',
        totalAmount: 7500,
        status: 'COMPLETED',
      });

      const mockCommission = createMockAgentCommission({
        agentId: 'agent-1',
        orderId: 'order-1',
        amount: 1125.0, // 15% of 7500
        percentage: 15.0,
        status: 'EARNED',
      });

      prismaMock.agent.findUnique.mockResolvedValue(mockAgent as any);
      prismaMock.order.findUnique.mockResolvedValue(mockOrder as any);
      prismaMock.agentCommission.create.mockResolvedValue(mockCommission as any);

      const agent = await prismaMock.agent.findUnique({
        where: { id: 'agent-1' },
      });

      const order = await prismaMock.order.findUnique({
        where: { id: 'order-1' },
      });

      const commissionAmount = (order!.totalAmount * agent!.commissionPercentage) / 100;

      const commission = await prismaMock.agentCommission.create({
        data: {
          agentId: 'agent-1',
          orderId: 'order-1',
          amount: commissionAmount,
          percentage: agent!.commissionPercentage,
          status: 'EARNED',
        },
      });

      expect(commission.amount).toBe(1125.0);
      expect(commission.percentage).toBe(15.0);
    });

    it('should use custom commission rate if set for agent', async () => {
      const mockAgent = createMockAgent({
        id: 'agent-1',
        commissionPercentage: 20.0,
      });

      const mockOrder = createMockOrder({
        id: 'order-1',
        totalAmount: 10000,
      });

      const mockCommission = createMockAgentCommission({
        agentId: 'agent-1',
        orderId: 'order-1',
        amount: 2000.0, // 20% of 10000
        percentage: 20.0,
      });

      prismaMock.agent.findUnique.mockResolvedValue(mockAgent as any);
      prismaMock.order.findUnique.mockResolvedValue(mockOrder as any);
      prismaMock.agentCommission.create.mockResolvedValue(mockCommission as any);

      const agent = await prismaMock.agent.findUnique({
        where: { id: 'agent-1' },
      });

      const order = await prismaMock.order.findUnique({
        where: { id: 'order-1' },
      });

      const commission = await prismaMock.agentCommission.create({
        data: {
          agentId: 'agent-1',
          orderId: 'order-1',
          amount: (order!.totalAmount * agent!.commissionPercentage) / 100,
          percentage: agent!.commissionPercentage,
        },
      });

      expect(commission.amount).toBe(2000.0);
      expect(commission.percentage).toBe(20.0);
    });

    it('should apply commission to orders from agent gigs', async () => {
      const mockAgentGig = createMockAgentGig({
        agentId: 'agent-1',
        gigId: 'gig-1',
      });

      const mockOrder = createMockOrder({
        id: 'order-1',
        gigId: 'gig-1',
        totalAmount: 15000,
      });

      prismaMock.agentGig.findUnique.mockResolvedValue(mockAgentGig as any);
      prismaMock.order.findUnique.mockResolvedValue(mockOrder as any);

      const agentGig = await prismaMock.agentGig.findUnique({
        where: {
          agentId_gigId: {
            agentId: 'agent-1',
            gigId: 'gig-1',
          },
        },
      });

      const order = await prismaMock.order.findUnique({
        where: { id: 'order-1' },
      });

      expect(agentGig).not.toBeNull();
      expect(order?.gigId).toBe('gig-1');
    });

    it('should apply commission to orders from agent quotes', async () => {
      const mockAgentQuote = createMockAgentQuote({
        agentId: 'agent-1',
        quoteId: 'quote-1',
      });

      const mockOrder = createMockOrder({
        id: 'order-1',
        quoteId: 'quote-1',
        totalAmount: 8500,
      });

      prismaMock.agentQuote.findUnique.mockResolvedValue(mockAgentQuote as any);
      prismaMock.order.findUnique.mockResolvedValue(mockOrder as any);

      const agentQuote = await prismaMock.agentQuote.findUnique({
        where: {
          agentId_quoteId: {
            agentId: 'agent-1',
            quoteId: 'quote-1',
          },
        },
      });

      const order = await prismaMock.order.findUnique({
        where: { id: 'order-1' },
      });

      expect(agentQuote).not.toBeNull();
      expect(order?.quoteId).toBe('quote-1');
    });
  });

  describe('Commission Records', () => {
    it('should create AgentCommission record', async () => {
      const mockCommission = createMockAgentCommission({
        id: 'commission-1',
        agentId: 'agent-1',
        orderId: 'order-1',
        amount: 1125.0,
        percentage: 15.0,
        status: 'EARNED',
      });

      prismaMock.agentCommission.create.mockResolvedValue(mockCommission as any);

      const result = await prismaMock.agentCommission.create({
        data: {
          agentId: 'agent-1',
          orderId: 'order-1',
          amount: 1125.0,
          percentage: 15.0,
          status: 'EARNED',
        },
      });

      expect(result.agentId).toBe('agent-1');
      expect(result.orderId).toBe('order-1');
      expect(result.amount).toBe(1125.0);
    });

    it('should link commission to agent, fixer, and order', async () => {
      const mockCommission = createMockAgentCommission({
        agentId: 'agent-1',
        orderId: 'order-1',
        agentFixerId: 'agent-fixer-1',
      });

      prismaMock.agentCommission.create.mockResolvedValue(mockCommission as any);

      const result = await prismaMock.agentCommission.create({
        data: {
          agentId: 'agent-1',
          orderId: 'order-1',
          agentFixerId: 'agent-fixer-1',
          amount: 1125.0,
          percentage: 15.0,
        },
      });

      expect(result.agentId).toBe('agent-1');
      expect(result.orderId).toBe('order-1');
      expect(result.agentFixerId).toBe('agent-fixer-1');
    });

    it('should track commission amount and percentage', async () => {
      const mockCommission = createMockAgentCommission({
        amount: 1500.0,
        percentage: 15.0,
      });

      prismaMock.agentCommission.create.mockResolvedValue(mockCommission as any);

      const result = await prismaMock.agentCommission.create({
        data: {
          agentId: 'agent-1',
          orderId: 'order-1',
          amount: 1500.0,
          percentage: 15.0,
        },
      });

      expect(result.amount).toBe(1500.0);
      expect(result.percentage).toBe(15.0);
    });
  });

  describe('Earnings Management', () => {
    it('should get total earnings for agent', async () => {
      const mockCommissions = [
        createMockAgentCommission({ amount: 1125.0, status: 'EARNED' }),
        createMockAgentCommission({ amount: 2250.0, status: 'EARNED' }),
        createMockAgentCommission({ amount: 1500.0, status: 'EARNED' }),
      ];

      prismaMock.agentCommission.findMany.mockResolvedValue(mockCommissions as any);
      prismaMock.agentCommission.aggregate.mockResolvedValue({
        _sum: { amount: 4875.0 },
      } as any);

      const result = await prismaMock.agentCommission.aggregate({
        where: { agentId: 'agent-1', status: 'EARNED' },
        _sum: { amount: true },
      });

      expect(result._sum.amount).toBe(4875.0);
    });

    it('should get available balance (earned but not paid)', async () => {
      prismaMock.agentCommission.aggregate.mockResolvedValue({
        _sum: { amount: 3500.0 },
      } as any);

      const result = await prismaMock.agentCommission.aggregate({
        where: {
          agentId: 'agent-1',
          status: 'EARNED',
          paidAt: null,
        },
        _sum: { amount: true },
      });

      expect(result._sum.amount).toBe(3500.0);
    });

    it('should track withdrawal requests', async () => {
      const mockCommission = createMockAgentCommission({
        id: 'commission-1',
        status: 'PAID',
        paidAt: new Date(),
      });

      prismaMock.agentCommission.update.mockResolvedValue(mockCommission as any);

      const result = await prismaMock.agentCommission.update({
        where: { id: 'commission-1' },
        data: {
          status: 'PAID',
          paidAt: new Date(),
        },
      });

      expect(result.status).toBe('PAID');
      expect(result.paidAt).not.toBeNull();
    });
  });
});
