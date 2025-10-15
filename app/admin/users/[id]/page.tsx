import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard, DashboardButton } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';
import { FixerActionButtons } from './FixerActionButtons';

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

  const isApproved = user.status === 'ACTIVE';
  const isRejected = user.status === 'REJECTED';
  const isPending = user.status === 'PENDING';

  return (
    <DashboardLayoutWithHeader
      title="Review Fixer Application"
      actions={
        <Link href="/admin/dashboard">
          <DashboardButton variant="outline">
            ← Back to Dashboard
          </DashboardButton>
        </Link>
      }
    >
        {/* Success/Error Messages */}
        {success === 'approved' && (
          <DashboardCard style={{ marginBottom: '24px', padding: '20px', backgroundColor: colors.primaryLight, border: `1px solid ${colors.primary}` }}>
            <p style={{ fontSize: '15px', color: colors.primaryDark, fontWeight: '600', margin: 0 }}>
              ✓ Fixer has been successfully approved!
            </p>
          </DashboardCard>
        )}
        {success === 'rejected' && (
          <DashboardCard style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#FDEDEC', border: `1px solid ${colors.error}` }}>
            <p style={{ fontSize: '15px', color: '#922B21', fontWeight: '600', margin: 0 }}>
              Application has been rejected.
            </p>
          </DashboardCard>
        )}
        {error && (
          <DashboardCard style={{ marginBottom: '24px', padding: '20px', backgroundColor: '#FDEDEC', border: `1px solid ${colors.error}` }}>
            <p style={{ fontSize: '15px', color: '#922B21', fontWeight: '600', margin: 0 }}>
              ✗ Error: {error === 'invalid_request' ? 'Invalid request' : error === 'processing_failed' ? 'Failed to process approval' : 'An error occurred'}
            </p>
          </DashboardCard>
        )}

        {/* Status Banner */}
        <DashboardCard style={{ marginBottom: '32px', padding: '20px', borderLeft: `4px solid ${isApproved ? colors.success : isRejected ? colors.error : colors.warning}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Application Status</p>
              <p style={{ fontSize: '20px', fontWeight: '700', color: isApproved ? colors.success : isRejected ? colors.error : colors.warning }}>
                {user.status}
              </p>
            </div>
            {user.fixerProfile?.pendingChanges && (
              <span style={{ padding: '8px 16px', backgroundColor: '#FEF5E7', color: '#95620D', borderRadius: borderRadius.lg, fontSize: '14px', fontWeight: '600' }}>
                Pending Review
              </span>
            )}
          </div>
        </DashboardCard>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
          {/* Left Column - Profile Details */}
          <div>
            {/* Basic Info */}
            <DashboardCard>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '24px' }}>
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
            </DashboardCard>

            {/* Qualifications */}
            {user.fixerProfile?.qualifications && user.fixerProfile.qualifications.length > 0 && (
              <DashboardCard style={{ marginTop: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px' }}>
                  Qualifications
                </h2>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {user.fixerProfile.qualifications.map((qual, index) => (
                    <li key={index} style={{ fontSize: '15px', color: colors.textPrimary, marginBottom: '8px' }}>
                      {qual}
                    </li>
                  ))}
                </ul>
              </DashboardCard>
            )}

            {/* Location */}
            <DashboardCard style={{ marginTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px' }}>
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
            </DashboardCard>

            {/* Contact Info */}
            <DashboardCard style={{ marginTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px' }}>
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
            </DashboardCard>

            {/* Services */}
            <DashboardCard style={{ marginTop: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px' }}>
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
            </DashboardCard>
          </div>

          {/* Right Column - Actions */}
          <div>
            <DashboardCard>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '24px' }}>
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
            </DashboardCard>
          </div>
        </div>
    </DashboardLayoutWithHeader>
  );
}
