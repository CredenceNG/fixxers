import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard, DashboardButton } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';
import { RequestActionButtons } from './RequestActionButtons';

export default async function AdminRequestDetailPage({
  params,
}: {
  params: Promise<{ requestId: string }>;
}) {
  const user = await getCurrentUser();
  const roles = user?.roles || [];

  if (!user || !roles.includes('ADMIN')) {
    redirect('/auth/login');
  }

  const { requestId } = await params;

  // Fetch the service request
  const request = await prisma.serviceRequest.findUnique({
    where: { id: requestId },
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profileImage: true,
        },
      },
      subcategory: {
        include: {
          category: true,
        },
      },
      neighborhood: true,
      quotes: {
        include: {
          fixer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!request) {
    notFound();
  }

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, any> = {
      PENDING: { bg: '#FEF5E7', color: '#95620D' },
      APPROVED: { bg: colors.successLight, color: colors.success },
      QUOTED: { bg: '#E8F4F8', color: '#2952A3' },
      ACCEPTED: { bg: colors.primaryLight, color: colors.primaryDark },
      CANCELLED: { bg: colors.errorLight, color: colors.error },
    };

    const style = styles[status] || styles.PENDING;

    return (
      <span
        style={{
          padding: '8px 16px',
          fontSize: '14px',
          borderRadius: borderRadius.md,
          fontWeight: '600',
          backgroundColor: style.bg,
          color: style.color,
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <DashboardLayoutWithHeader
      title={`Request #${request.id.slice(-8).toUpperCase()}`}
      subtitle="Review and manage service request"
      actions={
        <Link href="/admin/requests">
          <DashboardButton variant="outline">← Back to Requests</DashboardButton>
        </Link>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Request Status and Actions */}
          <DashboardCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
                  Request Status
                </h3>
                {getStatusBadge(request.status)}
              </div>
            </div>

            {/* Admin Actions */}
            <RequestActionButtons
              requestId={request.id}
              status={request.status}
              clientEmail={request.client.email || ''}
              clientName={request.client.name || 'Client'}
              adminApproved={request.adminApproved}
            />
          </DashboardCard>

          {/* Request Details */}
          <DashboardCard title="Request Details">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px', fontWeight: '600' }}>
                  Title
                </div>
                <div style={{ fontSize: '16px', color: colors.textPrimary, fontWeight: '500' }}>
                  {request.title}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px', fontWeight: '600' }}>
                  Description
                </div>
                <div style={{ fontSize: '15px', color: colors.textPrimary, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                  {request.description}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div>
                  <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px', fontWeight: '600' }}>
                    Category
                  </div>
                  <div style={{ fontSize: '15px', color: colors.textPrimary }}>
                    {request.subcategory.category.name}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px', fontWeight: '600' }}>
                    Subcategory
                  </div>
                  <div style={{ fontSize: '15px', color: colors.textPrimary }}>
                    {request.subcategory.name}
                  </div>
                </div>
              </div>

              <div>
                <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px', fontWeight: '600' }}>
                  Location
                </div>
                <div style={{ fontSize: '15px', color: colors.textPrimary }}>
                  {request.neighborhood.name}, {request.neighborhood.city}, {request.neighborhood.state}
                </div>
                {request.address && (
                  <div style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '4px' }}>
                    {request.address}
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {request.urgency && (
                  <div>
                    <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px', fontWeight: '600' }}>
                      Urgency
                    </div>
                    <div style={{ fontSize: '15px', color: colors.textPrimary, textTransform: 'capitalize' }}>
                      {request.urgency.replace('_', ' ')}
                    </div>
                  </div>
                )}

                {request.preferredDate && (
                  <div>
                    <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px', fontWeight: '600' }}>
                      Preferred Date
                    </div>
                    <div style={{ fontSize: '15px', color: colors.textPrimary }}>
                      {new Date(request.preferredDate).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px', fontWeight: '600' }}>
                  Created
                </div>
                <div style={{ fontSize: '15px', color: colors.textPrimary }}>
                  {formatDate(request.createdAt)}
                </div>
              </div>
            </div>
          </DashboardCard>

          {/* Quotes */}
          {request.quotes.length > 0 && (
            <DashboardCard title={`Quotes (${request.quotes.length})`}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {request.quotes.map((quote) => (
                  <div
                    key={quote.id}
                    style={{
                      padding: '16px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: borderRadius.md,
                      backgroundColor: colors.bgSecondary,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
                          {quote.fixer.name || 'Anonymous Fixer'}
                        </div>
                        <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '2px' }}>
                          {quote.fixer.email || quote.fixer.phone}
                        </div>
                      </div>
                      <div style={{ fontSize: '18px', fontWeight: '700', color: colors.primary }}>
                        ₦{quote.totalAmount.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ fontSize: '14px', color: colors.textPrimary, lineHeight: '1.5' }}>
                      {quote.description}
                    </div>
                    <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '8px' }}>
                      Submitted: {formatDate(quote.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            </DashboardCard>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Client Info */}
          <DashboardCard title="Client Information">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: colors.bgTertiary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: '600',
                  color: colors.textSecondary,
                }}
              >
                {request.client.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                  {request.client.name || 'Anonymous'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {request.client.email && (
                <div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '2px' }}>Email</div>
                  <div style={{ fontSize: '14px', color: colors.textPrimary }}>{request.client.email}</div>
                </div>
              )}
              {request.client.phone && (
                <div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '2px' }}>Phone</div>
                  <div style={{ fontSize: '14px', color: colors.textPrimary }}>{request.client.phone}</div>
                </div>
              )}
            </div>
          </DashboardCard>

          {/* Admin Info */}
          {request.adminApproved && (
            <DashboardCard title="Admin Review">
              <div style={{ fontSize: '14px', color: colors.success, fontWeight: '500' }}>
                ✓ Approved
              </div>
            </DashboardCard>
          )}
        </div>
      </div>
    </DashboardLayoutWithHeader>
  );
}
