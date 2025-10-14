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
      return NextResponse.json({ error: 'Only clients can confirm inspection payments' }, { status: 403 });
    }

    const { paymentIntentId } = await request.json();
    const { quoteId } = await params;

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 });
    }

    // Verify payment intent with Stripe
    const stripe = requireStripe();
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json({ error: 'Payment has not succeeded yet' }, { status: 400 });
    }

    // Verify payment intent metadata matches the quote
    if (paymentIntent.metadata.quoteId !== quoteId) {
      return NextResponse.json({ error: 'Payment intent does not match quote' }, { status: 400 });
    }

    // Get the quote
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        request: true,
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

    // Check if already marked as paid
    if (quote.inspectionFeePaid) {
      return NextResponse.json({
        success: true,
        message: 'Inspection fee already marked as paid',
        inspectionFee: quote.inspectionFee,
      });
    }

    // Update quote to mark inspection as paid
    await prisma.quote.update({
      where: { id: quoteId },
      data: {
        inspectionFeePaid: true,
      },
    });

    // Create notification for fixer
    await prisma.notification.create({
      data: {
        userId: quote.fixerId,
        type: 'INSPECTION_ACCEPTED',
        title: 'Inspection Accepted',
        message: `Client has paid the inspection fee of ₦${quote.inspectionFee?.toLocaleString()} for "${quote.request.title}". Please schedule the inspection.`,
        link: `/fixer/requests/${quote.requestId}`,
      },
    });

    console.log(`[Inspection Payment Confirmed] Client ${user.email || user.phone} paid ₦${quote.inspectionFee} for quote ${quoteId}`);

    return NextResponse.json({
      success: true,
      message: 'Inspection fee paid successfully',
      inspectionFee: quote.inspectionFee,
    });
  } catch (error) {
    console.error('Inspection payment confirmation error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm inspection payment' },
      { status: 500 }
    );
  }
}
