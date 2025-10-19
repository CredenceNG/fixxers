import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const subcategories = await prisma.serviceSubcategory.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { category: { name: 'asc' } },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ subcategories });
  } catch (error) {
    console.error('Failed to fetch subcategories:', error);
    return NextResponse.json(
      { error: 'Failed to load subcategories' },
      { status: 500 }
    );
  }
}
