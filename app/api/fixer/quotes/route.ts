import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyQuoteSubmitted } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.role !== 'FIXER') {
      return NextResponse.json({ error: 'Only fixers can submit quotes' }, { status: 403 });
    }

    const body = await request.json();
    const {
      requestId,
      type,
      inspectionFee,
      laborCost,
      materialCost,
      otherCosts,
      description,
      estimatedDuration,
      startDate,
      requiresDownPayment,
      downPaymentPercentage,
      downPaymentReason,
      originalQuoteId,
    } = body;

    const quoteType = type || 'DIRECT';

    // Validation based on quote type
    if (!requestId || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (quoteType === 'DIRECT') {
      // Direct quotes require costs
      if (!laborCost || !materialCost) {
        return NextResponse.json({ error: 'Direct quotes require labor and material costs' }, { status: 400 });
      }
      if (laborCost <= 0 || materialCost < 0) {
        return NextResponse.json({ error: 'Costs must be greater than zero' }, { status: 400 });
      }
    } else if (quoteType === 'INSPECTION_REQUIRED') {
      // Inspection quotes require inspection fee
      if (!inspectionFee || inspectionFee < 500) {
        return NextResponse.json({ error: 'Inspection fee required (minimum ₦500)' }, { status: 400 });
      }
      if (inspectionFee > 10000) {
        return NextResponse.json({ error: 'Inspection fee cannot exceed ₦10,000' }, { status: 400 });
      }
    }

    // Down payment validation
    if (requiresDownPayment && quoteType === 'DIRECT') {
      if (!downPaymentPercentage || downPaymentPercentage <= 0 || downPaymentPercentage > 50) {
        return NextResponse.json({ error: 'Down payment must be between 1-50%' }, { status: 400 });
      }
      if (!downPaymentReason || downPaymentReason.trim().length < 10) {
        return NextResponse.json({ error: 'Please provide a reason for down payment (min 10 characters)' }, { status: 400 });
      }
    }

    // Check if request exists and is accepting quotes
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: {
        subcategory: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!serviceRequest) {
      return NextResponse.json({ error: 'Service request not found' }, { status: 404 });
    }

    if (!['APPROVED', 'QUOTED'].includes(serviceRequest.status)) {
      return NextResponse.json(
        { error: 'This request is no longer accepting quotes' },
        { status: 400 }
      );
    }

    // Check if fixer serves this neighborhood and category
    const fixerServices = await prisma.fixerService.findMany({
      where: { fixerId: user.id },
      include: {
        neighborhoods: true,
        subcategory: {
          include: {
            category: true,
          },
        },
      },
    });

    const fixerNeighborhoodIds = fixerServices.flatMap((s) => s.neighborhoods.map((n) => n.id));
    const fixerCategoryIds = fixerServices.map((s) => s.subcategory.categoryId);

    if (!fixerNeighborhoodIds.includes(serviceRequest.neighborhoodId)) {
      return NextResponse.json(
        { error: 'You can only quote for requests in your service neighborhoods' },
        { status: 403 }
      );
    }

    if (!fixerCategoryIds.includes(serviceRequest.subcategory.categoryId)) {
      return NextResponse.json(
        { error: 'You can only quote for requests in your service categories' },
        { status: 403 }
      );
    }

    // Check if fixer has already quoted
    const existingQuote = await prisma.quote.findUnique({
      where: {
        requestId_fixerId: {
          requestId,
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

    // Calculate total amount and down payment
    const totalAmount = quoteType === 'DIRECT'
      ? (laborCost || 0) + (materialCost || 0) + (otherCosts || 0)
      : 0; // Inspection quotes have 0 total until revised

    const downPaymentAmount = requiresDownPayment && downPaymentPercentage && totalAmount > 0
      ? Math.round((totalAmount * downPaymentPercentage) / 100)
      : null;

    // Validate minimum down payment
    if (downPaymentAmount && downPaymentAmount < 1000) {
      return NextResponse.json({ error: 'Down payment must be at least ₦1,000' }, { status: 400 });
    }

    // Create quote
    const quote = await prisma.quote.create({
      data: {
        requestId,
        fixerId: user.id,
        type: quoteType,
        inspectionFee: quoteType === 'INSPECTION_REQUIRED' ? inspectionFee : null,
        inspectionFeePaid: false,
        isRevised: !!originalQuoteId,
        originalQuoteId: originalQuoteId || null,
        totalAmount,
        laborCost: laborCost || 0,
        materialCost: materialCost || 0,
        otherCosts: otherCosts || 0,
        description,
        estimatedDuration: estimatedDuration || null,
        startDate: startDate ? new Date(startDate) : null,
        requiresDownPayment: requiresDownPayment || false,
        downPaymentAmount,
        downPaymentPercentage: downPaymentPercentage || null,
        downPaymentReason: downPaymentReason || null,
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

    // Update request status to QUOTED if it was APPROVED
    if (serviceRequest.status === 'APPROVED') {
      await prisma.serviceRequest.update({
        where: { id: requestId },
        data: { status: 'QUOTED' },
      });
    }

    console.log(`[Quote] ${quoteType} quote submitted by ${user.email || user.phone} for request: ${serviceRequest.title}`);

    // Send notification to client
    try {
      await notifyQuoteSubmitted(
        serviceRequest.clientId,
        requestId,
        user.name || 'A fixer',
        quoteType === 'INSPECTION_REQUIRED' ? inspectionFee : totalAmount
      );
    } catch (error) {
      console.error('Failed to send quote notification:', error);
    }

    return NextResponse.json({
      ...quote,
      type: quoteType,
    });
  } catch (error) {
    console.error('Quote submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit quote. Please try again.' },
      { status: 500 }
    );
  }
}
