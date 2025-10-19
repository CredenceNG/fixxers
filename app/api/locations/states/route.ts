import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const countryId = searchParams.get('countryId');

    if (!countryId) {
      return NextResponse.json(
        { error: 'countryId is required' },
        { status: 400 }
      );
    }

    const states = await prisma.state.findMany({
      where: {
        countryId,
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({ states });
  } catch (error) {
    console.error('States fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch states' },
      { status: 500 }
    );
  }
}
