import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// In-memory fallback for development/testing without Upstash
class InMemoryStore {
  private store: Map<string, { count: number; resetAt: number }> = new Map();

  async limit(key: string, limit: number, window: number): Promise<{
    success: boolean;
    limit: number;
    remaining: number;
    reset: number;
  }> {
    const now = Date.now();
    const stored = this.store.get(key);

    // Clean up expired entries
    if (stored && stored.resetAt < now) {
      this.store.delete(key);
    }

    const current = this.store.get(key);

    if (!current) {
      // First request in window
      this.store.set(key, { count: 1, resetAt: now + window });
      return {
        success: true,
        limit,
        remaining: limit - 1,
        reset: now + window,
      };
    }

    if (current.count >= limit) {
      // Rate limit exceeded
      return {
        success: false,
        limit,
        remaining: 0,
        reset: current.resetAt,
      };
    }

    // Increment count
    current.count++;
    this.store.set(key, current);

    return {
      success: true,
      limit,
      remaining: limit - current.count,
      reset: current.resetAt,
    };
  }

  // Cleanup old entries periodically
  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.store.entries()) {
      if (value.resetAt < now) {
        this.store.delete(key);
      }
    }
  }
}

// Initialize in-memory store
const inMemoryStore = new InMemoryStore();

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => inMemoryStore.cleanup(), 5 * 60 * 1000);
}

// Create Redis instance if credentials are available
const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null;

/**
 * Create a rate limiter with specified limits
 * @param requests - Number of requests allowed
 * @param window - Time window in milliseconds
 */
function createRateLimiter(requests: number, window: number) {
  if (redis) {
    // Use Upstash Redis for production
    return new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(requests, `${window}ms`),
      analytics: true,
    });
  }

  // Fallback to in-memory for development
  return {
    limit: async (identifier: string) => {
      return inMemoryStore.limit(identifier, requests, window);
    },
  };
}

/**
 * Helper function to apply rate limiting to API routes
 */
export async function rateLimit(
  identifier: string,
  limiter: ReturnType<typeof createRateLimiter>
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}> {
  return await limiter.limit(identifier);
}

/**
 * Get client identifier from request (IP address or user ID)
 */
export function getClientIdentifier(
  request: Request,
  userId?: string
): string {
  if (userId) {
    return `user:${userId}`;
  }

  // Get IP from various headers
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');

  const ip = forwarded?.split(',')[0] || realIp || cfConnectingIp || 'unknown';

  return `ip:${ip}`;
}

/**
 * Create rate limit response
 */
export function rateLimitResponse(result: {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}) {
  return new Response(
    JSON.stringify({
      error: 'Too many requests',
      message: 'You have exceeded the rate limit. Please try again later.',
      limit: result.limit,
      remaining: result.remaining,
      reset: new Date(result.reset).toISOString(),
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'X-RateLimit-Limit': result.limit.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': result.reset.toString(),
        'Retry-After': Math.ceil((result.reset - Date.now()) / 1000).toString(),
      },
    }
  );
}

// Pre-configured rate limiters for different use cases

/**
 * Strict rate limiting for auth endpoints (login, register, etc.)
 * 5 requests per 15 minutes per IP
 */
export const authLimiter = createRateLimiter(5, 15 * 60 * 1000);

/**
 * Standard rate limiting for general API endpoints
 * 60 requests per minute per user/IP
 */
export const apiLimiter = createRateLimiter(60, 60 * 1000);

/**
 * Strict rate limiting for sensitive operations (payments, withdrawals, etc.)
 * 10 requests per hour per user
 */
export const strictLimiter = createRateLimiter(10, 60 * 60 * 1000);

/**
 * Generous rate limiting for read-only operations
 * 100 requests per minute per user/IP
 */
export const readLimiter = createRateLimiter(100, 60 * 1000);

/**
 * Very strict rate limiting for password/verification attempts
 * 3 requests per 15 minutes per IP
 */
export const verificationLimiter = createRateLimiter(3, 15 * 60 * 1000);
