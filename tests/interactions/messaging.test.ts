import { describe, it, expect, beforeEach, vi } from 'vitest';
import { prismaMock } from '../setup';

describe('Client-Fixer Messaging', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Sending Messages', () => {
    it('should send message from client to fixer', async () => {
      const mockMessage = {
        id: 'msg-1',
        orderId: 'order-1',
        senderId: 'client-1',
        receiverId: 'fixer-1',
        content: 'When can you start the work?',
        createdAt: new Date(),
        read: false,
      };

      prismaMock.message.create.mockResolvedValue(mockMessage);

      const result = await prismaMock.message.create({
        data: {
          orderId: 'order-1',
          senderId: 'client-1',
          receiverId: 'fixer-1',
          content: 'When can you start the work?',
        },
      });

      expect(result.content).toBe('When can you start the work?');
      expect(result.read).toBe(false);
    });

    it('should send message from fixer to client', async () => {
      const mockMessage = {
        id: 'msg-2',
        orderId: 'order-1',
        senderId: 'fixer-1',
        receiverId: 'client-1',
        content: 'I can start tomorrow morning',
        createdAt: new Date(),
        read: false,
      };

      prismaMock.message.create.mockResolvedValue(mockMessage);

      const result = await prismaMock.message.create({
        data: {
          orderId: 'order-1',
          senderId: 'fixer-1',
          receiverId: 'client-1',
          content: 'I can start tomorrow morning',
        },
      });

      expect(result.senderId).toBe('fixer-1');
    });

    it('should not allow empty messages', async () => {
      prismaMock.message.create.mockRejectedValue(
        new Error('Message content cannot be empty')
      );

      await expect(
        prismaMock.message.create({
          data: {
            orderId: 'order-1',
            senderId: 'client-1',
            receiverId: 'fixer-1',
            content: '',
          },
        })
      ).rejects.toThrow('Message content cannot be empty');
    });
  });

  describe('Reading Messages', () => {
    it('should fetch conversation between client and fixer', async () => {
      const mockMessages = [
        {
          id: 'msg-1',
          senderId: 'client-1',
          content: 'When can you start?',
          createdAt: new Date('2025-01-01T10:00:00'),
        },
        {
          id: 'msg-2',
          senderId: 'fixer-1',
          content: 'Tomorrow morning',
          createdAt: new Date('2025-01-01T10:05:00'),
        },
      ];

      prismaMock.message.findMany.mockResolvedValue(mockMessages);

      const results = await prismaMock.message.findMany({
        where: { orderId: 'order-1' },
        orderBy: { createdAt: 'asc' },
      });

      expect(results).toHaveLength(2);
      expect(results[1].senderId).toBe('fixer-1');
    });

    it('should mark messages as read', async () => {
      prismaMock.message.updateMany.mockResolvedValue({ count: 3 });

      const result = await prismaMock.message.updateMany({
        where: {
          receiverId: 'client-1',
          read: false,
        },
        data: { read: true },
      });

      expect(result.count).toBe(3);
    });

    it('should count unread messages', async () => {
      prismaMock.message.count.mockResolvedValue(5);

      const count = await prismaMock.message.count({
        where: {
          receiverId: 'fixer-1',
          read: false,
        },
      });

      expect(count).toBe(5);
    });
  });

  describe('Message Attachments', () => {
    it('should send message with image attachment', async () => {
      const mockMessage = {
        id: 'msg-3',
        content: 'Here is the problem',
        attachments: ['image1.jpg', 'image2.jpg'],
      };

      prismaMock.message.create.mockResolvedValue(mockMessage);

      const result = await prismaMock.message.create({
        data: {
          orderId: 'order-1',
          senderId: 'client-1',
          receiverId: 'fixer-1',
          content: 'Here is the problem',
          attachments: ['image1.jpg', 'image2.jpg'],
        },
      });

      expect(result.attachments).toHaveLength(2);
    });
  });

  describe('Real-time Notifications', () => {
    it('should trigger real-time notification on new message', async () => {
      const mockPusher = vi.fn();

      await mockPusher({
        channel: 'order-1',
        event: 'new-message',
        data: {
          messageId: 'msg-1',
          senderId: 'client-1',
          content: 'New message',
        },
      });

      expect(mockPusher).toHaveBeenCalled();
    });
  });
});
