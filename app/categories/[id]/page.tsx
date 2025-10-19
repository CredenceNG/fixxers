import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Header from '@/components/Header';
import { colors, borderRadius, typography } from '@/lib/theme';
import {
  YearsOfService,
  ReviewCount,
  ResponseTimeBadge,
  JobsCompleted,
  ServiceArea,
} from '@/components/quick-wins/QuickWinBadges';

export default async function CategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  const { id } = await params;

  // Fetch category with subcategories
  const category = await prisma.serviceCategory.findUnique({
    where: { id },
    include: {
      subcategories: {
        include: {
          // Fetch active gigs
          gigs: {
            where: { status: 'ACTIVE' },
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
                    },
                  },
                },
              },
              packages: {
                orderBy: { price: 'asc' },
                take: 1,
              },
            },
            orderBy: [{ ordersCount: 'desc' }, { clicks: 'desc' }],
          },
          // Fetch approved service requests
          serviceRequests: {
            where: { status: 'APPROVED' },
            include: {
              client: {
                select: {
                  name: true,
                  email: true,
                },
              },
              neighborhood: {
                select: {
                  id: true,
                  name: true,
                  legacyCity: true,
                  legacyState: true,
                  city: {
                    select: {
                      name: true,
                      state: {
                        select: {
                          name: true,
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      },
    },
  });

  if (!category) {
    redirect('/');
  }

  // Flatten gigs and service requests from all subcategories
  const gigs = category.subcategories.flatMap((sub) => sub.gigs);
  const serviceRequests = category.subcategories.flatMap((sub) => sub.serviceRequests);

  // Get reviews for gig sellers
  const sellerIds = gigs.map((gig) => gig.sellerId);
  const reviews = await prisma.review.findMany({
    where: { revieweeId: { in: sellerIds } },
    select: { revieweeId: true, rating: true },
  });

  const sellerRatings: Record<string, { avg: number; count: number }> = {};
  sellerIds.forEach((sellerId) => {
    const sellerReviews = reviews.filter((r) => r.revieweeId === sellerId);
    if (sellerReviews.length > 0) {
      const avg = sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length;
      sellerRatings[sellerId] = { avg, count: sellerReviews.length };
    }
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.white }}>
      <Header />

      {/* Page Header */}
      <div style={{ backgroundColor: colors.bgSecondary, padding: '60px 24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Link href="/" style={{ color: colors.primary, textDecoration: 'none', fontSize: '14px', fontWeight: '600' }}>
            ← Back to Home
          </Link>
          <h1 style={{ ...typography.h1, marginTop: '16px', marginBottom: '12px', color: colors.textPrimary }}>
            {category.name}
          </h1>
          {category.description && (
            <p style={{ fontSize: '18px', color: colors.textSecondary, maxWidth: '800px' }}>
              {category.description}
            </p>
          )}
        </div>
      </div>

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '60px 24px' }}>
        {/* Service Offers (Gigs) Section */}
        <div style={{ marginBottom: '80px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '24px' }}>
            Service Offers ({gigs.length})
          </h2>
          {gigs.length === 0 ? (
            <div style={{ backgroundColor: colors.bgSecondary, borderRadius: borderRadius.lg, padding: '48px', textAlign: 'center' }}>
              <p style={{ fontSize: '16px', color: colors.textSecondary }}>
                No service offers available in this category yet.
              </p>
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
                        transition: 'transform 0.2s, box-shadow 0.2s',
                      }}
                    >
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
                      <div style={{ padding: '16px' }}>
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

                        {/* Quick Wins Badges */}
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '12px', minHeight: '24px' }}>
                          {gig.seller.createdAt && <YearsOfService createdAt={gig.seller.createdAt} />}
                          {rating && rating.count > 0 && (
                            <ReviewCount count={rating.count} averageRating={rating.avg} />
                          )}
                          {gig.seller.fixerProfile?.averageResponseMinutes && (
                            <ResponseTimeBadge averageResponseMinutes={gig.seller.fixerProfile.averageResponseMinutes} />
                          )}
                          {gig.seller.fixerProfile?.totalJobsCompleted !== undefined && gig.seller.fixerProfile.totalJobsCompleted > 0 && (
                            <JobsCompleted count={gig.seller.fixerProfile.totalJobsCompleted} />
                          )}
                          {gig.seller.fixerProfile?.neighbourhood && gig.seller.fixerProfile?.city && (
                            <ServiceArea
                              neighbourhood={gig.seller.fixerProfile.neighbourhood}
                              city={gig.seller.fixerProfile.city}
                            />
                          )}
                        </div>                        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '12px' }}>
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

        {/* Service Requests Section */}
        <div>
          <h2 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '24px' }}>
            Service Requests ({serviceRequests.length})
          </h2>
          {serviceRequests.length === 0 ? (
            <div style={{ backgroundColor: colors.bgSecondary, borderRadius: borderRadius.lg, padding: '48px', textAlign: 'center' }}>
              <p style={{ fontSize: '16px', color: colors.textSecondary }}>
                No service requests available in this category yet.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              {serviceRequests.map((request) => (
                <div
                  key={request.id}
                  style={{
                    backgroundColor: colors.white,
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.lg,
                    padding: '24px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                        {request.title}
                      </h3>
                      <p style={{ fontSize: '15px', color: colors.textSecondary, lineHeight: '1.6', marginBottom: '12px' }}>
                        {request.description}
                      </p>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '14px', color: colors.textSecondary }}>
                        <div>📍 {request.neighborhood.name}, {request.neighborhood.city.name}</div>
                        <div>📅 {new Date(request.createdAt).toLocaleDateString()}</div>
                        {request.urgency && (
                          <div style={{ textTransform: 'capitalize' }}>
                            ⏰ {request.urgency.replace('_', ' ')}
                          </div>
                        )}
                      </div>
                    </div>
                    {user?.roles?.includes('FIXER') && (
                      <Link
                        href={`/fixer/requests/${request.id}`}
                        style={{
                          padding: '10px 20px',
                          backgroundColor: colors.primary,
                          color: colors.white,
                          borderRadius: borderRadius.md,
                          fontSize: '14px',
                          fontWeight: '600',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        View & Quote
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
