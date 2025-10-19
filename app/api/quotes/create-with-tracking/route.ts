/**
 * Quick Win: Enhanced Quote Creation API
 * Automatically tracks response time when fixers submit quotes
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
// Will work after migration: import { calculateQuoteResponseTime, updateFixerAverageResponseTime } from '@/lib/quick-wins/response-time';

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const {
      requestId,
      totalAmount,
      laborCost,
      materialCost,
      otherCosts = 0,
      description,
      estimatedDuration,
      startDate,
      requiresDownPayment = false,
      downPaymentAmount,
      downPaymentPercentage,
      downPaymentReason,
      type = "DIRECT",
      inspectionFee,
    } = body;

    // Validate required fields
    if (!requestId || !totalAmount || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if request exists
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      select: { createdAt: true, clientId: true },
    });

    if (!request) {
      return NextResponse.json(
        { error: "Service request not found" },
        { status: 404 }
      );
    }

    // Quick Win: Calculate response time
    const now = new Date();
    const responseTimeMinutes = Math.floor(
      (now.getTime() - request.createdAt.getTime()) / (1000 * 60)
    );

    // Create quote with response time
    const quote = await prisma.quote.create({
      data: {
        requestId,
        fixerId: user.id,
        type,
        inspectionFee,
        totalAmount,
        laborCost,
        materialCost,
        otherCosts,
        description,
        estimatedDuration,
        startDate: startDate ? new Date(startDate) : undefined,
        requiresDownPayment,
        downPaymentAmount,
        downPaymentPercentage,
        downPaymentReason,
        // Quick Win: Add response time after migration
        // responseTimeMinutes
      },
      include: {
        fixer: {
          select: {
            id: true,
            name: true,
            email: true,
            profileImage: true,
            fixerProfile: {
              select: {
                averageResponseMinutes: true,
                totalJobsCompleted: true,
              },
            },
          },
        },
      },
    });

    // Quick Win: Update fixer's average response time (async, non-blocking)
    // After migration, uncomment:
    // updateFixerAverageResponseTime(user.id).catch(console.error);

    // Send notification to client
    await prisma.notification.create({
      data: {
        userId: request.clientId,
        type: "NEW_QUOTE",
        title: "New Quote Received",
        message: `${
          quote.fixer.name
        } sent you a quote for ₦${totalAmount.toLocaleString()}`,
        link: `/client/requests/${requestId}`,
      },
    });

    // Send email notification to client
    try {
      const { sendQuoteReceivedEmail } = await import('@/lib/emails/template-renderer');
      const client = await prisma.user.findUnique({
        where: { id: request.clientId },
        select: { email: true, name: true, emailNotifications: true },
      });

      const serviceRequest = await prisma.serviceRequest.findUnique({
        where: { id: requestId },
        select: { title: true },
      });

      if (client?.email && client.emailNotifications && serviceRequest) {
        await sendQuoteReceivedEmail({
          clientEmail: client.email,
          clientName: client.name || 'Client',
          quoteId: quote.id,
          serviceName: serviceRequest.title,
          fixerName: quote.fixer.name || 'Service Provider',
          quoteAmount: `₦${totalAmount.toLocaleString()}`,
          quoteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/client/requests/${requestId}`,
        });
      }
    } catch (error) {
      console.error('Failed to send quote received email:', error);
      // Don't fail the quote creation if email fails
    }

    return NextResponse.json({
      success: true,
      quote,
      responseTime: {
        minutes: responseTimeMinutes,
        formatted:
          responseTimeMinutes < 60
            ? `${responseTimeMinutes} minutes`
            : `${Math.round(responseTimeMinutes / 60)} hours`,
      },
    });
  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json(
      { error: "Failed to create quote" },
      { status: 500 }
    );
  }
}
