import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface JWTPayload {
  userId: string;
  email?: string;
  phone?: string;
  role: string;
  hasProfile?: boolean;
}

/**
 * Verify a JWT session token
 * This function is used by middleware and must not import Prisma
 */
export function verifySessionToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('[verifySessionToken] Failed to verify token:', error instanceof Error ? error.message : error);
    return null;
  }
}
