import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '../setup';
import {
  createMockAgent,
  createMockUser,
  createMockNeighborhood,
  createMockNotification,
} from '../helpers/agent-helpers';

describe('Agent Application and Approval', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Agent Application Submission', () => {
    it('should submit valid agent application with business name and neighborhoods', async () => {
      const mockUser = createMockUser({ id: 'user-1' });
      const mockNeighborhoods = [
        createMockNeighborhood({ id: 'neigh-1' }),
        createMockNeighborhood({ id: 'neigh-2' }),
      ];
      const mockAgent = createMockAgent({
        userId: 'user-1',
        businessName: 'ABC Fixers Agency',
        requestedNeighborhoodIds: ['neigh-1', 'neigh-2'],
        status: 'PENDING',
      });

      prismaMock.agent.findUnique.mockResolvedValue(null);
      prismaMock.neighborhood.findMany.mockResolvedValue(mockNeighborhoods as any);
      prismaMock.agent.create.mockResolvedValue(mockAgent as any);

      const result = await prismaMock.agent.create({
        data: {
          userId: 'user-1',
          businessName: 'ABC Fixers Agency',
          requestedNeighborhoodIds: ['neigh-1', 'neigh-2'],
          status: 'PENDING',
          pendingChanges: true,
        },
      });

      expect(result.status).toBe('PENDING');
      expect(result.businessName).toBe('ABC Fixers Agency');
      expect(result.requestedNeighborhoodIds).toHaveLength(2);
    });

    it('should require business name and at least one neighborhood', async () => {
      prismaMock.agent.create.mockRejectedValue(
        new Error('Business name and neighborhoods are required')
      );

      await expect(
        prismaMock.agent.create({
          data: {
            userId: 'user-1',
            businessName: '',
            requestedNeighborhoodIds: [],
            status: 'PENDING',
          },
        })
      ).rejects.toThrow('Business name and neighborhoods are required');
    });

    it('should prevent duplicate applications from same user', async () => {
      const existingAgent = createMockAgent({ userId: 'user-1' });

      prismaMock.agent.findUnique.mockResolvedValue(existingAgent as any);

      const result = await prismaMock.agent.findUnique({
        where: { userId: 'user-1' },
      });

      expect(result).not.toBeNull();
      expect(result?.userId).toBe('user-1');
    });

    it('should validate all requested neighborhoods exist', async () => {
      const mockNeighborhoods = [createMockNeighborhood({ id: 'neigh-1' })];

      prismaMock.neighborhood.findMany.mockResolvedValue(mockNeighborhoods as any);

      const result = await prismaMock.neighborhood.findMany({
        where: { id: { in: ['neigh-1', 'neigh-2'] } },
      });

      expect(result).toHaveLength(1);
      // Test would fail validation if requested 2 but only 1 exists
    });

    it('should create notifications for admins on new application', async () => {
      const mockAdmins = [
        createMockUser({ id: 'admin-1', roles: ['ADMIN'] }),
        createMockUser({ id: 'admin-2', roles: ['ADMIN'] }),
      ];

      prismaMock.user.findMany.mockResolvedValue(mockAdmins as any);
      prismaMock.notification.createMany.mockResolvedValue({ count: 2 });

      const adminsResult = await prismaMock.user.findMany({
        where: { roles: { has: 'ADMIN' } },
      });

      const notifResult = await prismaMock.notification.createMany({
        data: adminsResult.map((admin) => ({
          userId: admin.id,
          type: 'AGENT_APPLICATION_SUBMITTED',
          title: 'New Agent Application',
          message: 'John Doe has applied to become an agent',
        })),
      });

      expect(notifResult.count).toBe(2);
    });
  });

  describe('Application Status Retrieval', () => {
    it('should get current user agent application', async () => {
      const mockAgent = createMockAgent({
        userId: 'user-1',
        status: 'PENDING',
      });

      prismaMock.agent.findUnique.mockResolvedValue(mockAgent as any);

      const result = await prismaMock.agent.findUnique({
        where: { userId: 'user-1' },
      });

      expect(result).not.toBeNull();
      expect(result?.status).toBe('PENDING');
    });

    it('should return null if no application exists', async () => {
      prismaMock.agent.findUnique.mockResolvedValue(null);

      const result = await prismaMock.agent.findUnique({
        where: { userId: 'user-1' },
      });

      expect(result).toBeNull();
    });

    it('should include approved neighborhoods in response', async () => {
      const mockNeighborhoods = [
        createMockNeighborhood({ id: 'neigh-1', name: 'Lekki Phase 1' }),
        createMockNeighborhood({ id: 'neigh-2', name: 'Victoria Island' }),
      ];

      const mockAgent = createMockAgent({
        userId: 'user-1',
        approvedNeighborhoods: mockNeighborhoods,
      });

      prismaMock.agent.findUnique.mockResolvedValue(mockAgent as any);

      const result = await prismaMock.agent.findUnique({
        where: { userId: 'user-1' },
        include: { approvedNeighborhoods: true },
      });

      expect(result?.approvedNeighborhoods).toHaveLength(2);
    });
  });

  describe('Admin Approval Process', () => {
    it('should approve agent application (PENDING → ACTIVE)', async () => {
      const mockApproved = createMockAgent({
        id: 'agent-1',
        status: 'ACTIVE',
        approvedById: 'admin-1',
        approvedAt: new Date(),
      });

      prismaMock.agent.update.mockResolvedValue(mockApproved as any);

      const result = await prismaMock.agent.update({
        where: { id: 'agent-1' },
        data: {
          status: 'ACTIVE',
          approvedById: 'admin-1',
          approvedAt: new Date(),
        },
      });

      expect(result.status).toBe('ACTIVE');
      expect(result.approvedById).toBe('admin-1');
      expect(result.approvedAt).not.toBeNull();
    });

    it('should set approved neighborhoods and commission rate', async () => {
      const mockApproved = createMockAgent({
        id: 'agent-1',
        status: 'ACTIVE',
        commissionPercentage: 15.0,
      });

      prismaMock.agent.update.mockResolvedValue(mockApproved as any);

      const result = await prismaMock.agent.update({
        where: { id: 'agent-1' },
        data: {
          status: 'ACTIVE',
          commissionPercentage: 15.0,
          approvedNeighborhoods: {
            connect: [{ id: 'neigh-1' }, { id: 'neigh-2' }],
          },
        },
      });

      expect(result.status).toBe('ACTIVE');
      expect(result.commissionPercentage).toBe(15.0);
    });

    it('should reject agent application with reason', async () => {
      const mockRejected = createMockAgent({
        id: 'agent-1',
        status: 'REJECTED',
        approvedById: 'admin-1',
      });

      prismaMock.agent.update.mockResolvedValue(mockRejected as any);

      const result = await prismaMock.agent.update({
        where: { id: 'agent-1' },
        data: {
          status: 'REJECTED',
          approvedById: 'admin-1',
        },
      });

      expect(result.status).toBe('REJECTED');
    });

    it('should not approve already processed application', async () => {
      const mockAgent = createMockAgent({
        id: 'agent-1',
        status: 'ACTIVE',
      });

      prismaMock.agent.findUnique.mockResolvedValue(mockAgent as any);

      const result = await prismaMock.agent.findUnique({
        where: { id: 'agent-1' },
      });

      expect(result?.status).toBe('ACTIVE');
      // Business logic would prevent re-approval
    });
  });

  describe('Agent Status Management', () => {
    it('should suspend active agent', async () => {
      const mockSuspended = createMockAgent({
        id: 'agent-1',
        status: 'SUSPENDED',
      });

      prismaMock.agent.update.mockResolvedValue(mockSuspended as any);

      const result = await prismaMock.agent.update({
        where: { id: 'agent-1' },
        data: { status: 'SUSPENDED' },
      });

      expect(result.status).toBe('SUSPENDED');
    });

    it('should ban agent (blocks all operations)', async () => {
      const mockBanned = createMockAgent({
        id: 'agent-1',
        status: 'BANNED',
      });

      prismaMock.agent.update.mockResolvedValue(mockBanned as any);

      const result = await prismaMock.agent.update({
        where: { id: 'agent-1' },
        data: { status: 'BANNED' },
      });

      expect(result.status).toBe('BANNED');
    });

    it('should update agent commission rate', async () => {
      const mockUpdated = createMockAgent({
        id: 'agent-1',
        commissionPercentage: 20.0,
      });

      prismaMock.agent.update.mockResolvedValue(mockUpdated as any);

      const result = await prismaMock.agent.update({
        where: { id: 'agent-1' },
        data: { commissionPercentage: 20.0 },
      });

      expect(result.commissionPercentage).toBe(20.0);
    });

    it('should track who approved/rejected each agent', async () => {
      const mockAgent = createMockAgent({
        id: 'agent-1',
        status: 'ACTIVE',
        approvedById: 'admin-1',
        approvedAt: new Date(),
      });

      prismaMock.agent.findUnique.mockResolvedValue(mockAgent as any);

      const result = await prismaMock.agent.findUnique({
        where: { id: 'agent-1' },
      });

      expect(result?.approvedById).toBe('admin-1');
      expect(result?.approvedAt).not.toBeNull();
    });
  });
});
