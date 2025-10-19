import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isActiveAgent } from "@/lib/agents/permissions";
import { canManageFixerGig } from "@/lib/agents/permissions";

/**
 * POST /api/agent/gigs/create - Create a gig on behalf of a managed fixer
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

    const body = await request.json();
    const {
      fixerId,
      title,
      description,
      subcategoryId,
      packages,
      images,
      tags,
      faq,
    } = body;

    if (!fixerId || !title || !description || !subcategoryId || !packages) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check if agent can manage this fixer
    const permission = await canManageFixerGig(user.id, fixerId);
    if (!permission.allowed) {
      return NextResponse.json(
        { error: permission.reason || "Cannot manage this fixer's gigs" },
        { status: 403 }
      );
    }

    const agent = await prisma.agent.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });

    // Generate slug from title
    const baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    let slug = baseSlug;
    let counter = 1;

    // Ensure slug is unique
    while (await prisma.gig.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Create gig in a transaction
    const gig = await prisma.$transaction(async (tx) => {
      // Create the gig
      const newGig = await tx.gig.create({
        data: {
          sellerId: fixerId,
          subcategoryId,
          title,
          description,
          slug,
          images: images || [],
          tags: tags || [],
          faq: faq || [],
          status: "PENDING",
        },
      });

      // Create gig packages
      if (packages && packages.length > 0) {
        await tx.gigPackage.createMany({
          data: packages.map((pkg: any) => ({
            gigId: newGig.id,
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            deliveryDays: pkg.deliveryDays,
            revisions: pkg.revisions,
          })),
        });
      }

      // Record that this gig was created by an agent
      await tx.agentGig.create({
        data: {
          agentId: agent!.id,
          gigId: newGig.id,
        },
      });

      return newGig;
    });

    // Notify the fixer
    await prisma.notification.create({
      data: {
        userId: fixerId,
        type: "GENERAL",
        title: "New Gig Created",
        message: `Your agent has created a new gig: "${title}". It's pending approval.`,
        link: `/gigs/${gig.slug}`,
      },
    });

    return NextResponse.json({
      message: "Gig created successfully",
      gig,
    });
  } catch (error) {
    console.error("Create agent gig error:", error);
    return NextResponse.json(
      { error: "Failed to create gig" },
      { status: 500 }
    );
  }
}
