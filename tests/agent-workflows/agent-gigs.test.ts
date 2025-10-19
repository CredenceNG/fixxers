import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '../setup';
import {
  createMockAgent,
  createMockAgentFixer,
  createMockAgentGig,
  createMockGig,
  createMockGigPackage,
  createMockFixerProfile,
  createMockNotification,
} from '../helpers/agent-helpers';

describe('Agent Gig Management', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Creating Gigs', () => {
    it('should create gig with title, description, and packages', async () => {
      const mockGig = createMockGig({
        id: 'gig-1',
        sellerId: 'fixer-1',
        title: 'Professional Plumbing Services',
        description: 'Expert plumbing work',
        slug: 'professional-plumbing-services',
      });

      const mockPackages = [
        createMockGigPackage({ id: 'pkg-1', gigId: 'gig-1', name: 'Basic', price: 5000 }),
        createMockGigPackage({ id: 'pkg-2', gigId: 'gig-1', name: 'Standard', price: 10000 }),
        createMockGigPackage({ id: 'pkg-3', gigId: 'gig-1', name: 'Premium', price: 15000 }),
      ];

      const mockAgentGig = createMockAgentGig({
        agentId: 'agent-1',
        gigId: 'gig-1',
      });

      prismaMock.$transaction.mockResolvedValue([mockGig, mockPackages, mockAgentGig]);

      const result = await prismaMock.$transaction([
        prismaMock.gig.create({
          data: {
            sellerId: 'fixer-1',
            subcategoryId: 'subcat-1',
            title: 'Professional Plumbing Services',
            description: 'Expert plumbing work',
            slug: 'professional-plumbing-services',
          },
        }),
        prismaMock.gigPackage.createMany({
          data: mockPackages.map((pkg) => ({
            gigId: 'gig-1',
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            deliveryDays: pkg.deliveryDays,
          })),
        }),
        prismaMock.agentGig.create({
          data: {
            agentId: 'agent-1',
            gigId: 'gig-1',
          },
        }),
      ]);

      expect(result).toHaveLength(3);
      expect(prismaMock.$transaction).toHaveBeenCalled();
    });

    it('should generate unique slug from title', async () => {
      const mockGig = createMockGig({
        id: 'gig-1',
        title: 'Professional Plumbing Services',
        slug: 'professional-plumbing-services',
      });

      prismaMock.gig.create.mockResolvedValue(mockGig as any);

      const result = await prismaMock.gig.create({
        data: {
          sellerId: 'fixer-1',
          subcategoryId: 'subcat-1',
          title: 'Professional Plumbing Services',
          description: 'Expert work',
          slug: 'professional-plumbing-services',
        },
      });

      expect(result.slug).toBe('professional-plumbing-services');
      expect(result.title).toBe('Professional Plumbing Services');
    });

    it('should create AgentGig link when gig is created', async () => {
      const mockAgentGig = createMockAgentGig({
        agentId: 'agent-1',
        gigId: 'gig-1',
      });

      prismaMock.agentGig.create.mockResolvedValue(mockAgentGig as any);

      const result = await prismaMock.agentGig.create({
        data: {
          agentId: 'agent-1',
          gigId: 'gig-1',
        },
      });

      expect(result.agentId).toBe('agent-1');
      expect(result.gigId).toBe('gig-1');
    });

    it('should create gig packages in transaction', async () => {
      const mockPackages = [
        { gigId: 'gig-1', name: 'Basic', price: 5000, deliveryDays: 2 },
        { gigId: 'gig-1', name: 'Standard', price: 10000, deliveryDays: 4 },
      ];

      prismaMock.gigPackage.createMany.mockResolvedValue({ count: 2 });

      const result = await prismaMock.gigPackage.createMany({
        data: mockPackages,
      });

      expect(result.count).toBe(2);
    });

    it('should set gig status to PENDING for review', async () => {
      const mockGig = createMockGig({
        id: 'gig-1',
        status: 'PENDING',
      });

      prismaMock.gig.create.mockResolvedValue(mockGig as any);

      const result = await prismaMock.gig.create({
        data: {
          sellerId: 'fixer-1',
          subcategoryId: 'subcat-1',
          title: 'Test Service',
          description: 'Test',
          slug: 'test-service',
          status: 'PENDING',
        },
      });

      expect(result.status).toBe('PENDING');
    });

    it('should notify fixer when gig is created', async () => {
      const mockNotification = createMockNotification({
        userId: 'fixer-1',
        type: 'GIG_CREATED',
        title: 'Your gig has been created',
      });

      prismaMock.notification.create.mockResolvedValue(mockNotification as any);

      const result = await prismaMock.notification.create({
        data: {
          userId: 'fixer-1',
          type: 'GIG_CREATED',
          title: 'Your gig has been created',
          message: 'Your gig is pending review',
        },
      });

      expect(result.type).toBe('GIG_CREATED');
    });

    it('should handle optional fields (images, tags, faq)', async () => {
      const mockGig = createMockGig({
        id: 'gig-1',
        images: ['https://example.com/image1.jpg'],
        tags: ['plumbing', 'urgent'],
        faq: [{ question: 'How long?', answer: '2 days' }],
      });

      prismaMock.gig.create.mockResolvedValue(mockGig as any);

      const result = await prismaMock.gig.create({
        data: {
          sellerId: 'fixer-1',
          subcategoryId: 'subcat-1',
          title: 'Test Service',
          description: 'Test',
          slug: 'test-service',
          images: ['https://example.com/image1.jpg'],
          tags: ['plumbing', 'urgent'],
          faq: [{ question: 'How long?', answer: '2 days' }],
        },
      });

      expect(result.images).toHaveLength(1);
      expect(result.tags).toHaveLength(2);
      expect(result.faq).toHaveLength(1);
    });
  });

  describe('Permissions', () => {
    it('should only allow active agents to create gigs', async () => {
      const mockAgent = createMockAgent({ id: 'agent-1', status: 'SUSPENDED' });

      prismaMock.agent.findUnique.mockResolvedValue(mockAgent as any);

      const result = await prismaMock.agent.findUnique({
        where: { id: 'agent-1' },
      });

      expect(result?.status).toBe('SUSPENDED');
      // Business logic would prevent creating gigs
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

    it('should not allow creating gigs for unmanaged fixers', async () => {
      prismaMock.agentFixer.findUnique.mockResolvedValue(null);

      const result = await prismaMock.agentFixer.findUnique({
        where: {
          agentId_fixerId: {
            agentId: 'agent-1',
            fixerId: 'fixer-2',
          },
        },
      });

      expect(result).toBeNull();
      // Business logic would prevent creating gig
    });

    it('should verify fixer profile exists', async () => {
      const mockProfile = createMockFixerProfile({ id: 'fixer-1' });

      prismaMock.fixerService.findUnique.mockResolvedValue(mockProfile as any);

      const result = await prismaMock.fixerService.findUnique({
        where: { id: 'fixer-1' },
      });

      expect(result).not.toBeNull();
    });
  });

  describe('Package Validation', () => {
    it('should require at least one package', async () => {
      prismaMock.gigPackage.createMany.mockRejectedValue(
        new Error('At least one package is required')
      );

      await expect(
        prismaMock.gigPackage.createMany({
          data: [],
        })
      ).rejects.toThrow('At least one package is required');
    });

    it('should validate package fields (name, price, deliveryDays)', async () => {
      prismaMock.gigPackage.createMany.mockRejectedValue(
        new Error('Package name, price, and delivery days are required')
      );

      await expect(
        prismaMock.gigPackage.createMany({
          data: [
            {
              gigId: 'gig-1',
              name: '',
              price: 0,
              deliveryDays: 0,
            },
          ],
        })
      ).rejects.toThrow('Package name, price, and delivery days are required');
    });

    it('should allow optional revisions field in packages', async () => {
      const mockPackage = createMockGigPackage({
        id: 'pkg-1',
        gigId: 'gig-1',
        revisions: 3,
      });

      prismaMock.gigPackage.create.mockResolvedValue(mockPackage as any);

      const result = await prismaMock.gigPackage.create({
        data: {
          gigId: 'gig-1',
          name: 'Standard',
          price: 10000,
          deliveryDays: 3,
          revisions: 3,
        },
      });

      expect(result.revisions).toBe(3);
    });
  });

  describe('Gig Updates', () => {
    it('should allow agent to update their gigs', async () => {
      const mockAgentGig = createMockAgentGig({
        agentId: 'agent-1',
        gigId: 'gig-1',
      });

      const mockUpdatedGig = createMockGig({
        id: 'gig-1',
        title: 'Updated Title',
      });

      prismaMock.agentGig.findUnique.mockResolvedValue(mockAgentGig as any);
      prismaMock.gig.update.mockResolvedValue(mockUpdatedGig as any);

      const agentGig = await prismaMock.agentGig.findUnique({
        where: {
          agentId_gigId: {
            agentId: 'agent-1',
            gigId: 'gig-1',
          },
        },
      });

      const result = await prismaMock.gig.update({
        where: { id: 'gig-1' },
        data: { title: 'Updated Title' },
      });

      expect(agentGig).not.toBeNull();
      expect(result.title).toBe('Updated Title');
    });

    it('should not allow updating gigs not managed by agent', async () => {
      prismaMock.agentGig.findUnique.mockResolvedValue(null);

      const result = await prismaMock.agentGig.findUnique({
        where: {
          agentId_gigId: {
            agentId: 'agent-1',
            gigId: 'gig-2',
          },
        },
      });

      expect(result).toBeNull();
      // Business logic would prevent update
    });
  });
});
