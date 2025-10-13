import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard, DashboardButton } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';
import { GigApprovalActions } from './GigApprovalActions';

export default async function AdminGigReviewPage({ params }: { params: Promise<{ gigId: string }> }) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/auth/login');
  }

  const { gigId } = await params;

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
    <DashboardLayoutWithHeader
      title="Review Service Offer"
      subtitle={`Review and approve service offer from ${gig.seller.name || gig.seller.email}`}
      actions={
        <Link href="/admin/dashboard">
          <DashboardButton variant="outline">← Back to Dashboard</DashboardButton>
        </Link>
      }
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Status Banner */}
        <DashboardCard
          style={{
            marginBottom: '24px',
            backgroundColor:
              gig.status === 'PENDING_REVIEW' ? '#FEF5E7' : colors.bgSecondary,
            borderLeft: `4px solid ${statusColor}`,
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
            <GigApprovalActions gigId={gig.id} currentStatus={gig.status} />
          </div>
        </DashboardCard>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
          {/* Main Content */}
          <div>
            {/* Basic Information */}
            <DashboardCard title="Service Offer Details" style={{ marginBottom: '24px' }}>
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
            </DashboardCard>

            {/* Packages */}
            <DashboardCard title="Pricing Packages" style={{ marginBottom: '24px' }}>
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
            </DashboardCard>
          </div>

          {/* Sidebar */}
          <div>
            {/* Fixer Information */}
            <DashboardCard title="Fixer Information" style={{ marginBottom: '24px' }}>
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
            </DashboardCard>

            {/* Statistics */}
            <DashboardCard title="Statistics" style={{ marginBottom: '24px' }}>
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
            </DashboardCard>
          </div>
        </div>
      </div>
    </DashboardLayoutWithHeader>
  );
}
