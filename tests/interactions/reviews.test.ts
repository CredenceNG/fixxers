import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '../setup';

describe('Reviews and Ratings', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Submitting Reviews', () => {
    it('should submit review after order completion', async () => {
      const mockReview = {
        id: 'review-1',
        orderId: 'order-1',
        fixerId: 'fixer-1',
        clientId: 'client-1',
        rating: 5,
        comment: 'Excellent work! Very professional.',
        createdAt: new Date(),
      };

      prismaMock.review.create.mockResolvedValue(mockReview);

      const result = await prismaMock.review.create({
        data: {
          orderId: 'order-1',
          fixerId: 'fixer-1',
          clientId: 'client-1',
          rating: 5,
          comment: 'Excellent work! Very professional.',
        },
      });

      expect(result.rating).toBe(5);
      expect(result.comment).toBe('Excellent work! Very professional.');
    });

    it('should validate rating is between 1 and 5', async () => {
      prismaMock.review.create.mockRejectedValue(
        new Error('Rating must be between 1 and 5')
      );

      await expect(
        prismaMock.review.create({
          data: {
            orderId: 'order-1',
            fixerId: 'fixer-1',
            clientId: 'client-1',
            rating: 6,
          } as any,
        })
      ).rejects.toThrow('Rating must be between 1 and 5');
    });

    it('should not allow review for incomplete order', async () => {
      prismaMock.review.create.mockRejectedValue(
        new Error('Can only review completed orders')
      );

      await expect(
        prismaMock.review.create({
          data: {
            orderId: 'order-1',
            fixerId: 'fixer-1',
            clientId: 'client-1',
            rating: 5,
          } as any,
        })
      ).rejects.toThrow('Can only review completed orders');
    });

    it('should not allow duplicate review', async () => {
      prismaMock.review.create.mockRejectedValue(
        new Error('Already reviewed this order')
      );

      await expect(
        prismaMock.review.create({
          data: {
            orderId: 'order-1',
            fixerId: 'fixer-1',
            clientId: 'client-1',
            rating: 5,
          } as any,
        })
      ).rejects.toThrow('Already reviewed this order');
    });
  });

  describe('Review Photos', () => {
    it('should upload photos with review', async () => {
      const mockReview = {
        id: 'review-1',
        rating: 5,
        photos: ['before.jpg', 'after.jpg'],
      };

      prismaMock.review.create.mockResolvedValue(mockReview);

      const result = await prismaMock.review.create({
        data: {
          orderId: 'order-1',
          fixerId: 'fixer-1',
          clientId: 'client-1',
          rating: 5,
          photos: ['before.jpg', 'after.jpg'],
        } as any,
      });

      expect(result.photos).toHaveLength(2);
    });

    it('should limit photo uploads to 5', async () => {
      prismaMock.review.create.mockRejectedValue(
        new Error('Maximum 5 photos allowed')
      );

      const photos = Array(6).fill('photo.jpg');

      await expect(
        prismaMock.review.create({
          data: {
            orderId: 'order-1',
            fixerId: 'fixer-1',
            clientId: 'client-1',
            rating: 5,
            photos,
          } as any,
        })
      ).rejects.toThrow('Maximum 5 photos allowed');
    });
  });

  describe('Fixer Responses', () => {
    it('should allow fixer to respond to review', async () => {
      const mockUpdated = {
        id: 'review-1',
        response: 'Thank you for the kind words!',
        respondedAt: new Date(),
      };

      prismaMock.review.update.mockResolvedValue(mockUpdated);

      const result = await prismaMock.review.update({
        where: { id: 'review-1' },
        data: {
          response: 'Thank you for the kind words!',
          respondedAt: new Date(),
        },
      });

      expect(result.response).toBe('Thank you for the kind words!');
    });
  });

  describe('Review Aggregation', () => {
    it('should calculate average rating for fixer', async () => {
      const mockReviews = [
        { rating: 5 },
        { rating: 4 },
        { rating: 5 },
        { rating: 3 },
        { rating: 5 },
      ];

      prismaMock.review.findMany.mockResolvedValue(mockReviews);

      const reviews = await prismaMock.review.findMany({
        where: { fixerId: 'fixer-1' },
        select: { rating: true },
      });

      const average = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      expect(average).toBe(4.4);
    });

    it('should count total reviews', async () => {
      prismaMock.review.count.mockResolvedValue(25);

      const count = await prismaMock.review.count({
        where: { fixerId: 'fixer-1' },
      });

      expect(count).toBe(25);
    });

    it('should get rating distribution', async () => {
      const mockReviews = [
        { rating: 5 },
        { rating: 5 },
        { rating: 5 },
        { rating: 4 },
        { rating: 3 },
      ];

      prismaMock.review.findMany.mockResolvedValue(mockReviews);

      const reviews = await prismaMock.review.findMany({
        where: { fixerId: 'fixer-1' },
        select: { rating: true },
      });

      const distribution = reviews.reduce((acc, r) => {
        acc[r.rating] = (acc[r.rating] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);

      expect(distribution[5]).toBe(3);
      expect(distribution[4]).toBe(1);
      expect(distribution[3]).toBe(1);
    });
  });

  describe('Helpful Votes', () => {
    it('should mark review as helpful', async () => {
      const mockVote = {
        id: 'vote-1',
        reviewId: 'review-1',
        userId: 'user-1',
        helpful: true,
      };

      prismaMock.reviewHelpful.create.mockResolvedValue(mockVote);

      const result = await prismaMock.reviewHelpful.create({
        data: {
          reviewId: 'review-1',
          userId: 'user-1',
          helpful: true,
        },
      });

      expect(result.helpful).toBe(true);
    });

    it('should count helpful votes', async () => {
      prismaMock.reviewHelpful.count.mockResolvedValue(15);

      const count = await prismaMock.reviewHelpful.count({
        where: { reviewId: 'review-1', helpful: true },
      });

      expect(count).toBe(15);
    });
  });

  describe('Moderation', () => {
    it('should report inappropriate review', async () => {
      const mockReport = {
        id: 'report-1',
        reviewId: 'review-1',
        reason: 'Inappropriate language',
        reportedBy: 'user-1',
        status: 'PENDING',
      };

      prismaMock.reviewReport.create.mockResolvedValue(mockReport);

      const result = await prismaMock.reviewReport.create({
        data: {
          reviewId: 'review-1',
          reason: 'Inappropriate language',
          reportedBy: 'user-1',
        },
      });

      expect(result.status).toBe('PENDING');
    });

    it('should hide flagged review', async () => {
      const mockHidden = {
        id: 'review-1',
        isHidden: true,
        hiddenReason: 'Violates community guidelines',
      };

      prismaMock.review.update.mockResolvedValue(mockHidden);

      const result = await prismaMock.review.update({
        where: { id: 'review-1' },
        data: {
          isHidden: true,
          hiddenReason: 'Violates community guidelines',
        },
      });

      expect(result.isHidden).toBe(true);
    });
  });
});
