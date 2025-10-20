import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Find Adoza Fixer
    const adoza = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: 'Adoza', mode: 'insensitive' } },
          { email: { contains: 'adoza', mode: 'insensitive' } }
        ]
      },
      include: {
        fixerServices: {
          include: {
            subcategory: {
              include: { category: true }
            },
            neighborhoods: {
              include: {
                city: {
                  include: {
                    state: true,
                  },
                },
              },
            },
          }
        }
      }
    });

    // Find Guadalipe's request
    const guadalipe = await prisma.user.findFirst({
      where: {
        OR: [
          { name: { contains: 'Guadalipe', mode: 'insensitive' } },
          { email: { contains: 'guadalipe', mode: 'insensitive' } }
        ]
      }
    });

    const requests = guadalipe ? await prisma.serviceRequest.findMany({
      where: { clientId: guadalipe.id },
      include: {
        subcategory: {
          include: { category: true }
        },
        neighborhood: {
          include: {
            city: {
              include: {
                state: true,
              },
            },
          },
        },
      }
    }) : [];

    // Check matching logic
    let matchingAnalysis = null;
    if (adoza && requests.length > 0) {
      const fixerNeighborhoodIds = adoza.fixerServices.flatMap(s => s.neighborhoods.map(n => n.id));
      const fixerCategoryIds = adoza.fixerServices.map(s => s.subcategory.categoryId);

      matchingAnalysis = {
        fixerNeighborhoodIds,
        fixerCategoryIds,
        requests: requests.map(req => ({
          title: req.title,
          status: req.status,
          neighborhoodId: req.neighborhoodId,
          categoryId: req.subcategory.categoryId,
          hasNeighborhood: fixerNeighborhoodIds.includes(req.neighborhoodId),
          hasCategory: fixerCategoryIds.includes(req.subcategory.categoryId),
          canQuote: fixerNeighborhoodIds.includes(req.neighborhoodId) && fixerCategoryIds.includes(req.subcategory.categoryId)
        }))
      };
    }

    return NextResponse.json({
      adoza: {
        name: adoza?.name,
        email: adoza?.email,
        status: adoza?.status,
        services: adoza?.fixerServices.map(s => ({
          category: s.subcategory.category.name,
          categoryId: s.subcategory.categoryId,
          subcategory: s.subcategory.name,
          neighborhoods: s.neighborhoods.map(n => ({
            id: n.id,
            name: n.name,
            city: n.city?.name,
            state: n.city?.state?.name
          }))
        }))
      },
      guadalipe: {
        name: guadalipe?.name,
        email: guadalipe?.email,
        requests: requests.map(r => ({
          title: r.title,
          status: r.status,
          category: r.subcategory.category.name,
          categoryId: r.subcategory.categoryId,
          subcategory: r.subcategory.name,
          neighborhood: {
            id: r.neighborhoodId,
            name: r.neighborhood.name,
            city: r.neighborhood.city?.name,
            state: r.neighborhood.city?.state?.name
          }
        }))
      },
      matchingAnalysis
    });
  } catch (error) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: 'Failed to debug' }, { status: 500 });
  }
}
