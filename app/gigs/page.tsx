import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import Link from 'next/link';
import { colors, borderRadius } from '@/lib/theme';
import { getCurrentUser } from '@/lib/auth';
import Header from '@/components/Header';

export default async function GigsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; subcategory?: string; q?: string }>;
}) {
  const { category, subcategory, q } = await searchParams;
  const user = await getCurrentUser();

  // Fetch categories for sidebar
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

  if (subcategory) {
    whereConditions.subcategoryId = subcategory;
  }

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

        <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', gap: '32px' }}>
          {/* Sidebar */}
          <div>
            <div style={{ backgroundColor: colors.white, borderRadius: borderRadius.lg, border: `1px solid ${colors.border}`, padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px' }}>
                Categories
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {categories.map((cat) => (
                  <div key={cat.id}>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                      {cat.name}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginLeft: '12px' }}>
                      {cat.subcategories.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/gigs?subcategory=${sub.id}`}
                          style={{
                            fontSize: '13px',
                            color: subcategory === sub.id ? colors.primary : colors.textSecondary,
                            textDecoration: 'none',
                            fontWeight: subcategory === sub.id ? '600' : '400',
                          }}
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

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
                          {/* Seller Info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
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

                          {/* Rating & Orders */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', minHeight: '20px' }}>
                            {rating ? (
                              <>
                                <span style={{ color: '#F59E0B', fontSize: '14px' }}>★</span>
                                <span style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                                  {rating.avg.toFixed(1)}
                                </span>
                                <span style={{ fontSize: '14px', color: colors.textSecondary }}>
                                  ({rating.count})
                                </span>
                              </>
                            ) : (
                              <span style={{ fontSize: '14px', color: colors.textSecondary }}>New service</span>
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
    </div>
  );
}
