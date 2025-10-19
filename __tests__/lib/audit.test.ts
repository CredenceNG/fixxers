import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuditAction } from '@prisma/client';
import * as auditLib from '@/lib/audit';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
}));

// Import prisma after mocking
import { prisma } from '@/lib/prisma';

describe('Audit Logging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAuditLog', () => {
    it('should create an audit log entry with all fields', async () => {
      const mockAuditLog = {
        id: 'test-id',
        performedBy: 'user-123',
        action: AuditAction.USER_APPROVED,
        targetType: 'User',
        targetId: 'target-456',
        description: 'User approved successfully',
        metadata: { reason: 'Verified documents' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(),
      };

      vi.mocked(prisma.auditLog.create).mockResolvedValue(mockAuditLog);

      const result = await auditLib.createAuditLog({
        performedBy: 'user-123',
        action: AuditAction.USER_APPROVED,
        targetType: 'User',
        targetId: 'target-456',
        description: 'User approved successfully',
        metadata: { reason: 'Verified documents' },
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          performedBy: 'user-123',
          action: AuditAction.USER_APPROVED,
          targetType: 'User',
          targetId: 'target-456',
          description: 'User approved successfully',
          metadata: { reason: 'Verified documents' },
          ipAddress: undefined,
          userAgent: undefined,
        },
      });

      expect(result).toEqual(mockAuditLog);
    });

    it('should handle audit logging failures gracefully', async () => {
      vi.mocked(prisma.auditLog.create).mockRejectedValue(new Error('Database error'));

      const result = await auditLib.createAuditLog({
        performedBy: 'user-123',
        action: AuditAction.USER_APPROVED,
        targetType: 'User',
      });

      // Should return null on error, not throw
      expect(result).toBeNull();
    });

    it('should extract IP address from request headers', async () => {
      const mockRequest = {
        headers: {
          get: vi.fn((header: string) => {
            if (header === 'x-forwarded-for') return '203.0.113.1, 198.51.100.1';
            if (header === 'user-agent') return 'Test Agent';
            return null;
          }),
        },
      } as any;

      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      await auditLib.createAuditLog({
        performedBy: 'user-123',
        action: AuditAction.USER_APPROVED,
        targetType: 'User',
        request: mockRequest,
      });

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ipAddress: '203.0.113.1',
          userAgent: 'Test Agent',
        }),
      });
    });
  });

  describe('logUserAction', () => {
    it('should create audit log for user actions', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      await auditLib.logUserAction(
        'admin-123',
        AuditAction.USER_SUSPENDED,
        'user-456',
        'Suspended for violation',
        { violation: 'spam' }
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          performedBy: 'admin-123',
          action: AuditAction.USER_SUSPENDED,
          targetType: 'User',
          targetId: 'user-456',
          description: 'Suspended for violation',
          metadata: { violation: 'spam' },
        }),
      });
    });
  });

  describe('logFixerAction', () => {
    it('should create audit log for fixer actions', async () => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);

      await auditLib.logFixerAction(
        'admin-123',
        AuditAction.FIXER_APPROVED,
        'fixer-789',
        'Fixer profile approved'
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          performedBy: 'admin-123',
          action: AuditAction.FIXER_APPROVED,
          targetType: 'Fixer',
          targetId: 'fixer-789',
          description: 'Fixer profile approved',
        }),
      });
    });
  });

  describe('getAuditLogs', () => {
    it('should fetch audit logs with filters', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          performedBy: 'admin-123',
          action: AuditAction.USER_APPROVED,
          user: { name: 'Admin User', email: 'admin@test.com', roles: ['ADMIN'] },
        },
      ];

      vi.mocked(prisma.auditLog.findMany).mockResolvedValue(mockLogs as any);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(1);

      const result = await auditLib.getAuditLogs({
        performedBy: 'admin-123',
        action: AuditAction.USER_APPROVED,
        limit: 10,
        offset: 0,
      });

      expect(result).toEqual({
        logs: mockLogs,
        total: 1,
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith({
        where: {
          performedBy: 'admin-123',
          action: AuditAction.USER_APPROVED,
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
              roles: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });

    it('should filter by date range', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0);

      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-12-31');

      await auditLib.getAuditLogs({
        startDate,
        endDate,
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate,
            },
          },
        })
      );
    });

    it('should filter by target type and ID', async () => {
      vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
      vi.mocked(prisma.auditLog.count).mockResolvedValue(0);

      await auditLib.getAuditLogs({
        targetType: 'Order',
        targetId: 'order-123',
      });

      expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            targetType: 'Order',
            targetId: 'order-123',
          },
        })
      );
    });
  });

  describe('Specialized logging functions', () => {
    beforeEach(() => {
      vi.mocked(prisma.auditLog.create).mockResolvedValue({} as any);
    });

    it('logBadgeAction should log badge-related actions', async () => {
      await auditLib.logBadgeAction(
        'admin-123',
        AuditAction.BADGE_REQUEST_APPROVED,
        'badge-request-456'
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          targetType: 'BadgeRequest',
          action: AuditAction.BADGE_REQUEST_APPROVED,
        }),
      });
    });

    it('logOrderAction should log order-related actions', async () => {
      await auditLib.logOrderAction(
        'admin-123',
        AuditAction.ORDER_REFUNDED,
        'order-789'
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          targetType: 'Order',
          action: AuditAction.ORDER_REFUNDED,
        }),
      });
    });

    it('logGigAction should log gig-related actions', async () => {
      await auditLib.logGigAction(
        'admin-123',
        AuditAction.GIG_APPROVED,
        'gig-101'
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          targetType: 'Gig',
          action: AuditAction.GIG_APPROVED,
        }),
      });
    });

    it('logReviewAction should log review moderation', async () => {
      await auditLib.logReviewAction(
        'admin-123',
        AuditAction.REVIEW_DELETED,
        'review-202'
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          targetType: 'Review',
          action: AuditAction.REVIEW_DELETED,
        }),
      });
    });

    it('logFinancialAction should log financial operations', async () => {
      await auditLib.logFinancialAction(
        'admin-123',
        AuditAction.PAYOUT_PROCESSED,
        'payout-303',
        'Payout to fixer',
        { amount: 500, currency: 'USD' }
      );

      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          targetType: 'Financial',
          action: AuditAction.PAYOUT_PROCESSED,
          metadata: { amount: 500, currency: 'USD' },
        }),
      });
    });
  });
});
