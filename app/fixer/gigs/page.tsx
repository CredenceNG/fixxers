import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard, DashboardButton, DashboardStat } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';
import GigActions from '@/components/GigActions';

export default async function MyGigsPage() {
  const user = await getCurrentUser();
  const roles = user?.roles || [];

  if (!user || !roles.includes('FIXER')) {
    redirect('/auth/login');
  }

  // Fetch user's gigs
  const gigs = await prisma.gig.findMany({
    where: { sellerId: user.id },
    include: {
      packages: {
        orderBy: { price: 'asc' },
      },
      subcategory: {
        include: {
          category: true,
        },
      },
      _count: {
        select: {
          orders: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const stats = {
    totalGigs: gigs.length,
    activeGigs: gigs.filter((g) => g.status === 'ACTIVE').length,
    pendingGigs: gigs.filter((g) => g.status === 'PENDING_REVIEW').length,
    totalOrders: gigs.reduce((sum, g) => sum + g.ordersCount, 0),
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, any> = {
      DRAFT: { bg: colors.bgTertiary, color: colors.textSecondary },
      PENDING_REVIEW: { bg: colors.warningLight, color: colors.warning },
      ACTIVE: { bg: colors.successLight, color: colors.success },
      PAUSED: { bg: colors.bgTertiary, color: colors.textSecondary },
      REJECTED: { bg: colors.errorLight, color: colors.error },
    };

    const style = styles[status] || styles.DRAFT;

    return (
      <span
        style={{
          padding: '4px 12px',
          fontSize: '12px',
          fontWeight: '600',
          borderRadius: borderRadius.full,
          backgroundColor: style.bg,
          color: style.color,
        }}
      >
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <DashboardLayoutWithHeader
      title="My Service Offers"
      subtitle="Manage your service offers and track performance"
      actions={
        <Link href="/fixer/gigs/new">
          <DashboardButton>+ Create New Offer</DashboardButton>
        </Link>
      }
    >
      {/* Stats */}
      <div className="fixer-gigs-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <DashboardStat className="fixer-gigs-stat-card fixer-gigs-stat-label fixer-gigs-stat-value" label="Total Offers" value={stats.totalGigs} icon="📋" />
        <DashboardStat className="fixer-gigs-stat-card fixer-gigs-stat-label fixer-gigs-stat-value" label="Active" value={stats.activeGigs} icon="✅" color={colors.success} />
        <DashboardStat className="fixer-gigs-stat-card fixer-gigs-stat-label fixer-gigs-stat-value" label="Pending Review" value={stats.pendingGigs} icon="⏳" color={colors.warning} />
        <DashboardStat className="fixer-gigs-stat-card fixer-gigs-stat-label fixer-gigs-stat-value" label="Total Orders" value={stats.totalOrders} icon="🛒" color={colors.primary} />
      </div>

      {/* Gigs List */}
      <DashboardCard title="Your Service Offers">
        {gigs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ fontSize: '16px', color: colors.textSecondary, marginBottom: '16px' }}>
              You haven't created any service offers yet
            </p>
            <Link href="/fixer/gigs/new">
              <DashboardButton>Create Your First Offer</DashboardButton>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {gigs.map((gig) => {
              const startingPrice = gig.packages[0]?.price || 0;

              return (
                <div
                  key={gig.id}
                  style={{
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.lg,
                    padding: '20px',
                    display: 'flex',
                    gap: '20px',
                  }}
                >
                  {/* Image placeholder */}
                  <div
                    style={{
                      width: '180px',
                      height: '120px',
                      flexShrink: 0,
                      backgroundColor: colors.bgTertiary,
                      borderRadius: borderRadius.md,
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
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                          <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.textPrimary }}>
                            {gig.title}
                          </h3>
                          {getStatusBadge(gig.status)}
                        </div>

                        <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px' }}>
                          {gig.subcategory.category.name} › {gig.subcategory.name}
                        </div>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>
                          Starting at
                        </div>
                        <div style={{ fontSize: '24px', fontWeight: '700', color: colors.textPrimary }}>
                          ₦{startingPrice.toLocaleString()}
                        </div>
                      </div>
                    </div>

                    <p
                      style={{
                        fontSize: '14px',
                        color: colors.textSecondary,
                        lineHeight: '1.5',
                        marginBottom: '16px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {gig.description}
                    </p>

                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', fontSize: '14px', color: colors.textSecondary }}>
                      <div>
                        <span style={{ fontWeight: '600', color: colors.textPrimary }}>{gig.ordersCount}</span> orders
                      </div>
                      <div>
                        <span style={{ fontWeight: '600', color: colors.textPrimary }}>{gig.impressions}</span> views
                      </div>
                      <div>
                        <span style={{ fontWeight: '600', color: colors.textPrimary }}>{gig.clicks}</span> clicks
                      </div>
                    </div>

                    {gig.status === 'REJECTED' && gig.rejectionReason && (
                      <div
                        style={{
                          marginTop: '12px',
                          padding: '12px',
                          backgroundColor: colors.errorLight,
                          borderRadius: borderRadius.md,
                          fontSize: '13px',
                          color: colors.error,
                        }}
                      >
                        <strong>Rejection Reason:</strong> {gig.rejectionReason}
                      </div>
                    )}

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <Link
                        href={`/gigs/${gig.slug}`}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: colors.primary,
                          backgroundColor: colors.white,
                          border: `1px solid ${colors.primary}`,
                          borderRadius: borderRadius.md,
                          textDecoration: 'none',
                          display: 'inline-block',
                        }}
                      >
                        Preview
                      </Link>
                      <Link
                        href={`/fixer/gigs/${gig.id}/edit`}
                        style={{
                          padding: '8px 16px',
                          fontSize: '14px',
                          fontWeight: '600',
                          color: colors.textPrimary,
                          backgroundColor: colors.white,
                          border: `1px solid ${colors.border}`,
                          borderRadius: borderRadius.md,
                          textDecoration: 'none',
                          display: 'inline-block',
                        }}
                      >
                        Edit
                      </Link>

                      <GigActions gigId={gig.id} status={gig.status} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DashboardCard>
    </DashboardLayoutWithHeader>
  );
}
