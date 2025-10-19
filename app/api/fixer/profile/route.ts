import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, generateSessionToken } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyAdminNewFixerApplication, notifyAdminFixerProfileUpdate } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.roles?.includes('FIXER')) {
      return NextResponse.json({ error: 'Only fixers can access this profile' }, { status: 403 });
    }

    // Get fixer profile
    const profile = await prisma.fixerProfile.findUnique({
      where: { fixerId: user.id },
    });

    // If profile doesn't exist, return user.name so it can be pre-populated
    if (!profile) {
      return NextResponse.json({
        profile: {
          name: user.name || '',
        },
      });
    }

    // Get fixer services with neighborhoods
    const services = await prisma.fixerService.findMany({
      where: { fixerId: user.id },
      include: {
        subcategory: {
          include: {
            category: true,
          },
        },
        neighborhoods: true,
      },
    });

    return NextResponse.json({
      profile: {
        ...profile,
        name: user.name,
        services,
      },
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

    if (!user.roles?.includes('FIXER')) {
      return NextResponse.json({ error: 'Only fixers can complete this profile' }, { status: 403 });
    }

    const body = await request.json();
    const {
      name,
      yearsOfService,
      qualifications,
      primaryPhone,
      secondaryPhone,
      selectedCategories,
      neighborhoodIds,
    } = body;

    // Validation
    if (!name || !yearsOfService || !primaryPhone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!selectedCategories || selectedCategories.length === 0) {
      return NextResponse.json({ error: 'Please select at least one category' }, { status: 400 });
    }

    if (!neighborhoodIds || neighborhoodIds.length === 0) {
      return NextResponse.json({ error: 'Please select at least one service neighborhood' }, { status: 400 });
    }

    // Update user name
    await prisma.user.update({
      where: { id: user.id },
      data: { name },
    });

    // Get first neighborhood for profile location fields (with full hierarchy)
    const firstNeighborhood = await prisma.neighborhood.findUnique({
      where: { id: neighborhoodIds[0] },
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

    if (!firstNeighborhood || !firstNeighborhood.city) {
      return NextResponse.json({ error: 'Invalid neighborhood selected' }, { status: 400 });
    }

    // Check if fixer was previously approved
    const existingProfile = await prisma.fixerProfile.findUnique({
      where: { fixerId: user.id },
    });

    const wasApproved = !!existingProfile?.approvedAt;

    // Create or update fixer profile
    await prisma.fixerProfile.upsert({
      where: { fixerId: user.id },
      create: {
        fixerId: user.id,
        yearsOfService: parseInt(yearsOfService),
        qualifications: Array.isArray(qualifications) ? qualifications : [],
        neighborhoodId: firstNeighborhood.id,
        // Legacy fields for backward compatibility
        neighbourhood: firstNeighborhood.name,
        city: firstNeighborhood.city.name,
        state: firstNeighborhood.city.state.name,
        country: firstNeighborhood.city.state.country.name,
        primaryPhone,
        secondaryPhone: secondaryPhone || null,
        pendingChanges: true,
      },
      update: {
        yearsOfService: parseInt(yearsOfService),
        qualifications: Array.isArray(qualifications) ? qualifications : [],
        neighborhoodId: firstNeighborhood.id,
        // Legacy fields for backward compatibility
        neighbourhood: firstNeighborhood.name,
        city: firstNeighborhood.city.name,
        state: firstNeighborhood.city.state.name,
        country: firstNeighborhood.city.state.country.name,
        primaryPhone,
        secondaryPhone: secondaryPhone || null,
        pendingChanges: true,
      },
    });

    // If fixer was previously approved, reset status to PENDING for re-review
    if (wasApproved) {
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'PENDING' },
      });
    }

    // Delete existing fixer services
    await prisma.fixerService.deleteMany({
      where: { fixerId: user.id },
    });

    // Create FixerService entries for each selected subcategory with neighborhoods
    for (const category of selectedCategories) {
      for (const subcategoryId of category.subcategoryIds) {
        const fixerService = await prisma.fixerService.create({
          data: {
            fixerId: user.id,
            subcategoryId,
            isActive: true,
          },
        });

        // Connect neighborhoods to this service
        await prisma.fixerService.update({
          where: { id: fixerService.id },
          data: {
            neighborhoods: {
              connect: neighborhoodIds.map((id: string) => ({ id })),
            },
          },
        });
      }
    }

    // Get service categories for notification
    const services = await prisma.fixerService.findMany({
      where: { fixerId: user.id },
      include: {
        subcategory: {
          include: {
            category: true,
          },
        },
      },
    });

    const serviceCategories = Array.from(
      new Set(services.map((s) => s.subcategory.category.name))
    );

    // Notify admins
    try {
      if (!wasApproved) {
        // New application
        await notifyAdminNewFixerApplication(
          user.id,
          name,
          serviceCategories
        );
      } else {
        // Profile update
        await notifyAdminFixerProfileUpdate(user.id, name);
      }
    } catch (error) {
      console.error('Failed to notify admins about fixer profile:', error);
    }

    // Generate new session token with hasProfile: true
    const roles = user.roles || [];
    const newSessionToken = generateSessionToken({
      userId: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      role: roles[0] || 'FIXER',
      roles,
      hasProfile: true,
      hasFixerProfile: true,
    });

    // Update the cookie with the new token
    const response = NextResponse.json({ success: true });
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
