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

    if (!user || !user.roles?.includes('CLIENT')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user with emailNotifications field
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        name: true,
        emailNotifications: true,
      },
    });

    if (!fullUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validated = createOrderSchema.parse(body);

    // Verify gig exists and is active
    const gig = await prisma.gig.findUnique({
      where: { id: validated.gigId },
      include: {
        packages: true,
        seller: {
          select: {
            id: true,
            email: true,
            name: true,
            emailNotifications: true,
          },
        },
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

    // Send notifications to both parties
    try {
      const { sendOrderCreatedEmailToFixer, sendOrderCreatedEmailToClient } = await import('@/lib/email');

      // Notify fixer
      if (gig.seller.email && gig.seller.emailNotifications) {
        await sendOrderCreatedEmailToFixer(
          gig.seller.email,
          gig.seller.name || 'Service Provider',
          user.name || 'Client',
          gig.title,
          selectedPackage.price,
          order.id,
          true // isGigOrder
        );
      }

      // Notify client
      if (fullUser.email && fullUser.emailNotifications) {
        await sendOrderCreatedEmailToClient(
          fullUser.email,
          fullUser.name || 'Client',
          gig.seller.name || 'Service Provider',
          gig.title,
          selectedPackage.price,
          order.id
        );
      }
    } catch (error) {
      console.error('Failed to send order notification emails:', error);
      // Don't fail the order creation if emails fail
    }

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
