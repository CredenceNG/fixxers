import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const cityId = searchParams.get('cityId');
    const search = searchParams.get('search');

    const where: any = {};

    if (cityId) {
      where.cityId = cityId;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Only fetch neighborhoods that have been properly linked to cities
    const where_with_city: any = {
      ...where,
      cityId: where.cityId || { not: null },
    };

    const neighborhoods = await prisma.neighborhood.findMany({
      where: where_with_city,
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
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ neighborhoods });
  } catch (error) {
    console.error('Neighborhoods fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch neighborhoods' },
      { status: 500 }
    );
  }
}
