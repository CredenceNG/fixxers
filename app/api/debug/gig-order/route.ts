import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Find Guadalipe's latest order
    const guadalipe = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: 'guadalipe', mode: 'insensitive' } },
          { email: 'quoijepagroitra-6475@yopmail.com' }
        ]
      }
    });

    const orders = guadalipe ? await prisma.order.findMany({
      where: { clientId: guadalipe.id },
      include: {
        fixer: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        gig: {
          select: {
            id: true,
            title: true,
          }
        },
        package: {
          select: {
            id: true,
            name: true,
            price: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    }) : [];

    // Find Adoza's orders (what they should see)
    const adoza = await prisma.user.findFirst({
      where: {
        OR: [
          { email: { contains: 'adoza', mode: 'insensitive' } },
          { email: 'adoza@yopmail.com' }
        ]
      }
    });

    const adozaOrders = adoza ? await prisma.order.findMany({
      where: {
        fixerId: adoza.id,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
          }
        },
        gig: {
          select: {
            id: true,
            title: true,
          }
        },
        request: {
          select: {
            id: true,
            title: true,
          }
        },
        package: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    }) : [];

    return NextResponse.json({
      guadalipe: {
        id: guadalipe?.id,
        email: guadalipe?.email,
        orders: orders.map(o => ({
          id: o.id,
          status: o.status,
          totalAmount: o.totalAmount,
          fixerId: o.fixerId,
          fixerName: o.fixer.name || o.fixer.email,
          gigTitle: o.gig?.title,
          packageName: o.package?.name,
          createdAt: o.createdAt,
        }))
      },
      adoza: {
        id: adoza?.id,
        email: adoza?.email,
        ordersCount: adozaOrders.length,
        orders: adozaOrders.map(o => ({
          id: o.id,
          status: o.status,
          totalAmount: o.totalAmount,
          clientName: o.client.name || o.client.email,
          gigTitle: o.gig?.title,
          requestTitle: o.request?.title,
          packageName: o.package?.name,
          createdAt: o.createdAt,
        }))
      }
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Failed to debug' }, { status: 500 });
  }
}
