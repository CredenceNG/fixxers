import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyMagicLink, generateSessionToken } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    // Verify magic link
    const userId = await verifyMagicLink(token);

    if (!userId) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 400 }
      );
    }

    // Get user with fixer and client profiles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        fixerProfile: true,
        clientProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Update user status to ACTIVE if it was PENDING
    if (user.status === 'PENDING' && user.role === 'CLIENT') {
      await prisma.user.update({
        where: { id: userId },
        data: { status: 'ACTIVE' },
      });
    }

    // Check if user has profile based on role
    let hasProfile = true;
    if (user.role === 'FIXER') {
      hasProfile = !!user.fixerProfile;
    } else if (user.role === 'CLIENT') {
      hasProfile = !!user.clientProfile;
    }

    // Generate session token
    const sessionToken = generateSessionToken({
      userId: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      role: user.role,
      hasProfile,
    });

    // Redirect based on role
    let redirectUrl = '/';
    if (user.role === 'ADMIN') {
      redirectUrl = '/admin/dashboard';
    } else if (user.role === 'FIXER') {
      // Check if profile is completed first
      if (!hasProfile) {
        redirectUrl = '/fixer/profile';
      } else {
        redirectUrl = user.status === 'PENDING' ? '/fixer/pending' : '/fixer/dashboard';
      }
    } else if (user.role === 'CLIENT') {
      // Check if profile is completed first
      if (!hasProfile) {
        redirectUrl = '/client/profile';
      } else {
        redirectUrl = '/client/dashboard';
      }
    }

    console.log(`[Auth Verify] User: ${user.email || user.phone}, Role: ${user.role}, Status: ${user.status}, Redirecting to: ${redirectUrl}`);

    // Return HTML with meta refresh and cookie setting
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta http-equiv="refresh" content="0;url=${redirectUrl}" />
          <title>Redirecting...</title>
        </head>
        <body>
          <p>Redirecting to your dashboard...</p>
          <script>window.location.href = '${redirectUrl}';</script>
        </body>
      </html>
    `;

    const response = new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
    });

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    };

    response.cookies.set('auth_token', sessionToken, cookieOptions);

    console.log(`[Auth Verify] Cookie settings:`, {
      cookieOptions,
      sessionTokenLength: sessionToken.length,
      redirectUrl,
      nodeEnv: process.env.NODE_ENV
    });

    return response;
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
