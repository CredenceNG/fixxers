import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, generateSessionToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.roles?.includes('CLIENT')) {
      return NextResponse.json({ error: 'Only clients can access this profile' }, { status: 403 });
    }

    // Get client profile
    const profile = await prisma.clientProfile.findUnique({
      where: { clientId: user.id },
    });

    // If profile doesn't exist, return user.name so it can be pre-populated
    if (!profile) {
      return NextResponse.json({
        name: user.name || '',
      });
    }

    return NextResponse.json({
      ...profile,
      name: user.name,
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.roles?.includes('CLIENT')) {
      return NextResponse.json({ error: 'Only clients can complete this profile' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      neighbourhoodId,
      primaryPhone,
      secondaryPhone,
      alternateEmail,
    } = body;

    // Validation
    if (!name || !neighbourhoodId || !primaryPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get neighborhood data
    const neighborhood = await prisma.neighborhood.findUnique({
      where: { id: neighbourhoodId },
      include: {
        city: {
          include: {
            state: {
              include: {
                country: true,
              },
            },
          },
        },
      },
    });

    if (!neighborhood || !neighborhood.city || !neighborhood.city.state || !neighborhood.city.state.country) {
      return NextResponse.json({ error: 'Invalid neighborhood selected' }, { status: 400 });
    }

    // Update user name
    await prisma.user.update({
      where: { id: user.id },
      data: { name },
    });

    // Create or update client profile
    await prisma.clientProfile.upsert({
      where: { clientId: user.id },
      create: {
        clientId: user.id,
        neighbourhood: neighborhood.name,
        city: neighborhood.city.name,
        state: neighborhood.city.state.name,
        country: neighborhood.city.state.country.name || 'Nigeria',
        primaryPhone,
        secondaryPhone: secondaryPhone || null,
        alternateEmail: alternateEmail || null,
      },
      update: {
        neighbourhood: neighborhood.name,
        city: neighborhood.city.name,
        state: neighborhood.city.state.name,
        country: neighborhood.city.state.country.name || 'Nigeria',
        primaryPhone,
        secondaryPhone: secondaryPhone || null,
        alternateEmail: alternateEmail || null,
      },
    });

    // Generate new session token with hasProfile: true
    const roles = user.roles || [];
    const newSessionToken = generateSessionToken({
      userId: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      role: roles[0] || 'CLIENT',
      roles,
      hasProfile: true,
      hasClientProfile: true,
    });

    // Update the cookie with the new token
    const response = NextResponse.json({
      success: true,
      // If user has FIXER role, redirect to fixer profile for completion
      redirectTo: user.roles?.includes('FIXER') ? '/fixer/profile' : undefined
    });
    response.cookies.set('auth_token', newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Profile save error:', error);
    return NextResponse.json(
      { error: 'Failed to save profile. Please try again.' },
      { status: 500 }
    );
  }
}
