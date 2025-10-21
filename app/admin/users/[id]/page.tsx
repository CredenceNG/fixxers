import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors, borderRadius } from '@/lib/theme';
import { FixerActionButtons } from './FixerActionButtons';
import { InternalMessaging } from './InternalMessaging';

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ success?: string; error?: string }>;
}

export default async function AdminUserReviewPage({ params, searchParams }: PageProps) {
  const currentUser = await getCurrentUser();
  const roles = currentUser?.roles || [];

  if (!currentUser || !roles.includes('ADMIN')) {
    redirect('/auth/login');
  }

  const { id } = await params;
  const { success, error } = await searchParams;

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

  // Fetch user with profile and services
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      fixerProfile: true,
      fixerServices: {
        include: {
          subcategory: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return <div>User not found</div>;
  }

  const hasPendingChanges = !!user.fixerProfile?.pendingChanges;
  const isApproved = user.status === 'ACTIVE' && !hasPendingChanges;
  const isRejected = user.status === 'REJECTED';
  const isPending = user.status === 'PENDING' || hasPendingChanges;
  const isReReview = (user.status === 'PENDING' && !!user.fixerProfile?.approvedAt) || hasPendingChanges;

  return (
    <AdminDashboardWrapper
      userName={currentUser.name || undefined}
      userAvatar={currentUser.profileImage || undefined}
      pendingBadgeRequests={pendingBadgeRequests}
      pendingAgentApplications={pendingAgentApplications}
      pendingReports={pendingReports}
    >
      {/* Page Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
            Review Fixer Application
          </h1>
          <p style={{ fontSize: '14px', color: colors.textSecondary }}>
            {user.name || user.email}
          </p>
        </div>
        <Link
          href="/admin/users"
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
          ← Back to Users
        </Link>
      </div>

      {/* Success/Error Messages */}
      {success === 'approved' && (
        <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: colors.primaryLight, border: `1px solid ${colors.primary}`, borderRadius: borderRadius.lg }}>
          <p style={{ fontSize: '15px', color: colors.primaryDark, fontWeight: '600', margin: 0 }}>
            ✓ Fixer has been successfully approved!
          </p>
        </div>
      )}
      {success === 'rejected' && (
        <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#FDEDEC', border: `1px solid ${colors.error}`, borderRadius: borderRadius.lg }}>
          <p style={{ fontSize: '15px', color: '#922B21', fontWeight: '600', margin: 0 }}>
            Application has been rejected.
          </p>
        </div>
      )}
      {error && (
        <div style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#FDEDEC', border: `1px solid ${colors.error}`, borderRadius: borderRadius.lg }}>
          <p style={{ fontSize: '15px', color: '#922B21', fontWeight: '600', margin: 0 }}>
            ✗ Error: {error === 'invalid_request' ? 'Invalid request' : error === 'processing_failed' ? 'Failed to process approval' : 'An error occurred'}
          </p>
        </div>
      )}

      {/* Status Banner */}
      <div style={{ marginBottom: '32px', padding: '20px', backgroundColor: 'white', borderRadius: borderRadius.lg, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderLeft: `4px solid ${isApproved ? colors.success : isRejected ? colors.error : colors.warning}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Application Status</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: isApproved ? colors.success : isRejected ? colors.error : colors.warning }}>
                {isReReview ? 'PENDING RE-REVIEW' : user.status}
              </p>
              {isReReview && (
                <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
                  Fixer has updated their profile after approval
                </p>
              )}
            </div>
            {user.fixerProfile?.pendingChanges && (
              <span style={{ padding: '8px 16px', backgroundColor: '#FEF5E7', color: '#95620D', borderRadius: borderRadius.lg, fontSize: '14px', fontWeight: '600' }}>
                {isReReview ? 'Re-Review Required' : 'Pending Review'}
              </span>
            )}
          </div>
        </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }} className="admin-user-detail-grid">
        {/* Left Column - Profile Details */}
        <div className="admin-user-detail-left" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Basic Info */}
          <div style={{ backgroundColor: 'white', borderRadius: borderRadius.lg, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '24px', paddingBottom: '16px', borderBottom: `2px solid ${colors.border}` }}>
              Basic Information
            </h2>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                    Full Name
                  </label>
                  <p style={{ fontSize: '15px', color: colors.textPrimary }}>{user.name || 'Not provided'}</p>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                    Contact
                  </label>
                  <p style={{ fontSize: '15px', color: colors.textPrimary }}>{user.email || user.phone}</p>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                    Years of Service
                  </label>
                  <p style={{ fontSize: '15px', color: colors.textPrimary }}>{user.fixerProfile?.yearsOfService || 'Not provided'} years</p>
                </div>
              </div>
            </div>

          {/* Qualifications */}
          {user.fixerProfile?.qualifications && user.fixerProfile.qualifications.length > 0 && (
            <div style={{ marginTop: '24px', backgroundColor: 'white', borderRadius: borderRadius.lg, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px', paddingBottom: '16px', borderBottom: `2px solid ${colors.border}` }}>
                Qualifications
              </h2>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {user.fixerProfile.qualifications.map((qual, index) => (
                    <li key={index} style={{ fontSize: '15px', color: colors.textPrimary, marginBottom: '8px' }}>
                      {qual}
                    </li>
                  ))}
                </ul>
              </div>
            )}

          {/* Location */}
          <div style={{ marginTop: '24px', backgroundColor: 'white', borderRadius: borderRadius.lg, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px', paddingBottom: '16px', borderBottom: `2px solid ${colors.border}` }}>
              Service Location
            </h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                    Neighbourhood
                  </label>
                  <p style={{ fontSize: '15px', color: colors.textPrimary }}>{user.fixerProfile?.neighbourhood}</p>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                    City
                  </label>
                  <p style={{ fontSize: '15px', color: colors.textPrimary }}>{user.fixerProfile?.city}</p>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                    State/Province
                  </label>
                  <p style={{ fontSize: '15px', color: colors.textPrimary }}>{user.fixerProfile?.state}</p>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                    Country
                  </label>
                  <p style={{ fontSize: '15px', color: colors.textPrimary }}>{user.fixerProfile?.country}</p>
                </div>
              </div>
            </div>

          {/* Contact Info */}
          <div style={{ marginTop: '24px', backgroundColor: 'white', borderRadius: borderRadius.lg, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px', paddingBottom: '16px', borderBottom: `2px solid ${colors.border}` }}>
              Contact Information
            </h2>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                    Primary Phone
                  </label>
                  <p style={{ fontSize: '15px', color: colors.textPrimary }}>{user.fixerProfile?.primaryPhone}</p>
                </div>
                {user.fixerProfile?.secondaryPhone && (
                  <div>
                    <label style={{ fontSize: '13px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                      Secondary Phone
                    </label>
                    <p style={{ fontSize: '15px', color: colors.textPrimary }}>{user.fixerProfile.secondaryPhone}</p>
                  </div>
                )}
              </div>
            </div>

          {/* Services */}
          <div style={{ marginTop: '24px', backgroundColor: 'white', borderRadius: borderRadius.lg, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px', paddingBottom: '16px', borderBottom: `2px solid ${colors.border}` }}>
              Service Categories
            </h2>
              {user.fixerServices.length === 0 ? (
                <p style={{ fontSize: '15px', color: colors.textSecondary }}>No services added yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {user.fixerServices.reduce((acc: any[], service) => {
                    const categoryName = service.subcategory.category.name;
                    const existingCategory = acc.find(c => c.name === categoryName);
                    if (existingCategory) {
                      existingCategory.services.push(service.subcategory.name);
                    } else {
                      acc.push({ name: categoryName, services: [service.subcategory.name] });
                    }
                    return acc;
                  }, []).map((category, index) => (
                    <div key={index} style={{ padding: '16px', backgroundColor: '#F3F4F6', borderRadius: '12px' }}>
                      <p style={{ fontSize: '14px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
                        {category.name}
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                        {category.services.map((service: string, idx: number) => (
                          <span key={idx} style={{ padding: '4px 12px', backgroundColor: 'white', borderRadius: '8px', fontSize: '13px', color: colors.textSecondary }}>
                            {service}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          {/* Internal Messaging */}
          {user.email && (
            <InternalMessaging
              userId={user.id}
              userEmail={user.email}
              userName={user.name || 'User'}
            />
          )}
          </div>

        {/* Right Column - Actions */}
        <div className="admin-user-detail-right">
          <div style={{ backgroundColor: 'white', borderRadius: borderRadius.lg, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '24px', paddingBottom: '16px', borderBottom: `2px solid ${colors.border}` }}>
              Actions
            </h2>

              <FixerActionButtons
                fixerId={user.id}
                fixerName={user.name || 'Fixer'}
                fixerEmail={user.email}
                status={user.status}
                hasPendingChanges={user.fixerProfile?.pendingChanges || false}
                wasApproved={!!user.fixerProfile?.approvedAt}
              />

              <div style={{ marginTop: '24px', padding: '16px', backgroundColor: colors.gray100, borderRadius: borderRadius.lg }}>
                <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px' }}>Application Date</p>
                <p style={{ fontSize: '14px', color: colors.textPrimary, fontWeight: '600' }}>
                  {new Date(user.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>

              {user.fixerProfile?.approvedAt && (
                <div style={{ marginTop: '12px', padding: '16px', backgroundColor: colors.gray100, borderRadius: borderRadius.lg }}>
                  <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px' }}>Last Approved</p>
                  <p style={{ fontSize: '14px', color: colors.textPrimary, fontWeight: '600' }}>
                    {new Date(user.fixerProfile.approvedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
    </AdminDashboardWrapper>
  );
}
