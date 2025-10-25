import jwt from "jsonwebtoken";
import { prisma } from "./prisma";
import type { JWTPayload } from "./auth-jwt";
import { verifySessionToken as verifyToken } from "./auth-jwt";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const TOKEN_EXPIRY = "15m"; // 15 minutes for magic link
const SESSION_EXPIRY = "7d"; // 7 days for session

// Re-export types and functions from auth-jwt for convenience
// This allows existing code to continue importing from '@/lib/auth'
export type { JWTPayload } from "./auth-jwt";
export { verifySessionToken } from "./auth-jwt";

// Generate magic link token
export async function generateMagicLink(userId: string): Promise<string> {
  const token = jwt.sign({ userId, type: "magic" }, JWT_SECRET, {
    expiresIn: TOKEN_EXPIRY,
  });

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
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      type: string;
    };

    if (decoded.type !== "magic") {
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

// Note: verifySessionToken is re-exported from auth-jwt.ts at the top of this file
// This avoids including Prisma in the middleware bundle

// Set auth cookie
export async function setAuthCookie(token: string) {
  // dynamically import next/headers to avoid pulling server-only APIs into client bundles
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

// Get auth cookie
export async function getAuthCookie(): Promise<string | undefined> {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return cookieStore.get("auth_token")?.value;
}

// Remove auth cookie
export async function removeAuthCookie() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.delete("auth_token");
}

// Get current user from cookie
export async function getCurrentUser() {
  // getAuthCookie dynamically imports next/headers internally
  const token = await getAuthCookie();
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      roles: true,
      status: true,
      profileImage: true,
      bio: true,
      pendingEmail: true,
      pendingPhone: true,
      emailChangeRequested: true,
      phoneChangeRequested: true,
      createdAt: true,
      fixerProfile: true,
      clientProfile: true,
    },
  });

  return user;
}

// Check if user has required role (uses roles array)
export function hasRole(
  user: { roles?: string[] } | null,
  allowedRoles: string[]
): boolean {
  if (!user) return false;

  // Check roles array
  if (user.roles && user.roles.length > 0) {
    return user.roles.some((role) => allowedRoles.includes(role));
  }

  return false;
}

// Check if user has a specific role
export function hasAnyRole(
  user: { roles?: string[] } | null,
  role: string
): boolean {
  if (!user || !user.roles) return false;
  return user.roles.includes(role);
}

// Get current user with agent profile
export async function getCurrentUserWithAgent() {
  const token = await getAuthCookie();
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: {
      id: true,
      email: true,
      phone: true,
      name: true,
      roles: true,
      status: true,
      profileImage: true,
      bio: true,
      createdAt: true,
      agentProfile: {
        select: {
          id: true,
          businessName: true,
          status: true,
          commissionPercentage: true,
        },
      },
    },
  });

  return user;
}

// Check if current user is an active agent
export async function isCurrentUserAgent(): Promise<boolean> {
  const user = await getCurrentUserWithAgent();
  return user?.agentProfile?.status === "ACTIVE" || false;
}

// Check if current user is an admin
export async function isCurrentUserAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.roles?.includes("ADMIN") || false;
}
