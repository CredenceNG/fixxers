import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { generateSessionToken } from '@/lib/auth';

/**
 * GET /api/profile
 * Returns merged profile data from both ClientProfile and FixerProfile
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const roles = user.roles || [];

    // Fetch profiles based on user roles with neighborhood data
    const clientProfile = roles.includes('CLIENT')
      ? await prisma.clientProfile.findUnique({
          where: { clientId: user.id },
          include: {
            neighborhood: {
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
            },
          },
        })
      : null;

    const fixerProfile = roles.includes('FIXER')
      ? await prisma.fixerProfile.findUnique({
          where: { fixerId: user.id },
          include: {
            neighborhood: {
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
            },
          },
        })
      : null;

    // If no profiles exist, return user name for pre-population
    if (!clientProfile && !fixerProfile) {
      return NextResponse.json({
        name: user.name || '',
        primaryPhone: '',
        secondaryPhone: '',
        alternateEmail: '',
        streetAddress: '',
        neighbourhood: '',
        city: '',
        state: '',
        country: '',
        yearsOfService: 0,
        qualifications: [],
      });
    }

    // Merge profile data (prefer fixer profile for shared fields if both exist)
    const profile = fixerProfile || clientProfile;
    const mergedData = {
      name: user.name || '',
      primaryPhone: profile?.primaryPhone || '',
      secondaryPhone: profile?.secondaryPhone || '',
      alternateEmail: clientProfile?.alternateEmail || '',
      streetAddress: profile?.streetAddress || '',
      neighborhoodId: profile?.neighborhoodId || '',
      neighbourhood: profile?.neighbourhood || '',
      city: profile?.city || '',
      state: profile?.state || '',
      country: profile?.country || '',
      yearsOfService: fixerProfile?.yearsOfService || 0,
      qualifications: fixerProfile?.qualifications || [],
    };

    return NextResponse.json(mergedData);
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

/**
 * POST /api/profile
 * Saves profile data to ClientProfile and/or FixerProfile based on user roles
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      primaryPhone,
      secondaryPhone,
      alternateEmail,
      streetAddress,
      neighbourhoodId,
      yearsOfService,
      qualifications,
      roles,
    } = body;

    // Validation
    if (!name || !primaryPhone || !neighbourhoodId) {
      return NextResponse.json(
        { error: 'Name, primary phone, and neighbourhood are required' },
        { status: 400 }
      );
    }

    // Get neighborhood data with full hierarchy
    const neighbourhood = await prisma.neighborhood.findUnique({
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

    if (!neighbourhood || !neighbourhood.city) {
      return NextResponse.json({ error: 'Invalid neighbourhood' }, { status: 400 });
    }

    // Update user name if it changed
    if (name !== user.name) {
      await prisma.user.update({
        where: { id: user.id },
        data: { name },
      });
    }

    const sharedFields = {
      primaryPhone,
      secondaryPhone: secondaryPhone || null,
      streetAddress: streetAddress || null,
      neighborhoodId: neighbourhoodId,
      // Legacy fields for backward compatibility
      neighbourhood: neighbourhood.name,
      city: neighbourhood.city.name,
      state: neighbourhood.city.state.name,
      country: neighbourhood.city.state.country.name,
    };

    let hasClientProfile = false;
    let hasFixerProfile = false;

    // Save ClientProfile if user has CLIENT role
    if (roles.includes('CLIENT')) {
      await prisma.clientProfile.upsert({
        where: { clientId: user.id },
        update: {
          ...sharedFields,
          alternateEmail: alternateEmail || null,
        },
        create: {
          clientId: user.id,
          ...sharedFields,
          alternateEmail: alternateEmail || null,
        },
      });
      hasClientProfile = true;
    }

    // Save FixerProfile if user has FIXER role
    if (roles.includes('FIXER')) {
      // Check if profile already exists
      const existingProfile = await prisma.fixerProfile.findUnique({
        where: { fixerId: user.id },
      });

      if (existingProfile) {
        // Update existing profile (only basic info, keep yearsOfService and qualifications)
        await prisma.fixerProfile.update({
          where: { fixerId: user.id },
          data: {
            ...sharedFields,
            pendingChanges: true, // Mark for admin review
          },
        });
      } else {
        // Create new profile with minimal fields (will be completed in Step 2)
        await prisma.fixerProfile.create({
          data: {
            fixerId: user.id,
            ...sharedFields,
            yearsOfService: 0, // Default, will be set in Step 2
            qualifications: [], // Default, will be set in Step 2
            pendingChanges: false, // Not ready for review until Step 2 is complete
          },
        });
      }
      hasFixerProfile = true;
    }

    // Generate new session token with updated profile flags
    const newSessionToken = generateSessionToken({
      userId: user.id,
      email: user.email || undefined,
      phone: user.phone || undefined,
      role: roles[0] || 'CLIENT',
      roles,
      hasProfile: hasFixerProfile || hasClientProfile,
      hasFixerProfile,
      hasClientProfile,
    });

    // Return success with new token
    const response = NextResponse.json({
      success: true,
      message: 'Profile saved successfully',
    });

    response.cookies.set('auth_token', newSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    console.log(`[Unified Profile] Profile saved for user ${user.id} with roles: ${roles.join(', ')}`);

    return response;
  } catch (error) {
    console.error('Profile save error:', error);
    return NextResponse.json(
      { error: 'Failed to save profile. Please try again.' },
      { status: 500 }
    );
  }
}
