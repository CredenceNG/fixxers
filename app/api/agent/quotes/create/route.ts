import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isActiveAgent } from "@/lib/agents/permissions";
import { canSubmitFixerQuote } from "@/lib/agents/permissions";

/**
 * POST /api/agent/quotes/create - Submit a quote on behalf of a managed fixer
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const isAgent = await isActiveAgent(user.id);
    if (!isAgent) {
      return NextResponse.json(
        { error: "User is not an active agent" },
        { status: 403 }
      );
    }

    const {
      fixerId,
      requestId,
      totalAmount,
      estimatedDuration,
      notes,
      type,
      inspectionFee,
    } = await request.json() as any;

    if (!fixerId || !requestId || !totalAmount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if agent can submit quote for this fixer and request
    const permission = await canSubmitFixerQuote(user.id, fixerId, requestId);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason || "Cannot submit quote for this request" },
        { status: 403 }
      );
    }

    const agent = await prisma.agent.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    // Check if fixer already has a quote for this request
    const existingQuote = await prisma.quote.findFirst({
      where: {
        requestId,
        fixerId,
      },
    });

    if (existingQuote) {
      return NextResponse.json(
        { error: "Fixer already has a quote for this request" },
        { status: 400 }
      );
    }

    // Create quote in a transaction
    const quote = await prisma.$transaction(async (tx) => {
      // Create the quote
      const newQuote = await tx.quote.create({
        data: {
          requestId,
          fixerId,
          totalAmount,
          estimatedDuration,
          notes,
          type: type || "DIRECT",
          inspectionFee: inspectionFee || null,
          inspectionFeePaid: false,
        },
      });

      // Record that this quote was submitted by an agent
      await tx.agentQuote.create({
        data: {
          agentId: agent!.id,
          quoteId: newQuote.id,
        },
      });

      return newQuote;
    });

    // Get request details for notifications
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      select: {
        title: true,
        clientId: true,
      },
    });

    // Notify the fixer
    await prisma.notification.create({
      data: {
        userId: fixerId,
        type: "GENERAL",
        title: "Quote Submitted",
        message: `Your agent submitted a quote of ₦${totalAmount.toLocaleString()} for "${serviceRequest?.title || 'service request'}".`,
        link: `/fixer/quotes`,
      },
    });

    // Notify the client
    if (serviceRequest) {
      await prisma.notification.create({
        data: {
          userId: serviceRequest.clientId,
          type: "NEW_QUOTE",
          title: "New Quote Received",
          message: `You received a quote of ₦${totalAmount.toLocaleString()} for "${serviceRequest.title}".`,
          link: `/client/requests/${requestId}`,
        },
      });
    }

    return NextResponse.json({
      message: "Quote submitted successfully",
      quote,
    });
  } catch (error) {
    console.error("Create agent quote error:", error);
    return NextResponse.json(
      { error: "Failed to submit quote" },
      { status: 500 }
    );
  }
}
