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
      return NextResponse.json({ error: 'Only fixers can view services' }, { status: 403 });
    }

    // Fetch fixer's services
    const services = await prisma.fixerService.findMany({
      where: { fixerId: user.id },
      include: {
        subcategory: {
          include: {
            category: true,
          },
        },
        neighborhoods: {
          orderBy: [
            { name: 'asc' },
          ],
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(services);
  } catch (error) {
    console.error('Fixer services fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
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
      return NextResponse.json({ error: 'Only fixers can add services' }, { status: 403 });
    }

    const body = await request.json();
    const {
      services,
      neighborhoodIds,
    } = body;

    // Validation
    if (!services || services.length === 0) {
      return NextResponse.json({ error: 'Please select at least one service' }, { status: 400 });
    }

    // Service areas are optional - will use fixer's profile neighborhood if not provided
    // if (!neighborhoodIds || neighborhoodIds.length === 0) {
    //   return NextResponse.json({ error: 'Please select at least one service area' }, { status: 400 });
    // }

    // Validate each service has required per-service data
    for (const service of services) {
      if (!service.categoryId || !service.subcategoryId) {
        return NextResponse.json({ error: 'Each service must have category and subcategory' }, { status: 400 });
      }
      if (!service.yearsExperience || service.yearsExperience <= 0) {
        return NextResponse.json({ error: 'Each service must have years of experience' }, { status: 400 });
      }
      if (!service.description || service.description.trim() === '') {
        return NextResponse.json({ error: 'Each service must have a description' }, { status: 400 });
      }
      if (!service.qualifications || service.qualifications.length === 0) {
        return NextResponse.json({ error: 'Each service must have at least one qualification' }, { status: 400 });
      }
    }

    // Get the fixer profile
    const fixerProfile = await prisma.fixerProfile.findUnique({
      where: { fixerId: user.id },
    });

    if (!fixerProfile) {
      return NextResponse.json(
        { error: 'Fixer profile not found. Please complete Step 1 first.' },
        { status: 400 }
      );
    }

    const isNewApplication = !fixerProfile.approvedAt;

    // If no neighborhoods selected, try to use the fixer's profile neighborhood
    let finalNeighborhoodIds = neighborhoodIds || [];
    if (finalNeighborhoodIds.length === 0 && fixerProfile.neighbourhood) {
      // Try to find a neighborhood that matches the profile location
      const matchingNeighborhood = await prisma.neighborhood.findFirst({
        where: {
          name: {
            contains: fixerProfile.neighbourhood,
            mode: 'insensitive',
          },
        },
      });

      if (matchingNeighborhood) {
        finalNeighborhoodIds = [matchingNeighborhood.id];
      }
    }

    // Mark profile for admin review (only for re-reviews, not new applications)
    if (!isNewApplication) {
      await prisma.fixerProfile.update({
        where: { fixerId: user.id },
        data: {
          pendingChanges: true, // Mark for admin re-review
        },
      });

      // Reset status to PENDING for re-review
      await prisma.user.update({
        where: { id: user.id },
        data: { status: 'PENDING' },
      });
    }

    // Delete existing fixer services
    await prisma.fixerService.deleteMany({
      where: { fixerId: user.id },
    });

    // Create FixerService entries for each selected service
    const serviceCategories = new Set<string>();

    for (const service of services) {
      const fixerService = await prisma.fixerService.create({
        data: {
          fixerId: user.id,
          subcategoryId: service.subcategoryId,
          description: service.description,
          yearsExperience: service.yearsExperience,
          qualifications: service.qualifications,
          referencePhone: service.referencePhone || null,
          isActive: true,
        },
      });

      // Connect neighborhoods to this service (if any are available)
      if (finalNeighborhoodIds.length > 0) {
        await prisma.fixerService.update({
          where: { id: fixerService.id },
          data: {
            neighborhoods: {
              connect: finalNeighborhoodIds.map((id: string) => ({ id })),
            },
          },
        });
      }

      // Collect category names for notification
      serviceCategories.add(service.categoryName);
    }

    // Notify admins
    try {
      if (isNewApplication) {
        // New application
        await notifyAdminNewFixerApplication(
          user.id,
          user.name || user.email || user.phone || 'Unknown',
          Array.from(serviceCategories)
        );
      } else {
        // Profile update
        await notifyAdminFixerProfileUpdate(
          user.id,
          user.name || user.email || user.phone || 'Unknown'
        );
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
    const response = NextResponse.json({
      success: true,
      message: 'Services saved successfully'
    });

    response.cookies.set('auth_token', newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    console.log(`[Fixer Services] Setup complete for ${user.email || user.phone}: ${services.length} services added`);

    return response;
  } catch (error) {
    console.error('Fixer service creation error:', error);
    return NextResponse.json(
      { error: 'Failed to save services. Please try again.' },
      { status: 500 }
    );
  }
}
