import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const createOrderSchema = z.object({
  gigId: z.string(),
  packageId: z.string(),
  requirementAnswers: z.array(z.string()).optional().default([]),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'CLIENT') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = createOrderSchema.parse(body);

    // Verify gig exists and is active
    const gig = await prisma.gig.findUnique({
      where: { id: validated.gigId },
      include: {
        packages: true,
        seller: true,
      },
    });

    if (!gig) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    if (gig.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This service is not currently available' },
        { status: 400 }
      );
    }

    // Verify package exists
    const selectedPackage = gig.packages.find((pkg) => pkg.id === validated.packageId);
    if (!selectedPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Check if user is trying to buy their own gig
    if (gig.sellerId === user.id) {
      return NextResponse.json(
        { error: 'You cannot order your own service' },
        { status: 400 }
      );
    }

    // Calculate pricing
    const platformFee = selectedPackage.price * 0.05; // 5% platform fee
    const sellerEarnings = selectedPackage.price - platformFee;
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + selectedPackage.deliveryDays);

    // Create the order
    const order = await prisma.order.create({
      data: {
        // Gig origin
        gigId: gig.id,
        packageId: selectedPackage.id,

        // Parties
        clientId: user.id,
        fixerId: gig.sellerId,

        // Financials
        status: 'PENDING',
        totalAmount: selectedPackage.price,
        platformFee,
        fixerAmount: sellerEarnings,

        // Workflow
        deliveryDate,

        // Revisions
        revisionsAllowed: selectedPackage.revisions,

        // Buyer requirements
        requirementResponses: validated.requirementAnswers,
      },
      include: {
        gig: true,
        package: true,
        client: true,
        fixer: true,
      },
    });

    // Update gig order count
    await prisma.gig.update({
      where: { id: gig.id },
      data: { ordersCount: { increment: 1 } },
    });

    // TODO: Send notification to seller
    // TODO: Send confirmation email to buyer

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
