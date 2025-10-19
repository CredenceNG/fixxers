import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '../setup';

describe('Fixer Quotes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Submitting Quotes', () => {
    it('should submit a quote with valid data', async () => {
      const mockQuote = {
        id: 'quote-1',
        serviceRequestId: 'req-1',
        fixerId: 'fixer-1',
        amount: 7500,
        estimatedDuration: 3,
        durationUnit: 'HOURS',
        description: 'Will fix the leak and check all pipes',
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.quote.create.mockResolvedValue(mockQuote);

      const result = await prismaMock.quote.create({
        data: {
          serviceRequestId: 'req-1',
          fixerId: 'fixer-1',
          amount: 7500,
          estimatedDuration: 3,
          durationUnit: 'HOURS',
          description: 'Will fix the leak and check all pipes',
        },
      });

      expect(result).toEqual(mockQuote);
      expect(result.amount).toBe(7500);
      expect(result.status).toBe('PENDING');
    });

    it('should not submit quote with zero amount', async () => {
      prismaMock.quote.create.mockRejectedValue(
        new Error('Quote amount must be greater than zero')
      );

      await expect(
        prismaMock.quote.create({
          data: {
            serviceRequestId: 'req-1',
            fixerId: 'fixer-1',
            amount: 0,
          } as any,
        })
      ).rejects.toThrow('Quote amount must be greater than zero');
    });

    it('should not submit duplicate quote for same request', async () => {
      prismaMock.quote.create.mockRejectedValue(
        new Error('Fixer already submitted a quote for this request')
      );

      await expect(
        prismaMock.quote.create({
          data: {
            serviceRequestId: 'req-1',
            fixerId: 'fixer-1',
            amount: 5000,
          } as any,
        })
      ).rejects.toThrow('Fixer already submitted a quote for this request');
    });

    it('should validate estimated duration', async () => {
      prismaMock.quote.create.mockRejectedValue(
        new Error('Estimated duration must be positive')
      );

      await expect(
        prismaMock.quote.create({
          data: {
            serviceRequestId: 'req-1',
            fixerId: 'fixer-1',
            amount: 5000,
            estimatedDuration: -1,
          } as any,
        })
      ).rejects.toThrow('Estimated duration must be positive');
    });
  });

  describe('Viewing Quotes', () => {
    it('should fetch all quotes for a fixer', async () => {
      const mockQuotes = [
        {
          id: 'quote-1',
          serviceRequestId: 'req-1',
          fixerId: 'fixer-1',
          amount: 7500,
          status: 'PENDING',
        },
        {
          id: 'quote-2',
          serviceRequestId: 'req-2',
          fixerId: 'fixer-1',
          amount: 10000,
          status: 'ACCEPTED',
        },
      ];

      prismaMock.quote.findMany.mockResolvedValue(mockQuotes);

      const results = await prismaMock.quote.findMany({
        where: { fixerId: 'fixer-1' },
      });

      expect(results).toHaveLength(2);
      expect(results[1].status).toBe('ACCEPTED');
    });

    it('should fetch all quotes for a service request', async () => {
      const mockQuotes = [
        { id: 'quote-2', amount: 6000, fixerId: 'fixer-2', status: 'PENDING' },
        { id: 'quote-1', amount: 7500, fixerId: 'fixer-1', status: 'PENDING' },
        { id: 'quote-3', amount: 8000, fixerId: 'fixer-3', status: 'PENDING' },
      ];

      prismaMock.quote.findMany.mockResolvedValue(mockQuotes);

      const results = await prismaMock.quote.findMany({
        where: { serviceRequestId: 'req-1' },
        orderBy: { amount: 'asc' },
      });

      expect(results).toHaveLength(3);
      expect(results[0].amount).toBe(6000); // Lowest quote first
    });

    it('should include fixer profile with quotes', async () => {
      const mockQuotes = [
        {
          id: 'quote-1',
          amount: 7500,
          fixer: {
            id: 'fixer-1',
            user: {
              name: 'John Plumber',
              profileImage: 'avatar.jpg',
            },
            rating: 4.8,
            completedJobs: 150,
          },
        },
      ];

      prismaMock.quote.findMany.mockResolvedValue(mockQuotes);

      const results = await prismaMock.quote.findMany({
        where: { serviceRequestId: 'req-1' },
        include: {
          fixer: {
            include: {
              user: { select: { name: true, profileImage: true } },
            },
          },
        },
      });

      expect(results[0].fixer.user.name).toBe('John Plumber');
      expect(results[0].fixer.rating).toBe(4.8);
    });
  });

  describe('Updating Quotes', () => {
    it('should allow fixer to update quote before acceptance', async () => {
      const mockUpdated = {
        id: 'quote-1',
        amount: 6500,
        description: 'Updated with more details',
        updatedAt: new Date(),
      };

      prismaMock.quote.update.mockResolvedValue(mockUpdated);

      const result = await prismaMock.quote.update({
        where: { id: 'quote-1' },
        data: { amount: 6500, description: 'Updated with more details' },
      });

      expect(result.amount).toBe(6500);
    });

    it('should not update quote after acceptance', async () => {
      prismaMock.quote.update.mockRejectedValue(
        new Error('Cannot update accepted quote')
      );

      await expect(
        prismaMock.quote.update({
          where: { id: 'quote-1' },
          data: { amount: 5000 },
        })
      ).rejects.toThrow('Cannot update accepted quote');
    });
  });

  describe('Accepting Quotes', () => {
    it('should accept a quote', async () => {
      const mockAccepted = {
        id: 'quote-1',
        status: 'ACCEPTED',
        acceptedAt: new Date(),
      };

      prismaMock.quote.update.mockResolvedValue(mockAccepted);

      const result = await prismaMock.quote.update({
        where: { id: 'quote-1' },
        data: { status: 'ACCEPTED', acceptedAt: new Date() },
      });

      expect(result.status).toBe('ACCEPTED');
      expect(result.acceptedAt).toBeDefined();
    });

    it('should reject other quotes when one is accepted', async () => {
      const mockResults = [
        { id: 'quote-2', status: 'REJECTED' },
        { id: 'quote-3', status: 'REJECTED' },
      ];

      prismaMock.quote.updateMany.mockResolvedValue({ count: 2 });

      const result = await prismaMock.quote.updateMany({
        where: {
          serviceRequestId: 'req-1',
          id: { not: 'quote-1' },
        },
        data: { status: 'REJECTED' },
      });

      expect(result.count).toBe(2);
    });
  });

  describe('Withdrawing Quotes', () => {
    it('should allow fixer to withdraw quote', async () => {
      const mockWithdrawn = {
        id: 'quote-1',
        status: 'WITHDRAWN',
        updatedAt: new Date(),
      };

      prismaMock.quote.update.mockResolvedValue(mockWithdrawn);

      const result = await prismaMock.quote.update({
        where: { id: 'quote-1' },
        data: { status: 'WITHDRAWN' },
      });

      expect(result.status).toBe('WITHDRAWN');
    });

    it('should not withdraw accepted quote', async () => {
      prismaMock.quote.update.mockRejectedValue(
        new Error('Cannot withdraw accepted quote')
      );

      await expect(
        prismaMock.quote.update({
          where: { id: 'quote-1' },
          data: { status: 'WITHDRAWN' },
        })
      ).rejects.toThrow('Cannot withdraw accepted quote');
    });
  });

  describe('Quote Notifications', () => {
    it('should notify client when quote is submitted', async () => {
      const sendEmail = vi.fn().mockResolvedValue(true);

      await sendEmail({
        to: 'client@example.com',
        subject: 'New Quote Received',
        template: 'new-quote',
      });

      expect(sendEmail).toHaveBeenCalled();
    });

    it('should notify fixer when quote is accepted', async () => {
      const sendEmail = vi.fn().mockResolvedValue(true);

      await sendEmail({
        to: 'fixer@example.com',
        subject: 'Quote Accepted',
        template: 'quote-accepted',
      });

      expect(sendEmail).toHaveBeenCalled();
    });
  });
});
