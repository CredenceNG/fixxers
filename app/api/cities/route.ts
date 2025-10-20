import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const state = searchParams.get('state');

    const where: any = {};

    if (state) {
      where.stateId = state;
    }

    const cities = await prisma.city.findMany({
      where,
      orderBy: [
        { name: 'asc' },
      ],
      include: {
        state: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ cities });
  } catch (error) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}
