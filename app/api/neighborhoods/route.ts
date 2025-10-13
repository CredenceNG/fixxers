import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const neighborhoods = await prisma.neighborhood.findMany({
      orderBy: [
        { state: 'asc' },
        { city: 'asc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json(neighborhoods);
  } catch (error) {
    console.error('Neighborhoods fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch neighborhoods' },
      { status: 500 }
    );
  }
}
