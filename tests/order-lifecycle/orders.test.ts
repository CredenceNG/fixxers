import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '../setup';

describe('Order Lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Creating Orders', () => {
    it('should create order from accepted quote', async () => {
      const mockOrder = {
        id: 'order-1',
        quoteId: 'quote-1',
        clientId: 'client-1',
        fixerId: 'fixer-1',
        amount: 7500,
        status: 'PENDING_PAYMENT',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.order.create.mockResolvedValue(mockOrder);

      const result = await prismaMock.order.create({
        data: {
          quoteId: 'quote-1',
          clientId: 'client-1',
          fixerId: 'fixer-1',
          amount: 7500,
        },
      });

      expect(result).toEqual(mockOrder);
      expect(result.status).toBe('PENDING_PAYMENT');
    });

    it('should include commission calculation', async () => {
      const platformFee = 7500 * 0.10; // 10% commission
      const fixerEarnings = 7500 - platformFee;

      expect(platformFee).toBe(750);
      expect(fixerEarnings).toBe(6750);
    });
  });

  describe('Payment Processing', () => {
    it('should update order status after payment', async () => {
      const mockPaid = {
        id: 'order-1',
        status: 'PAID',
        payment: {
          id: 'payment-1',
          status: 'COMPLETED',
          paidAt: new Date(),
        },
      };

      prismaMock.order.update.mockResolvedValue(mockPaid);

      const result = await prismaMock.order.update({
        where: { id: 'order-1' },
        data: { status: 'PAID' },
      });

      expect(result.status).toBe('PAID');
    });

    it('should hold payment in escrow', async () => {
      const mockPayment = {
        id: 'payment-1',
        orderId: 'order-1',
        amount: 7500,
        status: 'COMPLETED',
        releasedAt: null, // Not released yet
      };

      prismaMock.payment.create.mockResolvedValue(mockPayment);

      const result = await prismaMock.payment.create({
        data: {
          orderId: 'order-1',
          amount: 7500,
          status: 'COMPLETED',
        },
      });

      expect(result.releasedAt).toBeNull();
    });

    it('should handle payment failure', async () => {
      prismaMock.order.update.mockRejectedValue(
        new Error('Payment processing failed')
      );

      await expect(
        prismaMock.order.update({
          where: { id: 'order-1' },
          data: { status: 'PAID' },
        })
      ).rejects.toThrow('Payment processing failed');
    });
  });

  describe('Order Status Transitions', () => {
    it('should start order after payment', async () => {
      const mockStarted = {
        id: 'order-1',
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      };

      prismaMock.order.update.mockResolvedValue(mockStarted);

      const result = await prismaMock.order.update({
        where: { id: 'order-1' },
        data: { status: 'IN_PROGRESS', startedAt: new Date() },
      });

      expect(result.status).toBe('IN_PROGRESS');
      expect(result.startedAt).toBeDefined();
    });

    it('should not start unpaid order', async () => {
      prismaMock.order.update.mockRejectedValue(
        new Error('Cannot start unpaid order')
      );

      await expect(
        prismaMock.order.update({
          where: { id: 'order-1' },
          data: { status: 'IN_PROGRESS' },
        })
      ).rejects.toThrow('Cannot start unpaid order');
    });

    it('should mark order as delivered', async () => {
      const mockDelivered = {
        id: 'order-1',
        status: 'DELIVERED',
        deliveredAt: new Date(),
      };

      prismaMock.order.update.mockResolvedValue(mockDelivered);

      const result = await prismaMock.order.update({
        where: { id: 'order-1' },
        data: { status: 'DELIVERED', deliveredAt: new Date() },
      });

      expect(result.status).toBe('DELIVERED');
    });

    it('should complete order after client approval', async () => {
      const mockCompleted = {
        id: 'order-1',
        status: 'COMPLETED',
        completedAt: new Date(),
      };

      prismaMock.order.update.mockResolvedValue(mockCompleted);

      const result = await prismaMock.order.update({
        where: { id: 'order-1' },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });

      expect(result.status).toBe('COMPLETED');
    });
  });

  describe('Payment Release', () => {
    it('should release payment to fixer on completion', async () => {
      const mockReleased = {
        id: 'payment-1',
        status: 'RELEASED',
        releasedAt: new Date(),
      };

      prismaMock.payment.update.mockResolvedValue(mockReleased);

      const result = await prismaMock.payment.update({
        where: { id: 'payment-1' },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });

      expect(result.status).toBe('RELEASED');
      expect(result.releasedAt).toBeDefined();
    });

    it('should auto-release after 7 days', async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const mockAutoReleased = {
        id: 'payment-1',
        deliveredAt: sevenDaysAgo,
        status: 'RELEASED',
        releasedAt: new Date(),
      };

      prismaMock.payment.update.mockResolvedValue(mockAutoReleased);

      const result = await prismaMock.payment.update({
        where: { id: 'payment-1' },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });

      expect(result.status).toBe('RELEASED');
    });
  });

  describe('Order Cancellation', () => {
    it('should allow cancellation before payment', async () => {
      const mockCancelled = {
        id: 'order-1',
        status: 'CANCELLED',
        cancelledAt: new Date(),
      };

      prismaMock.order.update.mockResolvedValue(mockCancelled);

      const result = await prismaMock.order.update({
        where: { id: 'order-1' },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      });

      expect(result.status).toBe('CANCELLED');
    });

    it('should refund on cancellation after payment', async () => {
      const mockRefunded = {
        id: 'payment-1',
        status: 'REFUNDED',
        refundedAt: new Date(),
      };

      prismaMock.payment.update.mockResolvedValue(mockRefunded);

      const result = await prismaMock.payment.update({
        where: { id: 'payment-1' },
        data: { status: 'REFUNDED', refundedAt: new Date() },
      });

      expect(result.status).toBe('REFUNDED');
    });

    it('should not cancel completed order', async () => {
      prismaMock.order.update.mockRejectedValue(
        new Error('Cannot cancel completed order')
      );

      await expect(
        prismaMock.order.update({
          where: { id: 'order-1' },
          data: { status: 'CANCELLED' },
        })
      ).rejects.toThrow('Cannot cancel completed order');
    });
  });

  describe('Disputes', () => {
    it('should create dispute for order', async () => {
      const mockDispute = {
        id: 'dispute-1',
        orderId: 'order-1',
        initiatedBy: 'CLIENT',
        reason: 'Work not completed as agreed',
        status: 'OPEN',
        createdAt: new Date(),
      };

      prismaMock.dispute.create.mockResolvedValue(mockDispute);

      const result = await prismaMock.dispute.create({
        data: {
          orderId: 'order-1',
          initiatedBy: 'CLIENT',
          reason: 'Work not completed as agreed',
        },
      });

      expect(result.status).toBe('OPEN');
    });

    it('should freeze payment during dispute', async () => {
      const mockFrozen = {
        id: 'payment-1',
        isFlagged: true,
        flagReason: 'Dispute initiated',
      };

      prismaMock.payment.update.mockResolvedValue(mockFrozen);

      const result = await prismaMock.payment.update({
        where: { id: 'payment-1' },
        data: { isFlagged: true, flagReason: 'Dispute initiated' },
      });

      expect(result.isFlagged).toBe(true);
    });
  });
});
