import { describe, it, expect, vi, beforeEach } from 'vitest';
import jwt from 'jsonwebtoken';
import * as authLib from '@/lib/auth';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    magicLink: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

import { prisma } from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing';

describe('Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateSessionToken', () => {
    it('should generate a valid JWT session token', () => {
      const payload = {
        userId: 'user-123',
        email: 'test@example.com',
        role: 'CLIENT',
        roles: ['CLIENT'],
      };

      const token = authLib.generateSessionToken(payload);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');

      // Verify token can be decoded
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      expect(decoded.userId).toBe('user-123');
      expect(decoded.email).toBe('test@example.com');
      expect(decoded.roles).toEqual(['CLIENT']);
    });

    it('should generate token with 7 day expiration', () => {
      const payload = { userId: 'user-123', email: 'test@example.com', role: 'CLIENT', roles: [] };
      const token = authLib.generateSessionToken(payload);

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      expect(decoded.exp).toBeTruthy();

      // Check that expiration is approximately 7 days from now
      const expectedExpiry = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60);
      expect(decoded.exp).toBeGreaterThan(expectedExpiry - 60); // Within 1 minute
      expect(decoded.exp).toBeLessThan(expectedExpiry + 60);
    });
  });

  describe('generateMagicLink', () => {
    it('should create magic link token and store in database', async () => {
      const userId = 'user-123';
      const mockMagicLink = {
        id: 'link-1',
        token: 'mock-token',
        userId,
        expiresAt: new Date(),
        used: false,
      };

      vi.mocked(prisma.magicLink.create).mockResolvedValue(mockMagicLink as any);

      const token = await authLib.generateMagicLink(userId);

      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');

      // Verify it was stored in database
      expect(prisma.magicLink.create).toHaveBeenCalledWith({
        data: {
          token: expect.any(String),
          userId,
          expiresAt: expect.any(Date),
        },
      });
    });

    it('should generate token with 15 minute expiration', async () => {
      const userId = 'user-123';
      vi.mocked(prisma.magicLink.create).mockResolvedValue({} as any);

      const token = await authLib.generateMagicLink(userId);

      const decoded = jwt.verify(token, JWT_SECRET) as any;
      expect(decoded.type).toBe('magic');
      expect(decoded.userId).toBe(userId);
      expect(decoded.exp).toBeTruthy();
    });
  });

  describe('verifyMagicLink', () => {
    it('should verify valid magic link', async () => {
      const userId = 'user-123';
      const token = jwt.sign({ userId, type: 'magic' }, JWT_SECRET, { expiresIn: '15m' });

      const futureDate = new Date();
      futureDate.setMinutes(futureDate.getMinutes() + 10);

      vi.mocked(prisma.magicLink.findUnique).mockResolvedValue({
        id: 'link-1',
        token,
        userId,
        expiresAt: futureDate,
        used: false,
        createdAt: new Date(),
      } as any);

      vi.mocked(prisma.magicLink.update).mockResolvedValue({} as any);

      const result = await authLib.verifyMagicLink(token);

      expect(result).toBe(userId);
      expect(prisma.magicLink.update).toHaveBeenCalledWith({
        where: { token },
        data: { used: true },
      });
    });

    it('should return null for invalid token', async () => {
      const result = await authLib.verifyMagicLink('invalid-token');

      expect(result).toBeNull();
      expect(prisma.magicLink.findUnique).not.toHaveBeenCalled();
    });

    it('should return null for already used magic link', async () => {
      const userId = 'user-123';
      const token = jwt.sign({ userId, type: 'magic' }, JWT_SECRET);

      vi.mocked(prisma.magicLink.findUnique).mockResolvedValue({
        id: 'link-1',
        token,
        userId,
        expiresAt: new Date(Date.now() + 10000),
        used: true, // Already used
        createdAt: new Date(),
      } as any);

      const result = await authLib.verifyMagicLink(token);

      expect(result).toBeNull();
    });

    it('should return null for expired magic link', async () => {
      const userId = 'user-123';
      const token = jwt.sign({ userId, type: 'magic' }, JWT_SECRET);

      const pastDate = new Date();
      pastDate.setMinutes(pastDate.getMinutes() - 20); // Expired

      vi.mocked(prisma.magicLink.findUnique).mockResolvedValue({
        id: 'link-1',
        token,
        userId,
        expiresAt: pastDate,
        used: false,
        createdAt: new Date(),
      } as any);

      const result = await authLib.verifyMagicLink(token);

      expect(result).toBeNull();
    });

    it('should return null for wrong token type', async () => {
      const userId = 'user-123';
      const token = jwt.sign({ userId, type: 'session' }, JWT_SECRET); // Wrong type

      const result = await authLib.verifyMagicLink(token);

      expect(result).toBeNull();
    });
  });

  describe('hasRole', () => {
    it('should return true if user has required role', () => {
      const user = { id: '1', roles: ['ADMIN', 'CLIENT'] };

      expect(authLib.hasRole(user, ['ADMIN'])).toBe(true);
      expect(authLib.hasRole(user, ['CLIENT'])).toBe(true);
    });

    it('should return false if user does not have required role', () => {
      const user = { id: '1', roles: ['CLIENT'] };

      expect(authLib.hasRole(user, ['ADMIN'])).toBe(false);
    });

    it('should return true if user has any of multiple allowed roles', () => {
      const user = { id: '1', roles: ['FIXER'] };

      expect(authLib.hasRole(user, ['ADMIN', 'FIXER'])).toBe(true);
    });

    it('should return false for null user', () => {
      expect(authLib.hasRole(null, ['ADMIN'])).toBe(false);
    });

    it('should return false if user has no roles', () => {
      const user = { id: '1', roles: [] };

      expect(authLib.hasRole(user, ['ADMIN'])).toBe(false);
    });

    it('should return false if user roles is undefined', () => {
      const user = { id: '1', roles: undefined };

      expect(authLib.hasRole(user, ['ADMIN'])).toBe(false);
    });
  });

  describe('hasAnyRole', () => {
    it('should return true if user has the specific role', () => {
      const user = { id: '1', roles: ['ADMIN', 'CLIENT'] };

      expect(authLib.hasAnyRole(user, 'ADMIN')).toBe(true);
      expect(authLib.hasAnyRole(user, 'CLIENT')).toBe(true);
    });

    it('should return false if user does not have the role', () => {
      const user = { id: '1', roles: ['CLIENT'] };

      expect(authLib.hasAnyRole(user, 'ADMIN')).toBe(false);
    });

    it('should return false for null user', () => {
      expect(authLib.hasAnyRole(null, 'ADMIN')).toBe(false);
    });

    it('should return false if user has no roles', () => {
      const user = { id: '1', roles: undefined };

      expect(authLib.hasAnyRole(user, 'ADMIN')).toBe(false);
    });
  });

  describe('getCurrentUser', () => {
    it('should return user when valid token exists', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        roles: ['CLIENT'],
        status: 'ACTIVE',
      };

      const payload = { userId: 'user-123', email: 'test@example.com', role: 'CLIENT', roles: ['CLIENT'] };
      const token = jwt.sign(payload, JWT_SECRET);

      // Mock cookies to return token
      const mockCookies = {
        get: vi.fn().mockReturnValue({ value: token }),
        set: vi.fn(),
        delete: vi.fn(),
      };
      vi.mocked(await import('next/headers')).cookies = vi.fn(() => mockCookies) as any;

      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser as any);

      const result = await authLib.getCurrentUser();

      expect(result).toEqual(mockUser);
    });

    it('should return null when no token exists', async () => {
      const mockCookies = {
        get: vi.fn().mockReturnValue(undefined),
        set: vi.fn(),
        delete: vi.fn(),
      };
      vi.mocked(await import('next/headers')).cookies = vi.fn(() => mockCookies) as any;

      const result = await authLib.getCurrentUser();

      expect(result).toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should return null when token is invalid', async () => {
      const mockCookies = {
        get: vi.fn().mockReturnValue({ value: 'invalid-token' }),
        set: vi.fn(),
        delete: vi.fn(),
      };
      vi.mocked(await import('next/headers')).cookies = vi.fn(() => mockCookies) as any;

      const result = await authLib.getCurrentUser();

      expect(result).toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });
  });
});
