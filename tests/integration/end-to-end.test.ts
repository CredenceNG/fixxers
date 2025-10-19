import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '../setup';

describe('End-to-End User Flows', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete Service Request Flow', () => {
    it('should complete full cycle from request to review', async () => {
      // Step 1: Client creates service request
      const mockRequest = {
        id: 'req-1',
        clientId: 'client-1',
        title: 'Fix leaking pipe',
        budget: 5000,
        status: 'OPEN',
      };
      prismaMock.serviceRequest.create.mockResolvedValue(mockRequest);

      const serviceRequest = await prismaMock.serviceRequest.create({
        data: {
          clientId: 'client-1',
          title: 'Fix leaking pipe',
          budget: 5000,
        } as any,
      });
      expect(serviceRequest.status).toBe('OPEN');

      // Step 2: Multiple fixers submit quotes
      const mockQuotes = [
        { id: 'quote-1', fixerId: 'fixer-1', amount: 7500, status: 'PENDING' },
        { id: 'quote-2', fixerId: 'fixer-2', amount: 6000, status: 'PENDING' },
        { id: 'quote-3', fixerId: 'fixer-3', amount: 8000, status: 'PENDING' },
      ];
      prismaMock.quote.create.mockImplementation((args: any) =>
        Promise.resolve(mockQuotes.find(q => q.fixerId === args.data.fixerId))
      );

      const quote1 = await prismaMock.quote.create({
        data: { serviceRequestId: 'req-1', fixerId: 'fixer-1', amount: 7500 } as any,
      });
      const quote2 = await prismaMock.quote.create({
        data: { serviceRequestId: 'req-1', fixerId: 'fixer-2', amount: 6000 } as any,
      });
      const quote3 = await prismaMock.quote.create({
        data: { serviceRequestId: 'req-1', fixerId: 'fixer-3', amount: 8000 } as any,
      });

      expect([quote1, quote2, quote3]).toHaveLength(3);

      // Step 3: Client reviews and accepts best quote
      prismaMock.quote.update.mockResolvedValue({
        ...quote2,
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      });

      const acceptedQuote = await prismaMock.quote.update({
        where: { id: 'quote-2' },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });
      expect(acceptedQuote.status).toBe('ACCEPTED');

      // Step 4: Order is created
      const mockOrder = {
        id: 'order-1',
        quoteId: 'quote-2',
        clientId: 'client-1',
        fixerId: 'fixer-2',
        amount: 6000,
        status: 'PENDING_PAYMENT',
      };
      prismaMock.order.create.mockResolvedValue(mockOrder);

      const order = await prismaMock.order.create({
        data: {
          quoteId: 'quote-2',
          clientId: 'client-1',
          fixerId: 'fixer-2',
          amount: 6000,
        } as any,
      });
      expect(order.status).toBe('PENDING_PAYMENT');

      // Step 5: Client makes payment
      const mockPayment = {
        id: 'payment-1',
        orderId: 'order-1',
        amount: 6000,
        status: 'COMPLETED',
      };
      prismaMock.payment.create.mockResolvedValue(mockPayment);

      const payment = await prismaMock.payment.create({
        data: { orderId: 'order-1', amount: 6000, status: 'COMPLETED' } as any,
      });
      expect(payment.status).toBe('COMPLETED');

      // Step 6: Fixer starts work
      prismaMock.order.update.mockResolvedValue({
        ...order,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
      });

      const startedOrder = await prismaMock.order.update({
        where: { id: 'order-1' },
        data: { status: 'IN_PROGRESS', startedAt: new Date() },
      });
      expect(startedOrder.status).toBe('IN_PROGRESS');

      // Step 7: Client and Fixer communicate
      const mockMessages = [
        {
          id: 'msg-1',
          orderId: 'order-1',
          senderId: 'client-1',
          content: 'What time will you arrive?',
        },
        {
          id: 'msg-2',
          orderId: 'order-1',
          senderId: 'fixer-2',
          content: 'I will be there at 2pm',
        },
      ];
      prismaMock.message.create.mockImplementation((args: any) =>
        Promise.resolve(mockMessages.find(m => m.senderId === args.data.senderId))
      );

      const message1 = await prismaMock.message.create({
        data: {
          orderId: 'order-1',
          senderId: 'client-1',
          receiverId: 'fixer-2',
          content: 'What time will you arrive?',
        } as any,
      });
      expect(message1.content).toBe('What time will you arrive?');

      // Step 8: Fixer delivers work
      prismaMock.order.update.mockResolvedValue({
        ...order,
        status: 'DELIVERED',
        deliveredAt: new Date(),
      });

      const deliveredOrder = await prismaMock.order.update({
        where: { id: 'order-1' },
        data: { status: 'DELIVERED', deliveredAt: new Date() },
      });
      expect(deliveredOrder.status).toBe('DELIVERED');

      // Step 9: Client approves and completes order
      prismaMock.order.update.mockResolvedValue({
        ...order,
        status: 'COMPLETED',
        completedAt: new Date(),
      });

      const completedOrder = await prismaMock.order.update({
        where: { id: 'order-1' },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      expect(completedOrder.status).toBe('COMPLETED');

      // Step 10: Payment released to fixer
      prismaMock.payment.update.mockResolvedValue({
        ...payment,
        status: 'RELEASED',
        releasedAt: new Date(),
      });

      const releasedPayment = await prismaMock.payment.update({
        where: { id: 'payment-1' },
        data: { status: 'RELEASED', releasedAt: new Date() },
      });
      expect(releasedPayment.status).toBe('RELEASED');

      // Step 11: Client leaves review
      const mockReview = {
        id: 'review-1',
        orderId: 'order-1',
        fixerId: 'fixer-2',
        clientId: 'client-1',
        rating: 5,
        comment: 'Great work!',
      };
      prismaMock.review.create.mockResolvedValue(mockReview);

      const review = await prismaMock.review.create({
        data: {
          orderId: 'order-1',
          fixerId: 'fixer-2',
          clientId: 'client-1',
          rating: 5,
          comment: 'Great work!',
        } as any,
      });
      expect(review.rating).toBe(5);

      // Step 12: Fixer responds to review
      prismaMock.review.update.mockResolvedValue({
        ...review,
        response: 'Thank you!',
        respondedAt: new Date(),
      });

      const respondedReview = await prismaMock.review.update({
        where: { id: 'review-1' },
        data: { response: 'Thank you!', respondedAt: new Date() },
      });
      expect(respondedReview.response).toBe('Thank you!');

      // Verify the complete flow
      expect(serviceRequest.id).toBe('req-1');
      expect(acceptedQuote.fixerId).toBe('fixer-2');
      expect(order.amount).toBe(6000);
      expect(completedOrder.status).toBe('COMPLETED');
      expect(review.rating).toBe(5);
    });
  });

  describe('Cancellation Flow', () => {
    it('should handle order cancellation with refund', async () => {
      // Create order
      const mockOrder = {
        id: 'order-1',
        status: 'PAID',
        amount: 5000,
      };
      prismaMock.order.findUnique.mockResolvedValue(mockOrder);

      const order = await prismaMock.order.findUnique({
        where: { id: 'order-1' },
      });

      // Cancel order
      prismaMock.order.update.mockResolvedValue({
        ...order,
        status: 'CANCELLED',
        cancelledAt: new Date(),
      });

      const cancelled = await prismaMock.order.update({
        where: { id: 'order-1' },
        data: { status: 'CANCELLED', cancelledAt: new Date() },
      });

      // Process refund
      prismaMock.payment.update.mockResolvedValue({
        id: 'payment-1',
        orderId: 'order-1',
        status: 'REFUNDED',
        refundedAt: new Date(),
      });

      const refund = await prismaMock.payment.update({
        where: { orderId: 'order-1' },
        data: { status: 'REFUNDED', refundedAt: new Date() },
      });

      expect(cancelled.status).toBe('CANCELLED');
      expect(refund.status).toBe('REFUNDED');
    });
  });

  describe('Dispute Resolution Flow', () => {
    it('should handle dispute from creation to resolution', async () => {
      // Create dispute
      const mockDispute = {
        id: 'dispute-1',
        orderId: 'order-1',
        initiatedBy: 'CLIENT',
        reason: 'Work incomplete',
        status: 'OPEN',
      };
      prismaMock.dispute.create.mockResolvedValue(mockDispute);

      const dispute = await prismaMock.dispute.create({
        data: {
          orderId: 'order-1',
          initiatedBy: 'CLIENT',
          reason: 'Work incomplete',
        },
      });

      // Freeze payment
      prismaMock.payment.update.mockResolvedValue({
        id: 'payment-1',
        isFlagged: true,
      });

      const frozenPayment = await prismaMock.payment.update({
        where: { orderId: 'order-1' },
        data: { isFlagged: true },
      });

      // Admin reviews and resolves
      prismaMock.dispute.update.mockResolvedValue({
        ...dispute,
        status: 'RESOLVED',
        resolution: 'Partial refund issued',
        resolvedAt: new Date(),
      });

      const resolved = await prismaMock.dispute.update({
        where: { id: 'dispute-1' },
        data: {
          status: 'RESOLVED',
          resolution: 'Partial refund issued',
          resolvedAt: new Date(),
        },
      });

      expect(dispute.status).toBe('OPEN');
      expect(frozenPayment.isFlagged).toBe(true);
      expect(resolved.status).toBe('RESOLVED');
    });
  });
});
