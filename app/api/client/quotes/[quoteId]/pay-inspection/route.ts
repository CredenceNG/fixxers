import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { requireStripe } from '@/lib/stripe';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.roles?.includes('CLIENT')) {
      return NextResponse.json({ error: 'Only clients can pay for inspections' }, { status: 403 });
    }

    const { quoteId } = await params;

    // Get the quote
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        request: {
          include: {
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

    // Verify quote belongs to user's request
    if (quote.request.clientId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify it's an inspection quote
    if (quote.type !== 'INSPECTION_REQUIRED') {
      return NextResponse.json({ error: 'This is not an inspection quote' }, { status: 400 });
    }

    // Verify inspection hasn't been paid yet
    if (quote.inspectionFeePaid) {
      return NextResponse.json({ error: 'Inspection fee already paid' }, { status: 400 });
    }

    if (!quote.inspectionFee) {
      return NextResponse.json({ error: 'No inspection fee set' }, { status: 400 });
    }

    // Create Stripe PaymentIntent for inspection fee
    const stripe = requireStripe();
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(quote.inspectionFee * 100), // Convert to kobo (cents for NGN)
      currency: 'ngn',
      metadata: {
        quoteId: quote.id,
        requestId: quote.requestId,
        clientId: user.id,
        fixerId: quote.fixerId,
        paymentType: 'INSPECTION_FEE',
        requestTitle: quote.request.title,
        category: quote.request.subcategory.category.name,
      },
      description: `Inspection fee for: ${quote.request.title}`,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log(`[Inspection Payment Intent] Created for client ${user.email || user.phone} - ₦${quote.inspectionFee} for quote ${quoteId}`);

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      inspectionFee: quote.inspectionFee,
    });
  } catch (error) {
    console.error('Inspection payment error:', error);
    return NextResponse.json(
      { error: 'Failed to create payment intent for inspection' },
      { status: 500 }
    );
  }
}
