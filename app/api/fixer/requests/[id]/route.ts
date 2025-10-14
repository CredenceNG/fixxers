import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.roles?.includes('FIXER')) {
      return NextResponse.json({ error: 'Only fixers can view requests' }, { status: 403 });
    }

    const { id } = await params;

    // Fetch service request
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        subcategory: {
          include: {
            category: true,
          },
        },
        neighborhood: true,
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!serviceRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // Check if fixer has already quoted
    const existingQuote = await prisma.quote.findUnique({
      where: {
        requestId_fixerId: {
          requestId: id,
          fixerId: user.id,
        },
      },
    });

    if (existingQuote) {
      return NextResponse.json(
        { error: 'You have already submitted a quote for this request' },
        { status: 400 }
      );
    }

    return NextResponse.json(serviceRequest);
  } catch (error) {
    console.error('Request fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch request' },
      { status: 500 }
    );
  }
}
