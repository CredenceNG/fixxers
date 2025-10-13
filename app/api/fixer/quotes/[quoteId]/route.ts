import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'FIXER') {
      return NextResponse.json({ error: 'Only fixers can access quotes' }, { status: 403 });
    }

    const { quoteId } = await params;

    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        request: {
          include: {
            client: true,
            subcategory: {
              include: {
                category: true,
              },
            },
          },
        },
        fixer: true,
      },
    });

    if (!quote) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Verify this is the fixer's quote
    if (quote.fixerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error('Quote fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    );
  }
}
