import { NextResponse } from 'next/server';
import { getCurrentUser, generateSessionToken, setAuthCookie } from '@/lib/auth';

async function refreshToken() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Generate new token with updated structure
    const roles = user.roles || [];
    const token = generateSessionToken({
      userId: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      role: roles[0] || 'CLIENT',
      roles: roles,
      hasProfile: !!user.bio,
      hasFixerProfile: false,
      hasClientProfile: false,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      message: 'Token refreshed successfully',
      user: {
        id: user.id,
        email: user.email,
        roles: user.roles || []
      }
    });
  } catch (error) {
    console.error('[Refresh Token] Error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return refreshToken();
}

export async function POST() {
  return refreshToken();
}
