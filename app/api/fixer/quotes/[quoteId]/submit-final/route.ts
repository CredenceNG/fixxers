import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ quoteId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'FIXER') {
      return NextResponse.json({ error: 'Only fixers can submit final quotes' }, { status: 403 });
    }

    const { quoteId } = await params;
    const body = await request.json();
    const {
      laborCost,
      materialCost,
      otherCosts,
      description,
      estimatedDuration,
      startDate,
      requiresDownPayment,
      downPaymentPercentage,
      downPaymentReason,
    } = body;

    // Get the original inspection quote
    const originalQuote = await prisma.quote.findUnique({
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
      },
    });

    if (!originalQuote) {
      return NextResponse.json({ error: 'Original quote not found' }, { status: 404 });
    }

    // Verify this is the fixer's quote
    if (originalQuote.fixerId !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Verify it's an inspection quote
    if (originalQuote.type !== 'INSPECTION_REQUIRED') {
      return NextResponse.json({ error: 'This is not an inspection quote' }, { status: 400 });
    }

    // Verify inspection fee has been paid
    if (!originalQuote.inspectionFeePaid) {
      return NextResponse.json({ error: 'Inspection fee must be paid before submitting final quote' }, { status: 400 });
    }

    // Validate final quote data
    if (!laborCost || !materialCost || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (laborCost <= 0 || materialCost < 0) {
      return NextResponse.json({ error: 'Costs must be valid amounts' }, { status: 400 });
    }

    // Calculate total amount (inspection fee is already paid, so it's part of the total)
    const totalAmount = (laborCost || 0) + (materialCost || 0) + (otherCosts || 0);

    // Validate that total includes the inspection fee that was already paid
    if (totalAmount < (originalQuote.inspectionFee || 0)) {
      return NextResponse.json({
        error: `Total amount must be at least ₦${originalQuote.inspectionFee?.toLocaleString()} (the inspection fee already paid)`
      }, { status: 400 });
    }

    const downPaymentAmount = requiresDownPayment && downPaymentPercentage && totalAmount > 0
      ? Math.round((totalAmount * downPaymentPercentage) / 100)
      : null;

    // Validate down payment
    if (requiresDownPayment) {
      if (!downPaymentPercentage || downPaymentPercentage <= 0 || downPaymentPercentage > 50) {
        return NextResponse.json({ error: 'Down payment must be between 1-50%' }, { status: 400 });
      }
      if (downPaymentAmount && downPaymentAmount < 1000) {
        return NextResponse.json({ error: 'Down payment must be at least ₦1,000' }, { status: 400 });
      }
      if (!downPaymentReason || downPaymentReason.trim().length < 10) {
        return NextResponse.json({ error: 'Please provide a reason for down payment (min 10 characters)' }, { status: 400 });
      }
    }

    // Update the original quote with final quote details
    const finalQuote = await prisma.quote.update({
      where: { id: quoteId },
      data: {
        totalAmount,
        laborCost,
        materialCost,
        otherCosts: otherCosts || 0,
        description,
        estimatedDuration: estimatedDuration || null,
        startDate: startDate ? new Date(startDate) : null,
        requiresDownPayment: requiresDownPayment || false,
        downPaymentAmount,
        downPaymentPercentage: downPaymentPercentage || null,
        downPaymentReason: downPaymentReason || null,
        isRevised: true, // Mark as revised with final costs
      },
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

    // Create notification for client
    await prisma.notification.create({
      data: {
        userId: originalQuote.request.clientId,
        type: 'FINAL_QUOTE_SUBMITTED',
        title: 'Final Quote Received',
        message: `Fixer has completed the inspection and submitted a final quote of ₦${totalAmount.toLocaleString()} for "${originalQuote.request.title}". Review and decide whether to proceed.`,
        link: `/client/requests/${originalQuote.requestId}`,
      },
    });

    console.log(`[Final Quote] Submitted by ${user.email || user.phone} for request: ${originalQuote.request.title}`);

    return NextResponse.json({
      ...finalQuote,
      message: 'Final quote submitted successfully',
    });
  } catch (error) {
    console.error('Final quote submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit final quote. Please try again.' },
      { status: 500 }
    );
  }
}
