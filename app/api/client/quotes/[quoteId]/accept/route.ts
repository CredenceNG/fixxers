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
      return NextResponse.json({ error: 'Only clients can accept quotes' }, { status: 403 });
    }

    const { quoteId } = await params;

    // Fetch the quote with related data
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

    // Verify this is the client's quote
    if (quote.request.clientId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Check if quote is already accepted
    if (quote.isAccepted) {
      return NextResponse.json({ error: 'Quote already accepted' }, { status: 400 });
    }

    // Check if it's an inspection quote that hasn't been revised yet
    if (quote.type === 'INSPECTION_REQUIRED' && !quote.isRevised) {
      return NextResponse.json({
        error: 'Cannot accept inspection quote before final quote is submitted'
      }, { status: 400 });
    }

    // If requires down payment, create Stripe payment intent
    if (quote.requiresDownPayment && quote.downPaymentAmount) {
      const stripe = requireStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(quote.downPaymentAmount * 100), // Convert to kobo
        currency: 'ngn',
        metadata: {
          quoteId: quote.id,
          requestId: quote.requestId,
          clientId: user.id,
          fixerId: quote.fixerId,
          paymentType: 'DOWN_PAYMENT',
          requestTitle: quote.request.title,
          category: quote.request.subcategory.category.name,
          downPaymentPercentage: quote.downPaymentPercentage?.toString() || '',
        },
        description: `Down payment (${quote.downPaymentPercentage}%) for: ${quote.request.title}`,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      return NextResponse.json({
        success: true,
        requiresPayment: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        downPaymentAmount: quote.downPaymentAmount,
        totalAmount: quote.totalAmount,
      });
    }

    // No down payment required - accept quote directly and create order
    await prisma.$transaction(async (tx) => {
      // Mark quote as accepted
      await tx.quote.update({
        where: { id: quoteId },
        data: { isAccepted: true },
      });

      // Update request status
      await tx.serviceRequest.update({
        where: { id: quote.requestId },
        data: { status: 'ACCEPTED' },
      });

      // Calculate platform fee (15% of total amount)
      const platformFee = Math.round(quote.totalAmount * 0.15);
      const fixerAmount = quote.totalAmount - platformFee;

      // Create order
      const order = await tx.order.create({
        data: {
          requestId: quote.requestId,
          clientId: user.id,
          fixerId: quote.fixerId,
          quoteId: quote.id,
          totalAmount: quote.totalAmount,
          platformFee,
          fixerAmount,
          status: 'PENDING',
          downPaymentRequired: quote.requiresDownPayment,
          downPaymentAmount: quote.downPaymentAmount,
          downPaymentPaid: false, // No down payment for this path
        },
      });

      // Create notification for fixer
      await tx.notification.create({
        data: {
          userId: quote.fixerId,
          type: 'QUOTE_ACCEPTED',
          title: 'Quote Accepted!',
          message: `Client has accepted your quote of ₦${quote.totalAmount.toLocaleString()} for "${quote.request.title}". You can now start the work.`,
          link: `/fixer/orders/${order.id}/view`,
        },
      });
    });

    // Send quote accepted email to fixer
    try {
      const { sendQuoteAcceptedEmail } = await import('@/lib/emails/template-renderer');
      const client = await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true },
      });

      if (quote.fixer.email && quote.fixer.emailNotifications) {
        await sendQuoteAcceptedEmail({
          fixerEmail: quote.fixer.email,
          fixerName: quote.fixer.name || 'Service Provider',
          serviceTitle: quote.request.title,
          clientName: client?.name || user.name || 'Client',
          quoteAmount: `₦${quote.totalAmount.toLocaleString()}`,
          orderUrl: `${process.env.NEXT_PUBLIC_APP_URL}/fixer/quotes`,
        });
      }
    } catch (error) {
      console.error('Failed to send quote accepted email:', error);
      // Don't fail the request if email fails
    }

    console.log(`[Quote Accepted] Quote ${quoteId} accepted by ${user.email || user.phone}`);

    return NextResponse.json({
      success: true,
      requiresPayment: false,
      message: 'Quote accepted successfully',
      redirectTo: `/client/requests/${quote.requestId}`,
    });
  } catch (error) {
    console.error('Quote acceptance error:', error);
    return NextResponse.json(
      { error: 'Failed to accept quote. Please try again.' },
      { status: 500 }
    );
  }
}
