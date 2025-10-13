import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const packageSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  price: z.number().positive(),
  deliveryDays: z.number().int().positive(),
  revisions: z.number().int().min(0),
  features: z.array(z.string()),
});

const updateGigSchema = z.object({
  title: z.string().min(1).max(80).optional(),
  subcategoryId: z.string().optional(),
  description: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  requirements: z.array(z.string()).optional(),
  packages: z.array(packageSchema).optional(),
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'PAUSED']).optional(),
});

// PUT - Update full gig details
export async function PUT(
  request: NextRequest,
  { params }: { params: { gigId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'FIXER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gigId } = params;
    const body = await request.json();
    const validated = updateGigSchema.parse(body);

    // Verify gig belongs to user
    const existingGig = await prisma.gig.findUnique({
      where: { id: gigId },
      include: { packages: true },
    });

    if (!existingGig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    }

    if (existingGig.sellerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Generate slug from title if title is being updated
    let slug = existingGig.slug;
    if (validated.title && validated.title !== existingGig.title) {
      slug = validated.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-' + Date.now();
    }

    // If gig is ACTIVE and being edited, move to PENDING_REVIEW unless explicitly saving as DRAFT
    let newStatus = existingGig.status;
    if (existingGig.status === 'ACTIVE' && validated.status !== 'DRAFT') {
      newStatus = 'PENDING_REVIEW';
    } else if (validated.status) {
      newStatus = validated.status;
    }

    // Update gig with transaction to handle packages
    const updatedGig = await prisma.$transaction(async (tx) => {
      // Update packages if provided
      if (validated.packages) {
        // Delete existing packages and create new ones
        await tx.gigPackage.deleteMany({
          where: { gigId },
        });

        // Create new packages
        await tx.gigPackage.createMany({
          data: validated.packages.map((pkg) => ({
            gigId,
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            deliveryDays: pkg.deliveryDays,
            revisions: pkg.revisions,
            features: pkg.features,
          })),
        });
      }

      // Update gig
      return tx.gig.update({
        where: { id: gigId },
        data: {
          ...(validated.title && { title: validated.title, slug }),
          ...(validated.subcategoryId && { subcategoryId: validated.subcategoryId }),
          ...(validated.description && { description: validated.description }),
          ...(validated.tags && { tags: validated.tags }),
          ...(validated.requirements && { requirements: validated.requirements }),
          status: newStatus,
        },
        include: {
          packages: true,
          subcategory: {
            include: { category: true },
          },
        },
      });
    });

    return NextResponse.json({
      success: true,
      gig: updatedGig,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }
    console.error('Error updating gig:', error);
    return NextResponse.json(
      { error: 'Failed to update gig' },
      { status: 500 }
    );
  }
}

// PATCH - Update gig status (pause/activate)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { gigId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'FIXER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gigId } = params;
    const body = await request.json();
    const { status } = body;

    // Verify gig belongs to user
    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      select: { sellerId: true, status: true },
    });

    if (!gig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    }

    if (gig.sellerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Only allow pausing ACTIVE gigs or activating PAUSED gigs
    if (status === 'PAUSED' && gig.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Only active gigs can be paused' },
        { status: 400 }
      );
    }

    if (status === 'ACTIVE' && gig.status !== 'PAUSED') {
      return NextResponse.json(
        { error: 'Only paused gigs can be activated' },
        { status: 400 }
      );
    }

    // Update gig status
    const updatedGig = await prisma.gig.update({
      where: { id: gigId },
      data: { status },
    });

    return NextResponse.json({
      success: true,
      gig: updatedGig,
    });
  } catch (error) {
    console.error('Error updating gig:', error);
    return NextResponse.json(
      { error: 'Failed to update gig' },
      { status: 500 }
    );
  }
}

// DELETE - Delete gig
export async function DELETE(
  request: NextRequest,
  { params }: { params: { gigId: string } }
) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'FIXER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gigId } = params;

    // Verify gig belongs to user
    const gig = await prisma.gig.findUnique({
      where: { id: gigId },
      select: { sellerId: true, _count: { select: { orders: true } } },
    });

    if (!gig) {
      return NextResponse.json({ error: 'Gig not found' }, { status: 404 });
    }

    if (gig.sellerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Don't allow deletion if there are active orders
    if (gig._count.orders > 0) {
      return NextResponse.json(
        { error: 'Cannot delete gig with existing orders. Pause it instead.' },
        { status: 400 }
      );
    }

    // Soft delete by setting status to DELETED
    await prisma.gig.update({
      where: { id: gigId },
      data: { status: 'DELETED' },
    });

    return NextResponse.json({
      success: true,
      message: 'Gig deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting gig:', error);
    return NextResponse.json(
      { error: 'Failed to delete gig' },
      { status: 500 }
    );
  }
}
