import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'FIXER') {
      return NextResponse.json({ error: 'Only fixers can update services' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isActive } = body;

    // Verify service belongs to fixer
    const service = await prisma.fixerService.findUnique({
      where: { id },
    });

    if (!service || service.fixerId !== user.id) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Update service
    const updatedService = await prisma.fixerService.update({
      where: { id },
      data: { isActive },
      include: {
        subcategory: {
          include: {
            category: true,
          },
        },
        neighborhoods: true,
      },
    });

    return NextResponse.json(updatedService);
  } catch (error) {
    console.error('Service update error:', error);
    return NextResponse.json(
      { error: 'Failed to update service' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'FIXER') {
      return NextResponse.json({ error: 'Only fixers can delete services' }, { status: 403 });
    }

    const { id } = await params;

    // Verify service belongs to fixer
    const service = await prisma.fixerService.findUnique({
      where: { id },
    });

    if (!service || service.fixerId !== user.id) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    // Delete service
    await prisma.fixerService.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Service deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete service' },
      { status: 500 }
    );
  }
}
