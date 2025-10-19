import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stateId = searchParams.get('stateId');

    if (!stateId) {
      return NextResponse.json(
        { error: 'stateId is required' },
        { status: 400 }
      );
    }

    const cities = await prisma.city.findMany({
      where: {
        stateId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ cities });
  } catch (error) {
    console.error('Cities fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cities' },
      { status: 500 }
    );
  }
}
