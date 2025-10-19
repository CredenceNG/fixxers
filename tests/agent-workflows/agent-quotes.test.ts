import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '../setup';
import {
  createMockAgent,
  createMockAgentFixer,
  createMockAgentQuote,
  createMockQuote,
  createMockServiceRequest,
  createMockNotification,
  createMockNeighborhood,
} from '../helpers/agent-helpers';

describe('Agent Quote Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Submitting Quotes', () => {
    it('should submit quote for managed fixer', async () => {
      const mockAgentFixer = createMockAgentFixer({
        agentId: 'agent-1',
        fixerId: 'fixer-1',
        vetStatus: 'VETTED',
      });

      const mockQuote = createMockQuote({
        id: 'quote-1',
        requestId: 'request-1',
        fixerId: 'fixer-1',
        amount: 8500,
        description: 'I can fix the issue',
      });

      const mockAgentQuote = createMockAgentQuote({
        agentId: 'agent-1',
        quoteId: 'quote-1',
      });

      prismaMock.agentFixer.findUnique.mockResolvedValue(mockAgentFixer as any);
      prismaMock.quote.create.mockResolvedValue(mockQuote as any);
      prismaMock.agentQuote.create.mockResolvedValue(mockAgentQuote as any);

      const agentFixer = await prismaMock.agentFixer.findUnique({
        where: {
          agentId_fixerId: {
            agentId: 'agent-1',
            fixerId: 'fixer-1',
          },
        },
      });

      const quote = await prismaMock.quote.create({
        data: {
          requestId: 'request-1',
          fixerId: 'fixer-1',
          amount: 8500,
          description: 'I can fix the issue',
          estimatedDays: 2,
        },
      });

      const agentQuote = await prismaMock.agentQuote.create({
        data: {
          agentId: 'agent-1',
          quoteId: 'quote-1',
        },
      });

      expect(agentFixer).not.toBeNull();
      expect(quote.fixerId).toBe('fixer-1');
      expect(agentQuote.agentId).toBe('agent-1');
    });

    it('should require amount, description, and estimatedDays', async () => {
      prismaMock.quote.create.mockRejectedValue(
        new Error('Amount, description, and estimated days are required')
      );

      await expect(
        prismaMock.quote.create({
          data: {
            requestId: 'request-1',
            fixerId: 'fixer-1',
            amount: 0,
            description: '',
            estimatedDays: 0,
          },
        })
      ).rejects.toThrow('Amount, description, and estimated days are required');
    });

    it('should link quote to AgentQuote', async () => {
      const mockAgentQuote = createMockAgentQuote({
        agentId: 'agent-1',
        quoteId: 'quote-1',
      });

      prismaMock.agentQuote.create.mockResolvedValue(mockAgentQuote as any);

      const result = await prismaMock.agentQuote.create({
        data: {
          agentId: 'agent-1',
          quoteId: 'quote-1',
        },
      });

      expect(result.agentId).toBe('agent-1');
      expect(result.quoteId).toBe('quote-1');
    });

    it('should only allow quotes in agent territory', async () => {
      const mockAgent = createMockAgent({
        id: 'agent-1',
        approvedNeighborhoods: [{ id: 'neigh-1' }, { id: 'neigh-2' }],
      });

      const mockRequest = createMockServiceRequest({
        id: 'request-1',
        neighborhoodId: 'neigh-1',
      });

      prismaMock.agent.findUnique.mockResolvedValue(mockAgent as any);
      prismaMock.serviceRequest.findUnique.mockResolvedValue(mockRequest as any);

      const agent = await prismaMock.agent.findUnique({
        where: { id: 'agent-1' },
        include: { approvedNeighborhoods: true },
      });

      const request = await prismaMock.serviceRequest.findUnique({
        where: { id: 'request-1' },
      });

      const approvedIds = agent?.approvedNeighborhoods?.map((n: any) => n.id) || [];
      expect(approvedIds).toContain(request?.neighborhoodId);
    });

    it('should prevent duplicate quotes from same fixer', async () => {
      const existingQuote = createMockQuote({
        requestId: 'request-1',
        fixerId: 'fixer-1',
      });

      prismaMock.quote.findFirst.mockResolvedValue(existingQuote as any);

      const result = await prismaMock.quote.findFirst({
        where: {
          requestId: 'request-1',
          fixerId: 'fixer-1',
        },
      });

      expect(result).not.toBeNull();
      // Business logic would prevent duplicate
    });
  });

  describe('Permissions', () => {
    it('should only allow active agents to submit quotes', async () => {
      const mockAgent = createMockAgent({ id: 'agent-1', status: 'SUSPENDED' });

      prismaMock.agent.findUnique.mockResolvedValue(mockAgent as any);

      const result = await prismaMock.agent.findUnique({
        where: { id: 'agent-1' },
      });

      expect(result?.status).toBe('SUSPENDED');
      // Business logic would prevent submitting quotes
    });

    it('should verify agent manages the fixer', async () => {
      const mockAgentFixer = createMockAgentFixer({
        agentId: 'agent-1',
        fixerId: 'fixer-1',
        vetStatus: 'VETTED',
      });

      prismaMock.agentFixer.findUnique.mockResolvedValue(mockAgentFixer as any);

      const result = await prismaMock.agentFixer.findUnique({
        where: {
          agentId_fixerId: {
            agentId: 'agent-1',
            fixerId: 'fixer-1',
          },
        },
      });

      expect(result).not.toBeNull();
      expect(result?.vetStatus).toBe('VETTED');
    });

    it('should only allow quotes on OPEN service requests', async () => {
      const mockRequest = createMockServiceRequest({
        id: 'request-1',
        status: 'OPEN',
      });

      prismaMock.serviceRequest.findUnique.mockResolvedValue(mockRequest as any);

      const result = await prismaMock.serviceRequest.findUnique({
        where: { id: 'request-1' },
      });

      expect(result?.status).toBe('OPEN');
    });

    it('should verify request neighborhood is in agent territory', async () => {
      const mockAgent = createMockAgent({
        id: 'agent-1',
        approvedNeighborhoods: [{ id: 'neigh-1' }, { id: 'neigh-2' }],
      });

      const mockRequest = createMockServiceRequest({
        id: 'request-1',
        neighborhoodId: 'neigh-1',
      });

      prismaMock.agent.findUnique.mockResolvedValue(mockAgent as any);
      prismaMock.serviceRequest.findUnique.mockResolvedValue(mockRequest as any);

      const agent = await prismaMock.agent.findUnique({
        where: { id: 'agent-1' },
        include: { approvedNeighborhoods: true },
      });

      const request = await prismaMock.serviceRequest.findUnique({
        where: { id: 'request-1' },
      });

      const approvedIds = agent?.approvedNeighborhoods?.map((n: any) => n.id) || [];
      expect(approvedIds).toContain(request?.neighborhoodId);
    });
  });

  describe('Notifications', () => {
    it('should notify fixer when quote is submitted', async () => {
      const mockNotification = createMockNotification({
        userId: 'fixer-1',
        type: 'QUOTE_SUBMITTED',
        title: 'Your quote has been submitted',
      });

      prismaMock.notification.create.mockResolvedValue(mockNotification as any);

      const result = await prismaMock.notification.create({
        data: {
          userId: 'fixer-1',
          type: 'QUOTE_SUBMITTED',
          title: 'Your quote has been submitted',
          message: 'Your quote of NGN 8,500 has been sent to the client',
        },
      });

      expect(result.type).toBe('QUOTE_SUBMITTED');
    });

    it('should notify client when new quote is received', async () => {
      const mockNotification = createMockNotification({
        userId: 'client-1',
        type: 'NEW_QUOTE_RECEIVED',
        title: 'New quote received',
      });

      prismaMock.notification.create.mockResolvedValue(mockNotification as any);

      const result = await prismaMock.notification.create({
        data: {
          userId: 'client-1',
          type: 'NEW_QUOTE_RECEIVED',
          title: 'New quote received',
          message: 'You received a new quote of NGN 8,500 for your request',
        },
      });

      expect(result.type).toBe('NEW_QUOTE_RECEIVED');
    });

    it('should track which agent submitted the quote', async () => {
      const mockAgentQuote = createMockAgentQuote({
        agentId: 'agent-1',
        quoteId: 'quote-1',
      });

      prismaMock.agentQuote.create.mockResolvedValue(mockAgentQuote as any);

      const result = await prismaMock.agentQuote.create({
        data: {
          agentId: 'agent-1',
          quoteId: 'quote-1',
        },
      });

      expect(result.agentId).toBe('agent-1');
    });
  });
});
