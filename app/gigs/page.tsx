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
    // This handles variations like "repair" vs "repairs", "leak" vs "leaked"
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

      <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Breadcrumb - Hidden on mobile */}
        <div className="hidden md:block mb-6 text-sm text-gray-600">
          <Link href="/" style={{ color: colors.textSecondary, textDecoration: 'none' }}>
            Home
          </Link>
          {' > '}
          <span style={{ color: colors.textPrimary, fontWeight: '600' }}>Browse Services</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: colors.textPrimary }}>
          {q ? `Search results for "${q}"` : 'Browse Services'}
        </h1>
        <p className="text-sm md:text-base mb-6 md:mb-8" style={{ color: colors.textSecondary }}>
          {gigs.length} services available
        </p>

        <div className="flex flex-col md:grid md:grid-cols-[250px_1fr] gap-6 md:gap-8">
          {/* Sidebar - Collapsible on mobile */}
          <div className="md:block">
            <details className="md:hidden mb-4" open={false}>
              <summary className="cursor-pointer py-3 px-4 bg-white rounded-lg border font-semibold text-sm" style={{ borderColor: colors.border, color: colors.textPrimary }}>
                Filter by Category
              </summary>
              <div className="mt-2 p-4 bg-white rounded-lg border" style={{ borderColor: colors.border }}>
                <div className="flex flex-col gap-2">
                  {categories.map((cat) => (
                    <div key={cat.id}>
                      <div className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                        {cat.name}
                      </div>
                      <div className="flex flex-col gap-1 ml-3">
                        {cat.subcategories.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/gigs?subcategory=${sub.id}`}
                            className="text-xs py-1"
                            style={{
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
            </details>

            {/* Desktop sidebar */}
            <div className="hidden md:block bg-white rounded-lg border p-5" style={{ borderColor: colors.border }}>
              <h3 className="text-base font-bold mb-4" style={{ color: colors.textPrimary }}>
                Categories
              </h3>
              <div className="flex flex-col gap-2">
                {categories.map((cat) => (
                  <div key={cat.id}>
                    <div className="text-sm font-semibold mb-2" style={{ color: colors.textPrimary }}>
                      {cat.name}
                    </div>
                    <div className="flex flex-col gap-1 ml-3">
                      {cat.subcategories.map((sub) => (
                        <Link
                          key={sub.id}
                          href={`/gigs?subcategory=${sub.id}`}
                          className="text-xs"
                          style={{
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
              <div className="text-center py-20 px-5">
                <p className="text-lg mb-4" style={{ color: colors.textSecondary }}>
                  No services found
                </p>
                <Link
                  href="/gigs"
                  className="font-semibold no-underline"
                  style={{ color: colors.primary }}
                >
                  Browse all services
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {gigs.map((gig) => {
                  const startingPrice = gig.packages[0]?.price || 0;
                  const rating = sellerRatings[gig.sellerId];

                  return (
                    <Link
                      key={gig.id}
                      href={`/gigs/${gig.slug}`}
                      className="no-underline block"
                      style={{ color: 'inherit' }}
                    >
                      <div
                        className="bg-white rounded-lg border overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-1 cursor-pointer"
                        style={{ borderColor: colors.border }}
                      >
                        {/* Image */}
                        <div
                          className="w-full h-40 md:h-48 bg-gray-100 relative"
                          style={{
                            backgroundImage: gig.images[0] ? `url(${gig.images[0]})` : 'none',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            backgroundColor: colors.bgTertiary,
                          }}
                        >
                          {!gig.images[0] && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl md:text-6xl">
                              🛠️
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div className="p-3 md:p-4">
                          {/* Seller Info */}
                          <div className="flex items-center gap-2 mb-3">
                            <div
                              className="w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-semibold"
                              style={{
                                backgroundColor: colors.bgTertiary,
                                color: colors.textSecondary,
                              }}
                            >
                              {gig.seller.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <div className="text-xs md:text-sm font-semibold truncate" style={{ color: colors.textPrimary }}>
                              {gig.seller.name || 'Anonymous'}
                            </div>
                          </div>

                          {/* Title */}
                          <h3
                            className="text-sm md:text-base font-semibold mb-3 leading-snug line-clamp-2"
                            style={{ color: colors.textPrimary }}
                          >
                            {gig.title}
                          </h3>

                          {/* Rating & Orders */}
                          <div className="flex items-center gap-2 mb-3 text-xs md:text-sm">
                            {rating ? (
                              <>
                                <span className="text-yellow-500">★</span>
                                <span className="font-semibold" style={{ color: colors.textPrimary }}>
                                  {rating.avg.toFixed(1)}
                                </span>
                                <span style={{ color: colors.textSecondary }}>
                                  ({rating.count})
                                </span>
                              </>
                            ) : (
                              <span style={{ color: colors.textSecondary }}>No reviews yet</span>
                            )}
                          </div>

                          {/* Price */}
                          <div className="border-t pt-3" style={{ borderColor: colors.border }}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs uppercase" style={{ color: colors.textSecondary }}>
                                Starting at
                              </span>
                              <span className="text-base md:text-lg font-bold" style={{ color: colors.textPrimary }}>
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
