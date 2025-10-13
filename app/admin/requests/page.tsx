import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';
import { ApproveRejectButtons } from './ApproveRejectButtons';

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/auth/login');
  }

  // Pagination setup
  const resolvedParams = await searchParams;
  const currentPage = Number(resolvedParams.page) || 1;
  const itemsPerPage = 5;
  const skip = (currentPage - 1) * itemsPerPage;

  // Get total count
  const totalCount = await prisma.serviceRequest.count();
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Fetch paginated service requests
  const serviceRequests = await prisma.serviceRequest.findMany({
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      subcategory: {
        include: {
          category: true,
        },
      },
      quotes: {
        include: {
          fixer: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    take: itemsPerPage,
    skip: skip,
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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
          padding: '6px 12px',
          fontSize: '13px',
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

  const pendingRequests = serviceRequests.filter(r => r.status === 'PENDING');
  const activeRequests = serviceRequests.filter(r => ['APPROVED', 'QUOTED'].includes(r.status));
  const completedRequests = serviceRequests.filter(r => ['ACCEPTED', 'CANCELLED'].includes(r.status));

  return (
    <DashboardLayoutWithHeader
      title="Service Requests"
      subtitle="Review and manage client service requests"
    >
      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <DashboardCard padding="24px">
          <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
            Pending
          </p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: colors.warning }}>
            {pendingRequests.length}
          </p>
        </DashboardCard>
        <DashboardCard padding="24px">
          <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
            Active
          </p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: colors.primary }}>
            {activeRequests.length}
          </p>
        </DashboardCard>
        <DashboardCard padding="24px">
          <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
            Completed
          </p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: colors.success }}>
            {completedRequests.length}
          </p>
        </DashboardCard>
        <DashboardCard padding="24px">
          <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
            Total
          </p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary }}>
            {serviceRequests.length}
          </p>
        </DashboardCard>
      </div>

      {/* Service Requests Table */}
      <DashboardCard>
        {serviceRequests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No service requests</p>
            <p style={{ fontSize: '14px' }}>Service requests will appear here</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Request ID
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Title
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Client
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Category
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Status
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Quotes
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Created
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {serviceRequests.map((request) => (
                  <tr key={request.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '12px', fontSize: '14px', color: colors.textPrimary }}>
                      #{request.id.slice(-8).toUpperCase()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: colors.textPrimary, maxWidth: '250px' }}>
                      <div style={{ fontWeight: '500' }}>{request.title}</div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {request.description}
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: colors.textPrimary }}>
                      <div>{request.client.name || 'Anonymous'}</div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary }}>{request.client.email || request.client.phone}</div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: colors.textSecondary }}>
                      <div>{request.subcategory.category.name}</div>
                      <div style={{ fontSize: '13px' }}>{request.subcategory.name}</div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {getStatusBadge(request.status)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: colors.textPrimary }}>
                      {request.quotes.length}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: colors.textSecondary }}>
                      {formatDate(request.createdAt)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <ApproveRejectButtons
                        requestId={request.id}
                        status={request.status}
                        clientName={request.client.name || 'Client'}
                        adminApproved={request.adminApproved}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div style={{
            marginTop: '24px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            padding: '16px'
          }}>
            {/* Previous Button */}
            {currentPage > 1 ? (
              <Link
                href={`/admin/requests?page=${currentPage - 1}`}
                style={{
                  padding: '8px 16px',
                  backgroundColor: colors.primary,
                  color: 'white',
                  borderRadius: borderRadius.md,
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                ← Previous
              </Link>
            ) : (
              <span style={{
                padding: '8px 16px',
                backgroundColor: colors.border,
                color: colors.textSecondary,
                borderRadius: borderRadius.md,
                fontSize: '14px',
                fontWeight: '500',
              }}>
                ← Previous
              </span>
            )}

            {/* Page Info */}
            <span style={{
              fontSize: '14px',
              color: colors.textPrimary,
              fontWeight: '500',
              minWidth: '100px',
              textAlign: 'center'
            }}>
              Page {currentPage} of {totalPages}
            </span>

            {/* Next Button */}
            {currentPage < totalPages ? (
              <Link
                href={`/admin/requests?page=${currentPage + 1}`}
                style={{
                  padding: '8px 16px',
                  backgroundColor: colors.primary,
                  color: 'white',
                  borderRadius: borderRadius.md,
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Next →
              </Link>
            ) : (
              <span style={{
                padding: '8px 16px',
                backgroundColor: colors.border,
                color: colors.textSecondary,
                borderRadius: borderRadius.md,
                fontSize: '14px',
                fontWeight: '500',
              }}>
                Next →
              </span>
            )}
          </div>
        )}
      </DashboardCard>
    </DashboardLayoutWithHeader>
  );
}
