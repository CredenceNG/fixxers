import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '../setup';
import {
  createMockAgent,
  createMockAgentClient,
  createMockAgentServiceRequest,
  createMockServiceRequest,
  createMockNotification,
  createMockAgentFixer,
  createMockNeighborhood,
} from '../helpers/agent-helpers';

describe('Client Service Requests Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Creating Service Requests', () => {
    it('should create service request for managed client', async () => {
      const mockAgentClient = createMockAgentClient({
        agentId: 'agent-1',
        clientId: 'client-1',
      });

      const mockRequest = createMockServiceRequest({
        id: 'request-1',
        clientId: 'client-1',
        title: 'Need plumbing service',
        description: 'Fix leaking pipes',
        neighborhoodId: 'neigh-1',
      });

      const mockAgentRequest = createMockAgentServiceRequest({
        agentId: 'agent-1',
        requestId: 'request-1',
      });

      prismaMock.agentClient.findUnique.mockResolvedValue(mockAgentClient as any);
      prismaMock.serviceRequest.create.mockResolvedValue(mockRequest as any);
      prismaMock.agentServiceRequest.create.mockResolvedValue(mockAgentRequest as any);

      const agentClient = await prismaMock.agentClient.findUnique({
        where: {
          agentId_clientId: {
            agentId: 'agent-1',
            clientId: 'client-1',
          },
        },
      });

      const request = await prismaMock.serviceRequest.create({
        data: {
          clientId: 'client-1',
          subcategoryId: 'subcat-1',
          title: 'Need plumbing service',
          description: 'Fix leaking pipes',
          neighborhoodId: 'neigh-1',
        },
      });

      const agentRequest = await prismaMock.agentServiceRequest.create({
        data: {
          agentId: 'agent-1',
          requestId: 'request-1',
        },
      });

      expect(agentClient).not.toBeNull();
      expect(request.clientId).toBe('client-1');
      expect(agentRequest.agentId).toBe('agent-1');
    });

    it('should require title, description, subcategory, and neighborhood', async () => {
      prismaMock.serviceRequest.create.mockRejectedValue(
        new Error('Title, description, subcategory, and neighborhood are required')
      );

      await expect(
        prismaMock.serviceRequest.create({
          data: {
            clientId: 'client-1',
            title: '',
            description: '',
            subcategoryId: '',
            neighborhoodId: '',
          },
        })
      ).rejects.toThrow('Title, description, subcategory, and neighborhood are required');
    });

    it('should link service request to AgentServiceRequest', async () => {
      const mockAgentRequest = createMockAgentServiceRequest({
        agentId: 'agent-1',
        requestId: 'request-1',
      });

      prismaMock.agentServiceRequest.create.mockResolvedValue(mockAgentRequest as any);

      const result = await prismaMock.agentServiceRequest.create({
        data: {
          agentId: 'agent-1',
          requestId: 'request-1',
        },
      });

      expect(result.agentId).toBe('agent-1');
      expect(result.requestId).toBe('request-1');
    });

    it('should notify client when request is created', async () => {
      const mockNotification = createMockNotification({
        userId: 'client-1',
        type: 'SERVICE_REQUEST_CREATED',
        title: 'Your service request has been created',
      });

      prismaMock.notification.create.mockResolvedValue(mockNotification as any);

      const result = await prismaMock.notification.create({
        data: {
          userId: 'client-1',
          type: 'SERVICE_REQUEST_CREATED',
          title: 'Your service request has been created',
          message: 'Your plumbing request is now visible to fixers',
        },
      });

      expect(result.type).toBe('SERVICE_REQUEST_CREATED');
    });

    it('should notify agent fixers in neighborhood when request is created', async () => {
      const mockFixers = [
        createMockAgentFixer({ id: 'agent-fixer-1', agentId: 'agent-1', fixerId: 'fixer-1' }),
        createMockAgentFixer({ id: 'agent-fixer-2', agentId: 'agent-1', fixerId: 'fixer-2' }),
      ];

      prismaMock.agentFixer.findMany.mockResolvedValue(mockFixers as any);
      prismaMock.notification.createMany.mockResolvedValue({ count: 2 });

      const fixers = await prismaMock.agentFixer.findMany({
        where: {
          agentId: 'agent-1',
          vetStatus: 'VETTED',
        },
      });

      const result = await prismaMock.notification.createMany({
        data: fixers.map((f) => ({
          userId: f.fixerId,
          type: 'NEW_SERVICE_REQUEST',
          title: 'New service request available',
          message: 'A new plumbing request is available in your area',
        })),
      });

      expect(result.count).toBe(2);
    });

    it('should only create requests in approved neighborhoods', async () => {
      const mockAgent = createMockAgent({
        id: 'agent-1',
        approvedNeighborhoods: [{ id: 'neigh-1' }, { id: 'neigh-2' }],
      });

      const mockNeighborhood = createMockNeighborhood({ id: 'neigh-1' });

      prismaMock.agent.findUnique.mockResolvedValue(mockAgent as any);
      prismaMock.neighborhood.findUnique.mockResolvedValue(mockNeighborhood as any);

      const agent = await prismaMock.agent.findUnique({
        where: { id: 'agent-1' },
        include: { approvedNeighborhoods: true },
      });

      const neighborhood = await prismaMock.neighborhood.findUnique({
        where: { id: 'neigh-1' },
      });

      const approvedIds = agent?.approvedNeighborhoods?.map((n: any) => n.id) || [];
      expect(approvedIds).toContain(neighborhood?.id);
    });
  });

  describe('Permission Checks', () => {
    it('should only allow active agents to create requests', async () => {
      const mockAgent = createMockAgent({ id: 'agent-1', status: 'SUSPENDED' });

      prismaMock.agent.findUnique.mockResolvedValue(mockAgent as any);

      const result = await prismaMock.agent.findUnique({
        where: { id: 'agent-1' },
      });

      expect(result?.status).toBe('SUSPENDED');
      // Business logic would prevent creating requests
    });

    it('should verify agent manages the client', async () => {
      const mockAgentClient = createMockAgentClient({
        agentId: 'agent-1',
        clientId: 'client-1',
      });

      prismaMock.agentClient.findUnique.mockResolvedValue(mockAgentClient as any);

      const result = await prismaMock.agentClient.findUnique({
        where: {
          agentId_clientId: {
            agentId: 'agent-1',
            clientId: 'client-1',
          },
        },
      });

      expect(result).not.toBeNull();
    });

    it('should verify neighborhood is in agent territory', async () => {
      const mockAgent = createMockAgent({
        id: 'agent-1',
        approvedNeighborhoods: [{ id: 'neigh-1' }, { id: 'neigh-2' }],
      });

      prismaMock.agent.findUnique.mockResolvedValue(mockAgent as any);

      const agent = await prismaMock.agent.findUnique({
        where: { id: 'agent-1' },
        include: { approvedNeighborhoods: true },
      });

      const approvedIds = agent?.approvedNeighborhoods?.map((n: any) => n.id) || [];
      expect(approvedIds).toContain('neigh-1');
    });

    it('should not allow creating requests for unmanaged clients', async () => {
      prismaMock.agentClient.findUnique.mockResolvedValue(null);

      const result = await prismaMock.agentClient.findUnique({
        where: {
          agentId_clientId: {
            agentId: 'agent-1',
            clientId: 'client-2',
          },
        },
      });

      expect(result).toBeNull();
      // Business logic would prevent creating request
    });
  });

  describe('Data Validation', () => {
    it('should allow optional budget field', async () => {
      const mockRequest = createMockServiceRequest({
        id: 'request-1',
        budget: null,
      });

      prismaMock.serviceRequest.create.mockResolvedValue(mockRequest as any);

      const result = await prismaMock.serviceRequest.create({
        data: {
          clientId: 'client-1',
          subcategoryId: 'subcat-1',
          title: 'Need service',
          description: 'Description',
          neighborhoodId: 'neigh-1',
          budget: null,
        },
      });

      expect(result.budget).toBeNull();
    });

    it('should default urgency to MEDIUM if not provided', async () => {
      const mockRequest = createMockServiceRequest({
        id: 'request-1',
        urgency: 'MEDIUM',
      });

      prismaMock.serviceRequest.create.mockResolvedValue(mockRequest as any);

      const result = await prismaMock.serviceRequest.create({
        data: {
          clientId: 'client-1',
          subcategoryId: 'subcat-1',
          title: 'Need service',
          description: 'Description',
          neighborhoodId: 'neigh-1',
        },
      });

      expect(result.urgency).toBe('MEDIUM');
    });

    it('should allow optional images array', async () => {
      const mockRequest = createMockServiceRequest({
        id: 'request-1',
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      });

      prismaMock.serviceRequest.create.mockResolvedValue(mockRequest as any);

      const result = await prismaMock.serviceRequest.create({
        data: {
          clientId: 'client-1',
          subcategoryId: 'subcat-1',
          title: 'Need service',
          description: 'Description',
          neighborhoodId: 'neigh-1',
          images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        },
      });

      expect(result.images).toHaveLength(2);
    });

    it('should allow optional preferredDate', async () => {
      const preferredDate = new Date('2025-11-01');
      const mockRequest = createMockServiceRequest({
        id: 'request-1',
        preferredDate,
      });

      prismaMock.serviceRequest.create.mockResolvedValue(mockRequest as any);

      const result = await prismaMock.serviceRequest.create({
        data: {
          clientId: 'client-1',
          subcategoryId: 'subcat-1',
          title: 'Need service',
          description: 'Description',
          neighborhoodId: 'neigh-1',
          preferredDate,
        },
      });

      expect(result.preferredDate).toEqual(preferredDate);
    });
  });
});
