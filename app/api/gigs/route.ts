import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyAdminNewGig } from '@/lib/notifications';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    + '-' + Math.random().toString(36).substring(2, 7);
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'FIXER') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Your account must be approved to create gigs' }, { status: 403 });
    }

    const body = await request.json();
    const { title, subcategoryId, description, tags, requirements, packages, status } = body;

    // Validation
    if (!title || !subcategoryId || !description || !packages || packages.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Validate packages
    for (const pkg of packages) {
      if (!pkg.name || !pkg.description || !pkg.price || !pkg.deliveryDays || pkg.revisions === undefined) {
        return NextResponse.json({ error: 'Invalid package data' }, { status: 400 });
      }
    }

    const slug = generateSlug(title);

    // Create gig with packages
    const gig = await prisma.gig.create({
      data: {
        sellerId: user.id,
        subcategoryId,
        title,
        description,
        slug,
        tags: tags || [],
        requirements: requirements || [],
        searchKeywords: [...(tags || []), title.toLowerCase()],
        status: status || 'PENDING_REVIEW',
        publishedAt: status === 'ACTIVE' ? new Date() : null,
        packages: {
          create: packages.map((pkg: any) => ({
            name: pkg.name,
            description: pkg.description,
            price: pkg.price,
            deliveryDays: pkg.deliveryDays,
            revisions: pkg.revisions,
            features: pkg.features || [],
          })),
        },
      },
      include: {
        packages: true,
        subcategory: {
          include: {
            category: true,
          },
        },
      },
    });

    // Notify admins about new gig (only if pending review)
    if (gig.status === 'PENDING_REVIEW') {
      try {
        await notifyAdminNewGig(
          gig.id,
          gig.title,
          user.name || user.email || user.phone || 'A fixer',
          gig.subcategory.category.name
        );
      } catch (error) {
        console.error('Failed to notify admins about new gig:', error);
      }
    }

    return NextResponse.json(gig, { status: 201 });
  } catch (error: any) {
    console.error('Error creating gig:', error);
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const sellerId = searchParams.get('sellerId');

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (sellerId) {
      where.sellerId = sellerId;
    }

    const gigs = await prisma.gig.findMany({
      where,
      include: {
        packages: {
          orderBy: { price: 'asc' },
        },
        subcategory: {
          include: {
            category: true,
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            profileImage: true,
          },
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: [{ ordersCount: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json(gigs);
  } catch (error: any) {
    console.error('Error fetching gigs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
