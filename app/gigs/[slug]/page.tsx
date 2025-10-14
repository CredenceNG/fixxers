import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { colors, borderRadius } from '@/lib/theme';
import { getCurrentUser } from '@/lib/auth';
import Header from '@/components/Header';
import { PackageSelector } from './PackageSelector';
import { MessageFixerButton } from './MessageFixerButton';
import { TwoColumnLayout } from '@/components/ResponsiveLayout';

export default async function GigDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const user = await getCurrentUser();

  const gig = await prisma.gig.findUnique({
    where: { slug },
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          profileImage: true,
          bio: true,
        },
      },
      subcategory: {
        include: {
          category: true,
        },
      },
      packages: {
        orderBy: { price: 'asc' },
      },
    },
  });

  if (!gig) {
    notFound();
  }

  // Get seller reviews
  const reviews = await prisma.review.findMany({
    where: { revieweeId: gig.sellerId },
    select: { rating: true },
  });

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  // Increment impressions (in production, you'd want to do this more carefully)
  await prisma.gig.update({
    where: { id: gig.id },
    data: { impressions: { increment: 1 } },
  });

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary }}>
      <Header />

      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: '24px', fontSize: '14px', color: colors.textSecondary }}>
          <Link href="/" style={{ color: colors.textSecondary, textDecoration: 'none' }}>Home</Link>
          {' > '}
          <Link href="/gigs" style={{ color: colors.textSecondary, textDecoration: 'none' }}>Services</Link>
          {' > '}
          <Link href={`/gigs?category=${gig.subcategory.categoryId}`} style={{ color: colors.textSecondary, textDecoration: 'none' }}>
            {gig.subcategory.category.name}
          </Link>
          {' > '}
          <span style={{ color: colors.textPrimary, fontWeight: '600' }}>{gig.subcategory.name}</span>
        </div>

        <div className="flex flex-col-reverse md:grid md:grid-cols-[1fr_400px] gap-6 md:gap-8">
          {/* Right Column - Pricing (shown first on mobile) */}
          <div className="md:order-2">
            <div className="md:sticky md:top-6">
              <PackageSelector
                packages={gig.packages}
                gigSlug={gig.slug}
                isLoggedIn={!!user}
                isOwnGig={gig.sellerId === user?.id}
              />

              {/* Message Fixer Button - Only show for logged-in clients */}
              {user && user.role === 'CLIENT' && gig.sellerId !== user.id && (
                <div style={{ marginTop: '16px' }}>
                  <MessageFixerButton
                    fixerId={gig.sellerId}
                    fixerName={gig.seller.name || 'the fixer'}
                    gigId={gig.id}
                    gigTitle={gig.title}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Left Column - Gig Details (shown second on mobile) */}
          <div className="md:order-1">
            {/* Title */}
            <h1 style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px' }}>
              {gig.title}
            </h1>

            {/* Seller Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: colors.bgTertiary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: colors.textSecondary,
                }}
              >
                {gig.seller.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                  {gig.seller.name || 'Anonymous'}
                </div>
                {avgRating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '14px' }}>
                    <span style={{ color: '#F59E0B' }}>★</span>
                    <span style={{ fontWeight: '600', color: colors.textPrimary }}>{avgRating}</span>
                    <span style={{ color: colors.textSecondary }}>({reviews.length} reviews)</span>
                  </div>
                )}
              </div>
            </div>

            {/* Main Image */}
            <div
              style={{
                width: '100%',
                height: '400px',
                backgroundColor: colors.bgTertiary,
                borderRadius: borderRadius.lg,
                marginBottom: '32px',
                backgroundImage: gig.images[0] ? `url(${gig.images[0]})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '80px',
              }}
            >
              {!gig.images[0] && '🛠️'}
            </div>

            {/* About This Gig */}
            <div
              style={{
                backgroundColor: colors.white,
                borderRadius: borderRadius.lg,
                border: `1px solid ${colors.border}`,
                padding: '24px',
                marginBottom: '24px',
              }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px' }}>
                About This Service
              </h2>
              <p style={{ fontSize: '15px', color: colors.textPrimary, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>
                {gig.description}
              </p>
            </div>

            {/* Tags */}
            {gig.tags.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {gig.tags.map((tag, index) => (
                    <Link
                      key={index}
                      href={`/gigs?q=${tag}`}
                      style={{
                        padding: '6px 16px',
                        backgroundColor: colors.bgTertiary,
                        color: colors.textPrimary,
                        borderRadius: borderRadius.full,
                        fontSize: '14px',
                        textDecoration: 'none',
                      }}
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Requirements */}
            {gig.requirements.length > 0 && (
              <div
                style={{
                  backgroundColor: colors.white,
                  borderRadius: borderRadius.lg,
                  border: `1px solid ${colors.border}`,
                  padding: '24px',
                  marginBottom: '24px',
                }}
              >
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px' }}>
                  Requirements from Buyer
                </h2>
                <ul style={{ fontSize: '15px', color: colors.textPrimary, lineHeight: '1.7', marginLeft: '20px' }}>
                  {gig.requirements.map((req, index) => (
                    <li key={index}>{req}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* About the Seller */}
            <div
              style={{
                backgroundColor: colors.white,
                borderRadius: borderRadius.lg,
                border: `1px solid ${colors.border}`,
                padding: '24px',
              }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px' }}>
                About The Seller
              </h2>
              <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
                <div
                  style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: '50%',
                    backgroundColor: colors.bgTertiary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '32px',
                    fontWeight: '600',
                    color: colors.textSecondary,
                    flexShrink: 0,
                  }}
                >
                  {gig.seller.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
                    {gig.seller.name || 'Anonymous'}
                  </h3>
                  {gig.seller.bio && (
                    <p style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: '1.6' }}>
                      {gig.seller.bio}
                    </p>
                  )}
                  {avgRating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px', fontSize: '14px' }}>
                      <div>
                        <span style={{ color: '#F59E0B' }}>★</span>{' '}
                        <span style={{ fontWeight: '600' }}>{avgRating}</span> ({reviews.length})
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
