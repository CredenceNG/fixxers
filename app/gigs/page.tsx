import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import Link from 'next/link';
import { colors, borderRadius } from '@/lib/theme';
import { getCurrentUser } from '@/lib/auth';
import Header from '@/components/Header';
import { GigFilters } from '@/components/GigFilters';
import {
  AvailableNowBadge,
  YearsOfService,
  ReviewCount,
  ResponseTimeBadge,
  JobsCompleted,
  ServiceArea,
} from '@/components/quick-wins/QuickWinBadges';
import { SearchResultBadgeDisplay } from '@/components/badges';
import { calculateBadgeTierFromCount } from '@/lib/badges/badge-utils';

export default async function GigsPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string;
    subcategory?: string;
    q?: string;
    minAmount?: string;
    maxAmount?: string;
    tier?: string;
    verified?: string;
  }>;
}) {
  const { category, subcategory, q, minAmount, maxAmount, tier, verified } = await searchParams;
  const user = await getCurrentUser();

  // Fetch categories for filters
  const categories = await prisma.serviceCategory.findMany({
    include: {
      subcategories: true,
    },
    orderBy: { name: 'asc' },
  });

  // Build filter conditions
  const whereConditions: any = {
    status: 'ACTIVE',
  };

  if (category) {
    whereConditions.subcategory = {
      categoryId: category,
    };
  }

  if (subcategory) {
    whereConditions.subcategoryId = subcategory;
  }

  // Price filtering will be done after fetching
  const minPrice = minAmount ? parseFloat(minAmount) : null;
  const maxPrice = maxAmount ? parseFloat(maxAmount) : null;

  let gigs;

  if (q) {
    // Use raw SQL for full-text search with word stemming
    const searchQuery = q.trim();
    const likePattern = `%${searchQuery}%`;

    let rawGigs: any[];

    if (subcategory) {
      rawGigs = await prisma.$queryRaw`
        SELECT g.id, g.title, g.slug, g."sellerId", g."subcategoryId", g.description,
               g.images, g.status, g."ordersCount", g.clicks, g."createdAt"
        FROM "Gig" g
        WHERE g.status = 'ACTIVE'
          AND g."subcategoryId" = ${subcategory}
          AND (
            to_tsvector('english', g.title || ' ' || g.description) @@ plainto_tsquery('english', ${searchQuery})
            OR g.title ILIKE ${likePattern}
            OR g.description ILIKE ${likePattern}
          )
        ORDER BY
          ts_rank(to_tsvector('english', g.title || ' ' || g.description), plainto_tsquery('english', ${searchQuery})) DESC,
          g."ordersCount" DESC,
          g."createdAt" DESC
        LIMIT 50
      `;
    } else {
      rawGigs = await prisma.$queryRaw`
        SELECT g.id, g.title, g.slug, g."sellerId", g."subcategoryId", g.description,
               g.images, g.status, g."ordersCount", g.clicks, g."createdAt"
        FROM "Gig" g
        WHERE g.status = 'ACTIVE'
          AND (
            to_tsvector('english', g.title || ' ' || g.description) @@ plainto_tsquery('english', ${searchQuery})
            OR g.title ILIKE ${likePattern}
            OR g.description ILIKE ${likePattern}
          )
        ORDER BY
          ts_rank(to_tsvector('english', g.title || ' ' || g.description), plainto_tsquery('english', ${searchQuery})) DESC,
          g."ordersCount" DESC,
          g."createdAt" DESC
        LIMIT 50
      `;
    }

    // Fetch full gig data for the matched IDs
    const gigIds = rawGigs.map((g) => g.id);
    gigs = await prisma.gig.findMany({
      where: { id: { in: gigIds } },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            createdAt: true,
            fixerProfile: {
              select: {
                averageResponseMinutes: true,
                totalJobsCompleted: true,
                neighbourhood: true,
                city: true,
                state: true,
              },
            },
          },
        },
        subcategory: {
          include: {
            category: true,
          },
        },
        packages: {
          orderBy: { price: 'asc' },
          take: 1,
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
    });

    // Sort gigs by the original ranking
    const gigIdOrder = rawGigs.map((g) => g.id);
    gigs.sort((a, b) => gigIdOrder.indexOf(a.id) - gigIdOrder.indexOf(b.id));
  } else {
    // Regular fetch without search
    gigs = await prisma.gig.findMany({
      where: whereConditions,
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            profileImage: true,
            createdAt: true,
            fixerProfile: {
              select: {
                averageResponseMinutes: true,
                totalJobsCompleted: true,
                neighbourhood: true,
                city: true,
                state: true,
              },
            },
          },
        },
        subcategory: {
          include: {
            category: true,
          },
        },
        packages: {
          orderBy: { price: 'asc' },
          take: 1,
        },
        _count: {
          select: {
            orders: true,
          },
        },
      },
      orderBy: [{ ordersCount: 'desc' }, { createdAt: 'desc' }],
      take: 50,
    });
  }

  // Get reviews for sellers
  const sellerIds = gigs.map((gig) => gig.sellerId);
  const reviews = await prisma.review.findMany({
    where: {
      revieweeId: { in: sellerIds },
    },
    select: {
      revieweeId: true,
      rating: true,
    },
  });

  const sellerRatings: Record<string, { avg: number; count: number }> = {};
  sellerIds.forEach((id) => {
    const sellerReviews = reviews.filter((r) => r.revieweeId === id);
    if (sellerReviews.length > 0) {
      const avg = sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length;
      sellerRatings[id] = { avg, count: sellerReviews.length };
    }
  });

  // Get seller badges
  let sellerBadges: any[] = [];
  let badgesBySeller: Record<string, any[]> = {};

  try {
    sellerBadges = await prisma.badgeAssignment.findMany({
      where: {
        fixerId: { in: sellerIds },
        expiresAt: { gt: new Date() },
      },
      include: {
        badge: true,
      },
      orderBy: { assignedAt: 'desc' },
    });

    // Group badges by seller
    sellerBadges.forEach((assignment: any) => {
      if (!badgesBySeller[assignment.fixerId]) {
        badgesBySeller[assignment.fixerId] = [];
      }
      badgesBySeller[assignment.fixerId].push({
        id: assignment.badge.id,
        name: assignment.badge.name,
        icon: assignment.badge.icon,
        type: assignment.badge.type,
        expiresAt: assignment.expiresAt,
      });
    });
  } catch (error) {
    // Badge system not migrated yet, skip badge display
    console.log('Badge system not yet migrated');
  }

  // Filter by price range
  if (minPrice !== null || maxPrice !== null) {
    gigs = gigs.filter((gig) => {
      const price = gig.packages[0]?.price || 0;
      if (minPrice !== null && price < minPrice) return false;
      if (maxPrice !== null && price > maxPrice) return false;
      return true;
    });
  }

  // Filter by badge tier
  if (tier) {
    gigs = gigs.filter((gig) => {
      const sellerBadgeList = badgesBySeller[gig.sellerId] || [];
      const sellerTier = calculateBadgeTierFromCount(sellerBadgeList.length);
      return sellerTier === tier;
    });
  }

  // Filter by verified (has any badges)
  if (verified === 'true') {
    gigs = gigs.filter((gig) => {
      const sellerBadgeList = badgesBySeller[gig.sellerId] || [];
      return sellerBadgeList.length > 0;
    });
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary }}>
      <Header />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '24px', fontSize: '14px', color: colors.textSecondary }}>
          <Link href="/" style={{ color: colors.textSecondary, textDecoration: 'none' }}>
            Home
          </Link>
          {' > '}
          <span style={{ color: colors.textPrimary, fontWeight: '600' }}>Browse Services</span>
        </div>

        {/* Title */}
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
          {q ? `Search results for "${q}"` : 'Browse Services'}
        </h1>
        <p style={{ fontSize: '16px', color: colors.textSecondary, marginBottom: '32px' }}>
          {gigs.length} services available
        </p>

        {/* Filters */}
        <GigFilters categories={categories} />

        {/* Gig Grid */}
        <div>
          {gigs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '80px 20px' }}>
              <p style={{ fontSize: '18px', color: colors.textSecondary, marginBottom: '16px' }}>
                No services found
              </p>
              <Link
                href="/gigs"
                style={{ color: colors.primary, fontWeight: '600', textDecoration: 'none' }}
              >
                Browse all services
              </Link>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
              {gigs.map((gig) => {
                const startingPrice = gig.packages[0]?.price || 0;
                const rating = sellerRatings[gig.sellerId];
                const sellerBadgeList = badgesBySeller[gig.sellerId] || [];
                const sellerTier = calculateBadgeTierFromCount(sellerBadgeList.length);

                return (
                  <Link
                    key={gig.id}
                    href={`/gigs/${gig.slug}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div
                      style={{
                        backgroundColor: colors.white,
                        borderRadius: borderRadius.lg,
                        border: `1px solid ${colors.border}`,
                        overflow: 'hidden',
                        cursor: 'pointer',
                      }}
                    >
                      {/* Image */}
                      <div
                        style={{
                          width: '100%',
                          height: '180px',
                          backgroundColor: colors.bgTertiary,
                          backgroundImage: gig.images[0] ? `url(${gig.images[0]})` : 'none',
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '48px',
                        }}
                      >
                        {!gig.images[0] && '🛠️'}
                      </div>

                      {/* Content */}
                      <div style={{ padding: '16px' }}>
                        {/* Seller Info with Badges */}
                        <div style={{ marginBottom: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: colors.bgTertiary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '14px',
                                fontWeight: '600',
                                color: colors.textSecondary,
                              }}
                            >
                              {gig.seller.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                              {gig.seller.name || 'Anonymous'}
                            </div>
                            {/* Available Now Badge */}
                            {'allowInstantBooking' in gig && gig.allowInstantBooking && (
                              <div style={{ marginLeft: 'auto' }}>
                                <AvailableNowBadge allowInstantBooking={gig.allowInstantBooking} />
                              </div>
                            )}
                          </div>                          {/* Badge Display */}
                          {sellerBadgeList.length > 0 && (
                            <div style={{ marginLeft: '40px' }}>
                              <SearchResultBadgeDisplay tier={sellerTier} badges={sellerBadgeList} />
                            </div>
                          )}
                        </div>

                        {/* Title */}
                        <h3
                          style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: colors.textPrimary,
                            marginBottom: '12px',
                            lineHeight: '1.4',
                            height: '44px',
                            overflow: 'hidden',
                          }}
                        >
                          {gig.title}
                        </h3>

                        {/* Quick Wins Badges */}
                        <div style={{ marginBottom: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {/* Rating & Years of Service */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {rating ? (
                              <ReviewCount count={rating.count} averageRating={rating.avg} />
                            ) : null}
                            <YearsOfService createdAt={gig.seller.createdAt} />
                          </div>

                          {/* Response Time & Jobs Completed */}
                          {gig.seller.fixerProfile && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                              {gig.seller.fixerProfile.averageResponseMinutes && (
                                <ResponseTimeBadge
                                  averageResponseMinutes={gig.seller.fixerProfile.averageResponseMinutes}
                                />
                              )}
                              {gig.seller.fixerProfile.totalJobsCompleted > 0 && (
                                <JobsCompleted count={gig.seller.fixerProfile.totalJobsCompleted} />
                              )}
                            </div>
                          )}

                          {/* Service Area */}
                          {gig.seller.fixerProfile && (
                            <ServiceArea
                              neighbourhood={gig.seller.fixerProfile.neighbourhood}
                              city={gig.seller.fixerProfile.city}
                              state={gig.seller.fixerProfile.state}
                            />
                          )}
                        </div>

                        {/* Price */}
                        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '12px', color: colors.textSecondary, textTransform: 'uppercase' }}>
                              Starting at
                            </span>
                            <span style={{ fontSize: '18px', fontWeight: '700', color: colors.textPrimary }}>
                              ₦{startingPrice.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
