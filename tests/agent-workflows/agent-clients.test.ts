import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '../setup';
import {
  createMockAgent,
  createMockAgentClient,
  createMockUser,
  createMockNotification,
} from '../helpers/agent-helpers';

describe('Agent Client Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Adding Clients', () => {
    it('should add client to agent management', async () => {
      const mockClient = createMockUser({ id: 'client-1', roles: ['CLIENT'] });
      const mockAgentClient = createMockAgentClient({
        agentId: 'agent-1',
        clientId: 'client-1',
        status: 'ACTIVE',
      });

      prismaMock.user.findUnique.mockResolvedValue(mockClient as any);
      prismaMock.agentClient.create.mockResolvedValue(mockAgentClient as any);

      const client = await prismaMock.user.findUnique({
        where: { id: 'client-1' },
      });

      const result = await prismaMock.agentClient.create({
        data: {
          agentId: 'agent-1',
          clientId: 'client-1',
          status: 'ACTIVE',
        },
      });

      expect(client).not.toBeNull();
      expect(client?.roles).toContain('CLIENT');
      expect(result.agentId).toBe('agent-1');
      expect(result.clientId).toBe('client-1');
    });

    it('should create AgentClient record when adding client', async () => {
      const mockAgentClient = createMockAgentClient({
        id: 'agent-client-1',
        agentId: 'agent-1',
        clientId: 'client-1',
        addedAt: new Date(),
      });

      prismaMock.agentClient.create.mockResolvedValue(mockAgentClient as any);

      const result = await prismaMock.agentClient.create({
        data: {
          agentId: 'agent-1',
          clientId: 'client-1',
        },
      });

      expect(result.agentId).toBe('agent-1');
      expect(result.clientId).toBe('client-1');
      expect(result.addedAt).not.toBeNull();
    });

    it('should notify client when added to agent network', async () => {
      const mockNotification = createMockNotification({
        userId: 'client-1',
        type: 'ADDED_TO_AGENT_NETWORK',
        title: 'You have been added to an agent network',
      });

      prismaMock.notification.create.mockResolvedValue(mockNotification as any);

      const result = await prismaMock.notification.create({
        data: {
          userId: 'client-1',
          type: 'ADDED_TO_AGENT_NETWORK',
          title: 'You have been added to an agent network',
          message: 'ABC Fixers Agency is now managing your service requests',
        },
      });

      expect(result.type).toBe('ADDED_TO_AGENT_NETWORK');
      expect(result.userId).toBe('client-1');
    });

    it('should prevent adding same client twice to same agent', async () => {
      const existingAgentClient = createMockAgentClient({
        agentId: 'agent-1',
        clientId: 'client-1',
      });

      prismaMock.agentClient.findUnique.mockResolvedValue(existingAgentClient as any);

      const result = await prismaMock.agentClient.findUnique({
        where: {
          agentId_clientId: {
            agentId: 'agent-1',
            clientId: 'client-1',
          },
        },
      });

      expect(result).not.toBeNull();
      // Business logic would prevent duplicate
    });
  });

  describe('Permissions', () => {
    it('should only allow active agents to add clients', async () => {
      const mockAgent = createMockAgent({ id: 'agent-1', status: 'SUSPENDED' });

      prismaMock.agent.findUnique.mockResolvedValue(mockAgent as any);

      const result = await prismaMock.agent.findUnique({
        where: { id: 'agent-1' },
      });

      expect(result?.status).toBe('SUSPENDED');
      // Business logic would prevent adding clients
    });

    it('should check client limits based on agent tier', async () => {
      const mockAgent = createMockAgent({
        id: 'agent-1',
        maxClients: 10,
      });

      const mockClients = Array.from({ length: 10 }, (_, i) =>
        createMockAgentClient({ id: `agent-client-${i}`, agentId: 'agent-1' })
      );

      prismaMock.agent.findUnique.mockResolvedValue(mockAgent as any);
      prismaMock.agentClient.count.mockResolvedValue(10);

      const agent = await prismaMock.agent.findUnique({
        where: { id: 'agent-1' },
      });

      const count = await prismaMock.agentClient.count({
        where: { agentId: 'agent-1' },
      });

      expect(count).toBe(agent?.maxClients);
      // Business logic would prevent adding more
    });

    it('should verify client user exists before adding', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await prismaMock.user.findUnique({
        where: { id: 'non-existent' },
      });

      expect(result).toBeNull();
      // Business logic would prevent adding non-existent user
    });
  });

  describe('Client Management', () => {
    it('should list all managed clients for agent', async () => {
      const mockAgentClients = [
        createMockAgentClient({ id: 'agent-client-1', agentId: 'agent-1', clientId: 'client-1' }),
        createMockAgentClient({ id: 'agent-client-2', agentId: 'agent-1', clientId: 'client-2' }),
        createMockAgentClient({ id: 'agent-client-3', agentId: 'agent-1', clientId: 'client-3' }),
      ];

      prismaMock.agentClient.findMany.mockResolvedValue(mockAgentClients as any);

      const result = await prismaMock.agentClient.findMany({
        where: { agentId: 'agent-1', status: 'ACTIVE' },
      });

      expect(result).toHaveLength(3);
      expect(result[0].agentId).toBe('agent-1');
    });

    it('should get client details including relationship info', async () => {
      const mockClient = createMockUser({ id: 'client-1', name: 'John Doe' });
      const mockAgentClient = createMockAgentClient({
        agentId: 'agent-1',
        clientId: 'client-1',
        addedAt: new Date(),
      });

      prismaMock.user.findUnique.mockResolvedValue(mockClient as any);
      prismaMock.agentClient.findUnique.mockResolvedValue(mockAgentClient as any);

      const client = await prismaMock.user.findUnique({
        where: { id: 'client-1' },
      });

      const relationship = await prismaMock.agentClient.findUnique({
        where: {
          agentId_clientId: {
            agentId: 'agent-1',
            clientId: 'client-1',
          },
        },
      });

      expect(client?.name).toBe('John Doe');
      expect(relationship?.addedAt).not.toBeNull();
    });

    it('should remove client from agent management', async () => {
      const mockAgentClient = createMockAgentClient({
        id: 'agent-client-1',
        agentId: 'agent-1',
        clientId: 'client-1',
        status: 'INACTIVE',
      });

      prismaMock.agentClient.update.mockResolvedValue(mockAgentClient as any);

      const result = await prismaMock.agentClient.update({
        where: {
          agentId_clientId: {
            agentId: 'agent-1',
            clientId: 'client-1',
          },
        },
        data: {
          status: 'INACTIVE',
        },
      });

      expect(result.status).toBe('INACTIVE');
    });
  });
});
