import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const updateNeighborhoodSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  legacyCity: z.string().min(1, 'City is required'),
  legacyState: z.string().min(1, 'State is required'),
  legacyCountry: z.string().min(1, 'Country is required'),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user has ADMIN role
    const roles = currentUser.roles || [];
    if (!roles.includes('ADMIN')) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();

    // Validate request body
    const validationResult = updateNeighborhoodSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { name, legacyCity, legacyState, legacyCountry } = validationResult.data;

    // Check if neighborhood exists
    const existingNeighborhood = await prisma.neighborhood.findUnique({
      where: { id },
    });

    if (!existingNeighborhood) {
      return NextResponse.json({ error: 'Neighborhood not found' }, { status: 404 });
    }

    // Update the neighborhood
    const updatedNeighborhood = await prisma.neighborhood.update({
      where: { id },
      data: {
        name,
        legacyCity,
        legacyState,
        legacyCountry,
      },
    });

    return NextResponse.json({
      success: true,
      neighborhood: updatedNeighborhood,
    });
  } catch (error: any) {
    console.error('Error updating neighborhood:', error);
    return NextResponse.json(
      { error: 'Failed to update neighborhood' },
      { status: 500 }
    );
  }
}
