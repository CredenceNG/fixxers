import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors, borderRadius } from '@/lib/theme';
import { GigApprovalActions } from './GigApprovalActions';

export default async function AdminGigReviewPage({ params }: { params: Promise<{ gigId: string }> }) {
  const user = await getCurrentUser();
  const roles = user?.roles || [];

  if (!user || !roles.includes('ADMIN')) {
    redirect('/auth/login');
  }

  const { gigId } = await params;

  // Fetch pending counts for AdminDashboardWrapper
  const prismaAny = prisma as any;

  const [pendingBadgeRequests, pendingAgentApplications, pendingReports] = await Promise.all([
    prismaAny.badgeRequest?.count({
      where: {
        status: {
          in: ['PENDING', 'PAYMENT_RECEIVED', 'UNDER_REVIEW'],
        },
      },
    }) ?? 0,
    prismaAny.agent?.count({
      where: {
        status: 'PENDING',
      },
    }) ?? 0,
    prismaAny.reviewReport?.count({
      where: {
        status: {
          in: ['PENDING', 'REVIEWING'],
        },
      },
    }) ?? 0,
  ]);

  const gig = await prisma.gig.findUnique({
    where: { id: gigId },
    include: {
      seller: {
        include: {
          fixerProfile: true,
        },
      },
      packages: {
        orderBy: { price: 'asc' },
      },
      subcategory: {
        include: {
          category: true,
        },
      },
    },
  });

  if (!gig) {
    redirect('/admin/dashboard');
  }

  const statusColor =
    gig.status === 'ACTIVE'
      ? colors.success
      : gig.status === 'PENDING_REVIEW'
      ? colors.warning
      : gig.status === 'PAUSED'
      ? colors.textSecondary
      : gig.status === 'DRAFT'
      ? colors.gray500
      : colors.error;

  return (
    <AdminDashboardWrapper
      userName={user.name || undefined}
      userAvatar={user.profileImage || undefined}
      pendingBadgeRequests={pendingBadgeRequests}
      pendingAgentApplications={pendingAgentApplications}
      pendingReports={pendingReports}
    >
      {/* Page Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
            Review Service Offer
          </h1>
          <p style={{ fontSize: '14px', color: colors.textSecondary }}>
            Review and approve service offer from {gig.seller.name || gig.seller.email}
          </p>
        </div>
        <Link
          href="/admin/gigs"
          style={{
            padding: '10px 20px',
            backgroundColor: colors.white,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.md,
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          ← Back to Gigs
        </Link>
      </div>

      <div style={{ maxWidth: '1200px' }}>
        {/* Status Banner */}
        <div
          style={{
            marginBottom: '24px',
            backgroundColor: gig.status === 'PENDING_REVIEW' ? '#FEF5E7' : colors.bgSecondary,
            borderLeft: `4px solid ${statusColor}`,
            borderRadius: borderRadius.lg,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: colors.textPrimary, marginBottom: '4px' }}>
                Status: {gig.status}
              </h3>
              <p style={{ fontSize: '14px', color: colors.textSecondary }}>
                {gig.status === 'PENDING_REVIEW'
                  ? 'This service offer is awaiting your review'
                  : gig.status === 'ACTIVE'
                  ? 'This service offer is live on the platform'
                  : gig.status === 'PAUSED'
                  ? 'This service offer has been paused by the fixer'
                  : 'This service offer is in draft mode'}
              </p>
            </div>
            <GigApprovalActions gigId={gig.id} currentStatus={gig.status} sellerEmail={gig.seller.email || undefined} sellerName={gig.seller.name || undefined} />
          </div>
        </div>

        <div className="admin-gig-detail-grid" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Main Content */}
          <div className="admin-gig-main">
            {/* Basic Information */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: borderRadius.lg,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '20px',
                marginBottom: '24px',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.textPrimary, marginBottom: '20px', paddingBottom: '16px', borderBottom: `2px solid ${colors.border}` }}>
                Service Offer Details
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginBottom: '8px' }}>
                    Title
                  </label>
                  <p style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>{gig.title}</p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginBottom: '8px' }}>
                    Category
                  </label>
                  <p style={{ fontSize: '15px', color: colors.textPrimary }}>
                    {gig.subcategory.category.name} → {gig.subcategory.name}
                  </p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginBottom: '8px' }}>
                    Description
                  </label>
                  <p style={{ fontSize: '15px', color: colors.textPrimary, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                    {gig.description}
                  </p>
                </div>

                {gig.tags.length > 0 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginBottom: '8px' }}>
                      Tags
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {gig.tags.map((tag, index) => (
                        <span
                          key={index}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: colors.primaryLight,
                            color: colors.primaryDark,
                            borderRadius: borderRadius.md,
                            fontSize: '13px',
                            fontWeight: '600',
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {gig.requirements.length > 0 && (
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginBottom: '8px' }}>
                      Requirements from Buyers
                    </label>
                    <ul style={{ fontSize: '15px', color: colors.textPrimary, lineHeight: '1.6', paddingLeft: '20px' }}>
                      {gig.requirements.map((req, index) => (
                        <li key={index}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Packages */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: borderRadius.lg,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '20px',
                marginBottom: '24px',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.textPrimary, marginBottom: '20px', paddingBottom: '16px', borderBottom: `2px solid ${colors.border}` }}>
                Pricing Packages
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {gig.packages.map((pkg, index) => (
                  <div
                    key={pkg.id}
                    style={{
                      border: `2px solid ${index === 0 ? colors.border : index === 1 ? colors.primary : '#F59E0B'}`,
                      borderRadius: borderRadius.lg,
                      padding: '16px',
                      backgroundColor: index === 1 ? colors.primaryLight : colors.white,
                    }}
                  >
                    <h4 style={{ fontSize: '16px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
                      {pkg.name}
                    </h4>
                    <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '12px', minHeight: '40px' }}>
                      {pkg.description}
                    </p>
                    <div style={{ fontSize: '24px', fontWeight: '700', color: colors.primary, marginBottom: '12px' }}>
                      ₦{pkg.price.toLocaleString()}
                    </div>
                    <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '12px' }}>
                      <div style={{ marginBottom: '4px' }}>📅 {pkg.deliveryDays} day delivery</div>
                      <div>🔄 {pkg.revisions} revision{pkg.revisions !== 1 ? 's' : ''}</div>
                    </div>
                    <div style={{ fontSize: '13px', color: colors.textPrimary }}>
                      <strong style={{ display: 'block', marginBottom: '8px' }}>Features:</strong>
                      <ul style={{ paddingLeft: '20px', margin: 0 }}>
                        {pkg.features.map((feature, fIndex) => (
                          <li key={fIndex} style={{ marginBottom: '4px' }}>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="admin-gig-sidebar">
            {/* Fixer Information */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: borderRadius.lg,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '20px',
                marginBottom: '24px',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.textPrimary, marginBottom: '20px', paddingBottom: '16px', borderBottom: `2px solid ${colors.border}` }}>
                Fixer Information
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginBottom: '4px' }}>
                    Name
                  </label>
                  <p style={{ fontSize: '15px', color: colors.textPrimary }}>{gig.seller.name || 'N/A'}</p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginBottom: '4px' }}>
                    Contact
                  </label>
                  <p style={{ fontSize: '15px', color: colors.textPrimary }}>{gig.seller.email || gig.seller.phone}</p>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginBottom: '4px' }}>
                    Status
                  </label>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      fontSize: '12px',
                      borderRadius: borderRadius.md,
                      fontWeight: '600',
                      backgroundColor: gig.seller.status === 'ACTIVE' ? colors.primaryLight : colors.warningLight,
                      color: gig.seller.status === 'ACTIVE' ? colors.primaryDark : colors.warningDark,
                    }}
                  >
                    {gig.seller.status}
                  </span>
                </div>

                {gig.seller.fixerProfile && (
                  <>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginBottom: '4px' }}>
                        Bio
                      </label>
                      <p style={{ fontSize: '14px', color: colors.textPrimary, lineHeight: '1.6' }}>
                        {gig.seller.bio || 'No bio provided'}
                      </p>
                    </div>

                    {gig.seller.fixerProfile?.qualifications && gig.seller.fixerProfile.qualifications.length > 0 && (
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginBottom: '8px' }}>
                          Skills
                        </label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {gig.seller.fixerProfile.qualifications.map((qualification, index) => (
                            <span
                              key={index}
                              style={{
                                padding: '4px 8px',
                                backgroundColor: colors.bgTertiary,
                                color: colors.textPrimary,
                                borderRadius: borderRadius.sm,
                                fontSize: '12px',
                              }}
                            >
                              {qualification}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <Link
                    href={`/admin/users/${gig.seller.id}`}
                    style={{
                      display: 'inline-block',
                      padding: '8px 16px',
                      backgroundColor: colors.bgSecondary,
                      color: colors.primary,
                      borderRadius: borderRadius.md,
                      fontSize: '14px',
                      fontWeight: '600',
                      textDecoration: 'none',
                      textAlign: 'center',
                    }}
                  >
                    View Full Profile
                  </Link>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: borderRadius.lg,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '20px',
                marginBottom: '24px',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.textPrimary, marginBottom: '20px', paddingBottom: '16px', borderBottom: `2px solid ${colors.border}` }}>
                Statistics
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: colors.textSecondary }}>Orders</span>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>{gig.ordersCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: colors.textSecondary }}>Views</span>
                  <span style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>{gig.clicks}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: colors.textSecondary }}>Created</span>
                  <span style={{ fontSize: '14px', color: colors.textPrimary }}>
                    {new Date(gig.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: colors.textSecondary }}>Last Updated</span>
                  <span style={{ fontSize: '14px', color: colors.textPrimary }}>
                    {new Date(gig.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminDashboardWrapper>
  );
}
