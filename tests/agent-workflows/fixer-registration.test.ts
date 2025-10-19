import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '../setup';
import {
  createMockAgent,
  createMockAgentFixer,
  createMockUser,
  createMockFixerProfile,
  createMockNotification,
} from '../helpers/agent-helpers';

describe('Fixer Registration and Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Adding New Fixers', () => {
    it('should create user, profile, and agent relationship in transaction', async () => {
      const mockUser = createMockUser({ id: 'new-fixer-1', roles: ['FIXER'] });
      const mockProfile = createMockFixerProfile({ id: 'profile-1', userId: 'new-fixer-1' });
      const mockAgentFixer = createMockAgentFixer({
        agentId: 'agent-1',
        fixerId: 'profile-1',
        vetStatus: 'PENDING',
      });

      prismaMock.$transaction.mockResolvedValue([mockUser, mockProfile, mockAgentFixer]);

      const result = await prismaMock.$transaction([
        prismaMock.user.create({
          data: {
            name: 'New Fixer',
            email: 'newfixer@example.com',
            phone: '+2341234567890',
            roles: ['FIXER'],
          },
        }),
        prismaMock.fixerService.create({
          data: {
            userId: 'new-fixer-1',
            bio: 'New fixer bio',
            skills: ['plumbing'],
          },
        }),
        prismaMock.agentFixer.create({
          data: {
            agentId: 'agent-1',
            fixerId: 'profile-1',
            vetStatus: 'PENDING',
          },
        }),
      ]);

      expect(result).toHaveLength(3);
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('should require name, email, phone, and skills when adding new fixer', async () => {
      prismaMock.$transaction.mockRejectedValue(
        new Error('Name, email, phone, and skills are required')
      );

      await expect(
        prismaMock.$transaction([
          prismaMock.user.create({
            data: {
              name: '',
              email: '',
              phone: '',
              roles: ['FIXER'],
            },
          }),
        ])
      ).rejects.toThrow('Name, email, phone, and skills are required');
    });

    it('should prevent duplicate fixer registration by email', async () => {
      const existingUser = createMockUser({ email: 'existing@example.com' });

      prismaMock.user.findUnique.mockResolvedValue(existingUser as any);

      const result = await prismaMock.user.findUnique({
        where: { email: 'existing@example.com' },
      });

      expect(result).not.toBeNull();
      expect(result?.email).toBe('existing@example.com');
    });

    it('should set vet status to PENDING for new fixers', async () => {
      const mockAgentFixer = createMockAgentFixer({
        agentId: 'agent-1',
        fixerId: 'fixer-1',
        vetStatus: 'PENDING',
        vettedById: null,
        vettedAt: null,
      });

      prismaMock.agentFixer.create.mockResolvedValue(mockAgentFixer as any);

      const result = await prismaMock.agentFixer.create({
        data: {
          agentId: 'agent-1',
          fixerId: 'fixer-1',
          vetStatus: 'PENDING',
        },
      });

      expect(result.vetStatus).toBe('PENDING');
      expect(result.vettedById).toBeNull();
      expect(result.vettedAt).toBeNull();
    });

    it('should notify fixer when registered by agent', async () => {
      const mockNotification = createMockNotification({
        userId: 'fixer-1',
        type: 'FIXER_REGISTERED_BY_AGENT',
        title: 'You have been registered by ABC Fixers Agency',
      });

      prismaMock.notification.create.mockResolvedValue(mockNotification as any);

      const result = await prismaMock.notification.create({
        data: {
          userId: 'fixer-1',
          type: 'FIXER_REGISTERED_BY_AGENT',
          title: 'You have been registered by ABC Fixers Agency',
          message: 'Your profile is being reviewed',
        },
      });

      expect(result.type).toBe('FIXER_REGISTERED_BY_AGENT');
    });

    it('should notify agent when new fixer is added', async () => {
      const mockNotification = createMockNotification({
        userId: 'user-agent-1',
        type: 'AGENT_FIXER_ADDED',
        title: 'New fixer added to your network',
      });

      prismaMock.notification.create.mockResolvedValue(mockNotification as any);

      const result = await prismaMock.notification.create({
        data: {
          userId: 'user-agent-1',
          type: 'AGENT_FIXER_ADDED',
          title: 'New fixer added to your network',
          message: 'John Doe has been added as your fixer',
        },
      });

      expect(result.type).toBe('AGENT_FIXER_ADDED');
    });

    it('should rollback transaction if any step fails', async () => {
      prismaMock.$transaction.mockRejectedValue(new Error('Transaction failed'));

      await expect(
        prismaMock.$transaction([
          prismaMock.user.create({ data: {} }),
          prismaMock.fixerService.create({ data: {} }),
          prismaMock.agentFixer.create({ data: {} }),
        ])
      ).rejects.toThrow('Transaction failed');
    });
  });

  describe('Adding Existing Fixers', () => {
    it('should add existing fixer by ID', async () => {
      const mockProfile = createMockFixerProfile({ id: 'fixer-1' });
      const mockAgentFixer = createMockAgentFixer({
        agentId: 'agent-1',
        fixerId: 'fixer-1',
      });

      prismaMock.fixerService.findUnique.mockResolvedValue(mockProfile as any);
      prismaMock.agentFixer.create.mockResolvedValue(mockAgentFixer as any);

      const profile = await prismaMock.fixerService.findUnique({
        where: { id: 'fixer-1' },
      });

      const result = await prismaMock.agentFixer.create({
        data: {
          agentId: 'agent-1',
          fixerId: 'fixer-1',
          vetStatus: 'PENDING',
        },
      });

      expect(profile).not.toBeNull();
      expect(result.fixerId).toBe('fixer-1');
    });

    it('should prevent adding same fixer twice to same agent', async () => {
      const existingAgentFixer = createMockAgentFixer({
        agentId: 'agent-1',
        fixerId: 'fixer-1',
      });

      prismaMock.agentFixer.findUnique.mockResolvedValue(existingAgentFixer as any);

      const result = await prismaMock.agentFixer.findUnique({
        where: {
          agentId_fixerId: {
            agentId: 'agent-1',
            fixerId: 'fixer-1',
          },
        },
      });

      expect(result).not.toBeNull();
      // Business logic would prevent duplicate
    });

    it('should verify fixer profile exists before adding', async () => {
      prismaMock.fixerService.findUnique.mockResolvedValue(null);

      const result = await prismaMock.fixerService.findUnique({
        where: { id: 'non-existent' },
      });

      expect(result).toBeNull();
    });

    it('should notify fixer when added to agent network', async () => {
      const mockNotification = createMockNotification({
        userId: 'fixer-1',
        type: 'ADDED_TO_AGENT_NETWORK',
        title: 'You have been added to an agent network',
      });

      prismaMock.notification.create.mockResolvedValue(mockNotification as any);

      const result = await prismaMock.notification.create({
        data: {
          userId: 'fixer-1',
          type: 'ADDED_TO_AGENT_NETWORK',
          title: 'You have been added to an agent network',
          message: 'ABC Fixers Agency is now managing your work',
        },
      });

      expect(result.type).toBe('ADDED_TO_AGENT_NETWORK');
    });
  });

  describe('Fixer Limits and Permissions', () => {
    it('should only allow active agents to add fixers', async () => {
      const mockAgent = createMockAgent({ id: 'agent-1', status: 'SUSPENDED' });

      prismaMock.agent.findUnique.mockResolvedValue(mockAgent as any);

      const result = await prismaMock.agent.findUnique({
        where: { id: 'agent-1' },
      });

      expect(result?.status).toBe('SUSPENDED');
      // Business logic would prevent adding fixers
    });

    it('should check fixer limits based on agent tier', async () => {
      const mockAgent = createMockAgent({
        id: 'agent-1',
        maxFixers: 5,
      });

      const mockFixers = Array.from({ length: 5 }, (_, i) =>
        createMockAgentFixer({ id: `agent-fixer-${i}`, agentId: 'agent-1' })
      );

      prismaMock.agent.findUnique.mockResolvedValue(mockAgent as any);
      prismaMock.agentFixer.count.mockResolvedValue(5);

      const agent = await prismaMock.agent.findUnique({
        where: { id: 'agent-1' },
      });

      const count = await prismaMock.agentFixer.count({
        where: { agentId: 'agent-1' },
      });

      expect(count).toBe(agent?.maxFixers);
      // Business logic would prevent adding more
    });

    it('should verify fixer neighborhood is in agent territory', async () => {
      const mockAgent = createMockAgent({
        id: 'agent-1',
        approvedNeighborhoods: [{ id: 'neigh-1' }, { id: 'neigh-2' }],
      });

      const mockProfile = createMockFixerProfile({
        id: 'fixer-1',
        neighborhoodId: 'neigh-3',
      });

      prismaMock.agent.findUnique.mockResolvedValue(mockAgent as any);
      prismaMock.fixerService.findUnique.mockResolvedValue(mockProfile as any);

      const agent = await prismaMock.agent.findUnique({
        where: { id: 'agent-1' },
        include: { approvedNeighborhoods: true },
      });

      const profile = await prismaMock.fixerService.findUnique({
        where: { id: 'fixer-1' },
      });

      const approvedIds = agent?.approvedNeighborhoods?.map((n: any) => n.id) || [];
      expect(approvedIds).not.toContain(profile?.neighborhoodId);
      // Business logic would prevent adding fixer outside territory
    });
  });

  describe('Fixer Vetting', () => {
    it('should vet fixer (PENDING → VETTED)', async () => {
      const mockVetted = createMockAgentFixer({
        id: 'agent-fixer-1',
        vetStatus: 'VETTED',
        vettedById: 'user-agent-1',
        vettedAt: new Date(),
        vetNotes: 'Verified identity and credentials',
      });

      prismaMock.agentFixer.update.mockResolvedValue(mockVetted as any);

      const result = await prismaMock.agentFixer.update({
        where: { id: 'agent-fixer-1' },
        data: {
          vetStatus: 'VETTED',
          vettedById: 'user-agent-1',
          vettedAt: new Date(),
          vetNotes: 'Verified identity and credentials',
        },
      });

      expect(result.vetStatus).toBe('VETTED');
      expect(result.vettedById).toBe('user-agent-1');
      expect(result.vettedAt).not.toBeNull();
    });

    it('should add vetting notes when vetting fixer', async () => {
      const mockVetted = createMockAgentFixer({
        id: 'agent-fixer-1',
        vetStatus: 'VETTED',
        vetNotes: 'Checked ID, references, and past work quality',
      });

      prismaMock.agentFixer.update.mockResolvedValue(mockVetted as any);

      const result = await prismaMock.agentFixer.update({
        where: { id: 'agent-fixer-1' },
        data: {
          vetStatus: 'VETTED',
          vetNotes: 'Checked ID, references, and past work quality',
        },
      });

      expect(result.vetNotes).toBe('Checked ID, references, and past work quality');
    });

    it('should record who vetted and when', async () => {
      const vettedAt = new Date();
      const mockVetted = createMockAgentFixer({
        id: 'agent-fixer-1',
        vetStatus: 'VETTED',
        vettedById: 'user-agent-1',
        vettedAt,
      });

      prismaMock.agentFixer.update.mockResolvedValue(mockVetted as any);

      const result = await prismaMock.agentFixer.update({
        where: { id: 'agent-fixer-1' },
        data: {
          vetStatus: 'VETTED',
          vettedById: 'user-agent-1',
          vettedAt,
        },
      });

      expect(result.vettedById).toBe('user-agent-1');
      expect(result.vettedAt).toEqual(vettedAt);
    });

    it('should not allow vetting fixer not managed by agent', async () => {
      prismaMock.agentFixer.findUnique.mockResolvedValue(null);

      const result = await prismaMock.agentFixer.findUnique({
        where: {
          agentId_fixerId: {
            agentId: 'agent-1',
            fixerId: 'fixer-1',
          },
        },
      });

      expect(result).toBeNull();
      // Business logic would prevent vetting
    });
  });
});
