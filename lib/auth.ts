import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { prisma } from './prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const TOKEN_EXPIRY = '15m'; // 15 minutes for magic link
const SESSION_EXPIRY = '7d'; // 7 days for session

export interface JWTPayload {
  userId: string;
  email?: string;
  phone?: string;
  role: string;
  hasProfile?: boolean;
}

// Generate magic link token
export async function generateMagicLink(userId: string): Promise<string> {
  const token = jwt.sign({ userId, type: 'magic' }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });

  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 15); // 15 minutes

  await prisma.magicLink.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  });

  return token;
}

// Verify magic link token
export async function verifyMagicLink(token: string): Promise<string | null> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; type: string };

    if (decoded.type !== 'magic') {
      return null;
    }

    const magicLink = await prisma.magicLink.findUnique({
      where: { token },
    });

    if (!magicLink || magicLink.used || magicLink.expiresAt < new Date()) {
      return null;
    }

    // Mark magic link as used
    await prisma.magicLink.update({
      where: { token },
      data: { used: true },
    });

    return decoded.userId;
  } catch (error) {
    return null;
  }
}

// Generate session token
export function generateSessionToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_EXPIRY });
}

// Verify session token
export function verifySessionToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    console.error('[verifySessionToken] Failed to verify token:', error instanceof Error ? error.message : error);
    return null;
  }
}

// Set auth cookie
export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set('auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

// Get auth cookie
export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get('auth_token')?.value;
}

// Remove auth cookie
export async function removeAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('auth_token');
}

// Get current user from cookie
export async function getCurrentUser() {
  const token = await getAuthCookie();
  if (!token) return null;

  const payload = verifySessionToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      role: true,
      status: true,
      profileImage: true,
      bio: true,
      createdAt: true,
    },
  });

  return user;
}

// Check if user has required role
export function hasRole(user: { role: string } | null, allowedRoles: string[]): boolean {
  if (!user) return false;
  return allowedRoles.includes(user.role);
}
