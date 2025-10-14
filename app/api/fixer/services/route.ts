import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

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
            { state: 'asc' },
            { city: 'asc' },
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
      subcategoryId,
      neighborhoodIds,
      description,
      basePrice,
      priceUnit,
    } = body;

    // Validation
    if (!subcategoryId || !neighborhoodIds || neighborhoodIds.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if service already exists
    const existingService = await prisma.fixerService.findUnique({
      where: {
        fixerId_subcategoryId: {
          fixerId: user.id,
          subcategoryId,
        },
      },
    });

    if (existingService) {
      return NextResponse.json(
        { error: 'You already offer this service. Please edit the existing one.' },
        { status: 400 }
      );
    }

    // Create fixer service
    const service = await prisma.fixerService.create({
      data: {
        fixerId: user.id,
        subcategoryId,
        description: description || null,
        basePrice: basePrice ? parseFloat(basePrice) : null,
        priceUnit: priceUnit || null,
        neighborhoods: {
          connect: neighborhoodIds.map((id: string) => ({ id })),
        },
      },
      include: {
        subcategory: {
          include: {
            category: true,
          },
        },
        neighborhoods: true,
      },
    });

    console.log(`[Fixer Service] Added by ${user.email || user.phone}: ${service.subcategory.name}`);

    return NextResponse.json(service);
  } catch (error) {
    console.error('Fixer service creation error:', error);
    return NextResponse.json(
      { error: 'Failed to add service. Please try again.' },
      { status: 500 }
    );
  }
}
