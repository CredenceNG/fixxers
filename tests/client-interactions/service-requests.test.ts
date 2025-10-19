import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '../setup';

describe('Client Service Requests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Creating Service Requests', () => {
    it('should create a service request with valid data', async () => {
      const mockRequest = {
        id: 'req-1',
        title: 'Fix leaking pipe',
        description: 'My kitchen sink is leaking',
        categoryId: 'cat-plumbing',
        neighborhoodId: 'neigh-1',
        clientId: 'client-1',
        budget: 5000,
        status: 'OPEN',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prismaMock.serviceRequest.create.mockResolvedValue(mockRequest as any);

      const result = await prismaMock.serviceRequest.create({
        data: {
          title: 'Fix leaking pipe',
          description: 'My kitchen sink is leaking',
          categoryId: 'cat-plumbing',
          neighborhoodId: 'neigh-1',
          clientId: 'client-1',
          budget: 5000,
        },
      });

      expect(result).toEqual(mockRequest);
      expect(prismaMock.serviceRequest.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: 'Fix leaking pipe',
          budget: 5000,
        }),
      });
    });

    it('should not create request with negative budget', async () => {
      const createFn = vi.fn().mockRejectedValue(new Error('Budget must be positive'));

      prismaMock.serviceRequest.create.mockImplementation(createFn);

      await expect(
        prismaMock.serviceRequest.create({
          data: {
            title: 'Fix leaking pipe',
            budget: -100,
          } as any,
        })
      ).rejects.toThrow('Budget must be positive');
    });

    it('should require all mandatory fields', async () => {
      prismaMock.serviceRequest.create.mockRejectedValue(
        new Error('Missing required fields')
      );

      await expect(
        prismaMock.serviceRequest.create({
          data: {
            title: 'Fix leaking pipe',
            // Missing required fields
          } as any,
        })
      ).rejects.toThrow('Missing required fields');
    });
  });

  describe('Viewing Service Requests', () => {
    it('should fetch all requests for a client', async () => {
      const mockRequests = [
        {
          id: 'req-1',
          title: 'Fix leaking pipe',
          status: 'OPEN',
          clientId: 'client-1',
          _count: { quotes: 3 },
        },
        {
          id: 'req-2',
          title: 'Install new toilet',
          status: 'QUOTED',
          clientId: 'client-1',
          _count: { quotes: 1 },
        },
      ];

      prismaMock.serviceRequest.findMany.mockResolvedValue(mockRequests);

      const results = await prismaMock.serviceRequest.findMany({
        where: { clientId: 'client-1' },
        include: { _count: { select: { quotes: true } } },
      });

      expect(results).toHaveLength(2);
      expect(results[0]._count.quotes).toBe(3);
    });

    it('should filter requests by status', async () => {
      const mockRequests = [
        { id: 'req-1', status: 'OPEN', clientId: 'client-1' },
      ];

      prismaMock.serviceRequest.findMany.mockResolvedValue(mockRequests);

      const results = await prismaMock.serviceRequest.findMany({
        where: { clientId: 'client-1', status: 'OPEN' },
      });

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('OPEN');
    });
  });

  describe('Updating Service Requests', () => {
    it('should update request description', async () => {
      const mockUpdated = {
        id: 'req-1',
        description: 'Updated description with more details',
        updatedAt: new Date(),
      };

      prismaMock.serviceRequest.update.mockResolvedValue(mockUpdated);

      const result = await prismaMock.serviceRequest.update({
        where: { id: 'req-1' },
        data: { description: 'Updated description with more details' },
      });

      expect(result.description).toBe('Updated description with more details');
    });

    it('should cancel a service request', async () => {
      const mockCanceled = {
        id: 'req-1',
        status: 'CANCELLED',
        updatedAt: new Date(),
      };

      prismaMock.serviceRequest.update.mockResolvedValue(mockCanceled);

      const result = await prismaMock.serviceRequest.update({
        where: { id: 'req-1' },
        data: { status: 'CANCELLED' },
      });

      expect(result.status).toBe('CANCELLED');
    });

    it('should not cancel request with accepted quotes', async () => {
      prismaMock.serviceRequest.update.mockRejectedValue(
        new Error('Cannot cancel request with accepted quotes')
      );

      await expect(
        prismaMock.serviceRequest.update({
          where: { id: 'req-1' },
          data: { status: 'CANCELLED' },
        })
      ).rejects.toThrow('Cannot cancel request with accepted quotes');
    });
  });

  describe('Deleting Service Requests', () => {
    it('should delete an open request', async () => {
      const mockDeleted = { id: 'req-1', status: 'OPEN' };

      prismaMock.serviceRequest.delete.mockResolvedValue(mockDeleted);

      const result = await prismaMock.serviceRequest.delete({
        where: { id: 'req-1' },
      });

      expect(result.id).toBe('req-1');
    });

    it('should not delete request with active order', async () => {
      prismaMock.serviceRequest.delete.mockRejectedValue(
        new Error('Cannot delete request with active order')
      );

      await expect(
        prismaMock.serviceRequest.delete({
          where: { id: 'req-1' },
        })
      ).rejects.toThrow('Cannot delete request with active order');
    });
  });
});
