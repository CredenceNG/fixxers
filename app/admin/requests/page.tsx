import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors, borderRadius } from '@/lib/theme';

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const user = await getCurrentUser();
  const roles = user?.roles || [];

  if (!user || !roles.includes('ADMIN')) {
    redirect('/auth/login');
  }

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
      APPROVED: { bg: '#D5F5E3', color: '#186A3B' },
      QUOTED: { bg: '#E8F4F8', color: '#2952A3' },
      ACCEPTED: { bg: colors.primaryLight, color: colors.primaryDark },
      CANCELLED: { bg: '#FDEDEC', color: '#922B21' },
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
    <AdminDashboardWrapper
      userName={user.name || undefined}
      userAvatar={user.profileImage || undefined}
      pendingBadgeRequests={pendingBadgeRequests}
      pendingAgentApplications={pendingAgentApplications}
      pendingReports={pendingReports}
    >
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
          Service Requests
        </h1>
        <p style={{ fontSize: '14px', color: colors.textSecondary }}>
          Review and manage client service requests
        </p>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: borderRadius.lg,
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
            Pending
          </p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: '#ffc107' }}>
            {pendingRequests.length}
          </p>
        </div>
        <div style={{
          backgroundColor: 'white',
          borderRadius: borderRadius.lg,
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
            Active
          </p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: colors.primary }}>
            {activeRequests.length}
          </p>
        </div>
        <div style={{
          backgroundColor: 'white',
          borderRadius: borderRadius.lg,
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
            Completed
          </p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: '#28a745' }}>
            {completedRequests.length}
          </p>
        </div>
        <div style={{
          backgroundColor: 'white',
          borderRadius: borderRadius.lg,
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
            Total
          </p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary }}>
            {serviceRequests.length}
          </p>
        </div>
      </div>

      {/* Service Requests Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: borderRadius.lg,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '24px',
      }}>
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
                      <Link
                        href={`/admin/requests/${request.id}`}
                        style={{
                          padding: '8px 16px',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: colors.primary,
                          backgroundColor: colors.primaryLight,
                          border: `1px solid ${colors.primary}`,
                          borderRadius: borderRadius.md,
                          textDecoration: 'none',
                          display: 'inline-block',
                        }}
                      >
                        View Details
                      </Link>
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
      </div>
    </AdminDashboardWrapper>
  );
}
