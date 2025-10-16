import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { colors, spacing, borderRadius, shadows, typography } from '@/lib/theme';
import { SearchBar } from '@/components/SearchBar';
import Header from '@/components/Header';
import { CategoryCard } from '@/components/CategoryCard';
import { ViewAllCategoriesButton } from '@/components/ViewAllCategoriesButton';

export default async function Home() {
  const user = await getCurrentUser();

  // Only redirect ADMIN to dashboard, allow clients and fixers to browse
  const roles = user?.roles || [];
  if (roles.includes('ADMIN')) {
    redirect('/admin/dashboard');
  }

  // Fetch featured gigs
  const featuredGigs = await prisma.gig.findMany({
    where: { status: 'ACTIVE' },
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
    },
    orderBy: [{ ordersCount: 'desc' }, { clicks: 'desc' }],
    take: 8,
  });

  // Get reviews for featured gig sellers
  const sellerIds = featuredGigs.map((gig) => gig.sellerId);
  const reviews = await prisma.review.findMany({
    where: { revieweeId: { in: sellerIds } },
    select: { revieweeId: true, rating: true },
  });

  const sellerRatings: Record<string, { avg: number; count: number }> = {};
  sellerIds.forEach((id) => {
    const sellerReviews = reviews.filter((r) => r.revieweeId === id);
    if (sellerReviews.length > 0) {
      const avg = sellerReviews.reduce((sum, r) => sum + r.rating, 0) / sellerReviews.length;
      sellerRatings[id] = { avg, count: sellerReviews.length };
    }
  });

  // Fetch all categories for popular services with counts
  const categories = await prisma.serviceCategory.findMany({
    include: {
      subcategories: {
        include: {
          _count: {
            select: {
              gigs: {
                where: { status: 'ACTIVE' },
              },
              serviceRequests: {
                where: { status: { in: ['PENDING', 'APPROVED'] } },
              },
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  // Icon mapping for categories
  const categoryIcons: Record<string, { icon: string; color: string }> = {
    'Home Repair': { icon: '🏠', color: '#E8F7F0' },
    'Technology': { icon: '💻', color: '#EDF4FF' },
    'Design': { icon: '🎨', color: '#FEF5E7' },
    'Writing': { icon: '✍️', color: '#FDEDEC' },
    'Business': { icon: '💼', color: '#E8F7F0' },
    'Plumbing': { icon: '🔧', color: '#E8F7F0' },
    'Electrical': { icon: '⚡', color: '#FEF5E7' },
    'Carpentry': { icon: '🪚', color: '#EDF4FF' },
    'Car Repairs': { icon: '🚗', color: '#FDEDEC' },
    'Cleaning': { icon: '🧹', color: '#E8F7F0' },
    'Errands': { icon: '🛒', color: '#FEF5E7' },
    'Cooking': { icon: '👨‍🍳', color: '#EDF4FF' },
    'Appliances': { icon: '🔌', color: '#FDEDEC' },
  };

  // Map categories with icons and counts
  const popularCategories = categories.slice(0, 8).map((category) => {
    const iconData = categoryIcons[category.name] || { icon: '🛠️', color: '#F3F4F6' };

    // Sum up gigs and requests from all subcategories
    const totalGigs = category.subcategories.reduce((sum, sub) => sum + sub._count.gigs, 0);
    const totalRequests = category.subcategories.reduce((sum, sub) => sum + sub._count.serviceRequests, 0);

    return {
      id: category.id,
      name: category.name,
      icon: iconData.icon,
      color: iconData.color,
      gigsCount: totalGigs,
      requestsCount: totalRequests,
    };
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.white }}>
      <style jsx>{`
        .hero-section {
          background-color: ${colors.bgSecondary};
          padding: 80px 24px 100px;
        }

        @media (max-width: 768px) {
          .hero-section {
            padding: 40px 16px 60px;
          }
        }

        .hero-title {
          font-size: 56px;
          margin-bottom: 24px;
          color: ${colors.textPrimary};
          font-weight: 700;
          line-height: 1.2;
        }

        @media (max-width: 768px) {
          .hero-title {
            font-size: 32px;
            margin-bottom: 16px;
          }
        }

        .hero-subtitle {
          font-size: 24px;
          color: ${colors.textSecondary};
          margin-bottom: 48px;
        }

        @media (max-width: 768px) {
          .hero-subtitle {
            font-size: 18px;
            margin-bottom: 32px;
          }
        }

        .section-title {
          font-size: 32px;
          font-weight: 700;
          color: ${colors.textPrimary};
        }

        @media (max-width: 768px) {
          .section-title {
            font-size: 24px;
          }
        }

        .section-title-large {
          font-size: 36px;
          font-weight: 700;
          color: ${colors.textPrimary};
          margin-bottom: 12px;
        }

        @media (max-width: 768px) {
          .section-title-large {
            font-size: 28px;
          }
        }

        .section-padding {
          padding: 80px 24px;
        }

        @media (max-width: 768px) {
          .section-padding {
            padding: 40px 16px;
          }
        }

        .cta-title {
          font-size: 40px;
          font-weight: 700;
          margin-bottom: 20px;
        }

        @media (max-width: 768px) {
          .cta-title {
            font-size: 28px;
          }
        }

        .cta-subtitle {
          font-size: 20px;
          margin-bottom: 32px;
          opacity: 0.9;
        }

        @media (max-width: 768px) {
          .cta-subtitle {
            font-size: 16px;
          }
        }

        .cta-buttons {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        @media (max-width: 768px) {
          .cta-buttons {
            flex-direction: column;
          }
        }
      `}</style>

      <Header />

      {/* Hero Section */}
      <div className="hero-section">
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <h1 className="hero-title">
            Find the perfect <span style={{ color: colors.primary }}>service provider</span>
          </h1>
          <p className="hero-subtitle">
            Connect with trusted local professionals for all your home service needs
          </p>

          <SearchBar />
        </div>
      </div>

      {/* Featured Services Section */}
      {featuredGigs.length > 0 && (
        <div style={{ maxWidth: '1400px', margin: '0 auto' }} className="section-padding">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px', flexWrap: 'wrap', gap: '16px' }}>
            <h2 className="section-title">
              Featured Services
            </h2>
            <Link
              href="/gigs"
              style={{
                color: colors.primary,
                fontWeight: '600',
                textDecoration: 'none',
                fontSize: '16px',
              }}
            >
              Browse all services →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '24px' }}>
            {featuredGigs.slice(0, 4).map((gig) => {
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
        </div>
      )}

      {/* Popular Services */}
      <div className="section-padding" style={{ backgroundColor: colors.white }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <h2 className="section-title-large">
              Explore Popular Services
            </h2>
            <p style={{ fontSize: '18px', color: colors.textSecondary }}>
              Browse by category and find the perfect professional for your needs
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {popularCategories.map((category) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                name={category.name}
                icon={category.icon}
                color={category.color}
                gigsCount={category.gigsCount}
                requestsCount={category.requestsCount}
              />
            ))}
          </div>

          {/* View All Categories Link */}
          <div style={{ textAlign: 'center', marginTop: '48px' }}>
            <ViewAllCategoriesButton />
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="section-padding" style={{ maxWidth: '1400px', margin: '0 auto' }}>
        <h2 className="section-title-large" style={{ marginBottom: '60px', textAlign: 'center' }}>
          How it works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '40px' }}>
          {[
            { icon: '🔍', title: 'Post Your Request', desc: 'Tell us what service you need and where you need it' },
            { icon: '💬', title: 'Get Multiple Quotes', desc: 'Receive competitive quotes from verified service providers' },
            { icon: '✅', title: 'Choose & Book', desc: 'Compare quotes, check reviews, and hire the best professional' },
            { icon: '🔒', title: 'Secure Payment', desc: 'Pay securely through our platform with payment protection' }
          ].map((item, index) => (
            <div key={item.title} style={{ backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: '32px', border: `1px solid ${colors.border}`, textAlign: 'center' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: colors.primaryLight, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: '32px' }}>
                {item.icon}
              </div>
              <div style={{ fontSize: '12px', fontWeight: '700', color: colors.primary, marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Step {index + 1}
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: colors.textPrimary }}>{item.title}</h3>
              <p style={{ fontSize: '16px', color: colors.textSecondary, lineHeight: '1.6' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="section-padding" style={{ backgroundColor: colors.bgSecondary }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '40px', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '48px', fontWeight: '700', color: colors.primary, marginBottom: '8px' }}>1,000+</div>
              <div style={{ fontSize: '18px', color: colors.textSecondary }}>Service Providers</div>
            </div>
            <div>
              <div style={{ fontSize: '48px', fontWeight: '700', color: colors.primary, marginBottom: '8px' }}>5,000+</div>
              <div style={{ fontSize: '18px', color: colors.textSecondary }}>Jobs Completed</div>
            </div>
            <div>
              <div style={{ fontSize: '48px', fontWeight: '700', color: colors.primary, marginBottom: '8px' }}>4.9★</div>
              <div style={{ fontSize: '18px', color: colors.textSecondary }}>Average Rating</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="section-padding" style={{ backgroundColor: colors.primary, color: colors.white }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2 className="cta-title">
            Ready to get started?
          </h2>
          <p className="cta-subtitle">
            Join thousands of satisfied customers who found the perfect service provider
          </p>
          {!user && (
            <div className="cta-buttons">
              <Link
                href="/auth/register?role=client"
                style={{
                  padding: '16px 40px',
                  backgroundColor: colors.white,
                  color: colors.primary,
                  borderRadius: borderRadius.md,
                  fontWeight: '600',
                  fontSize: '18px',
                  textDecoration: 'none',
                  display: 'block',
                  textAlign: 'center',
                }}
              >
                I need a service
              </Link>
              <Link
                href="/auth/register?role=fixer"
                style={{
                  padding: '16px 40px',
                  backgroundColor: 'transparent',
                  color: colors.white,
                  border: `2px solid ${colors.white}`,
                  borderRadius: borderRadius.md,
                  fontWeight: '600',
                  fontSize: '18px',
                  textDecoration: 'none',
                  display: 'block',
                  textAlign: 'center',
                }}
              >
                I'm a service provider
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
