import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { notifyAdminNewServiceRequest } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.roles?.includes('CLIENT')) {
      return NextResponse.json({ error: 'Only clients can create service requests' }, { status: 403 });
    }

    const body = await request.json();
    const {
      subcategoryId,
      neighborhoodId,
      title,
      description,
      address,
      urgency,
      preferredDate,
      budget,
    } = body;

    // Validation
    if (!subcategoryId || !neighborhoodId || !title || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create service request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        clientId: user.id,
        subcategoryId,
        neighborhoodId,
        title,
        description,
        address: address || null,
        urgency: urgency || 'flexible',
        preferredDate: preferredDate ? new Date(preferredDate) : null,
        status: 'PENDING',
      },
      include: {
        subcategory: {
          include: {
            category: true,
          },
        },
        neighborhood: true,
      },
    });

    console.log(`[Service Request] Created by ${user.email || user.phone}: ${serviceRequest.title}`);

    // Notify admins about new service request
    try {
      await notifyAdminNewServiceRequest(
        serviceRequest.id,
        serviceRequest.title,
        user.name || user.email || user.phone || 'A client',
        serviceRequest.subcategory.category.name
      );
    } catch (error) {
      console.error('Failed to notify admins:', error);
    }

    return NextResponse.json(serviceRequest);
  } catch (error) {
    console.error('Service request creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create service request. Please try again.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.roles?.includes('CLIENT')) {
      return NextResponse.json({ error: 'Only clients can view their service requests' }, { status: 403 });
    }

    // Fetch client's service requests
    const requests = await prisma.serviceRequest.findMany({
      where: { clientId: user.id },
      include: {
        subcategory: {
          include: {
            category: true,
          },
        },
        neighborhood: true,
        quotes: {
          include: {
            fixer: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Service requests fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch service requests' },
      { status: 500 }
    );
  }
}
