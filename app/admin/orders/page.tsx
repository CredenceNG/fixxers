import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors, borderRadius } from '@/lib/theme';

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
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
  const statusFilter = resolvedParams.status;
  const itemsPerPage = 10;
  const skip = (currentPage - 1) * itemsPerPage;

  // Build where filter
  const whereFilter = statusFilter ? { status: statusFilter as any } : {};

  // Get total count
  const totalCount = await prisma.order.count({ where: whereFilter });
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Fetch paginated orders
  const orders = await prisma.order.findMany({
    where: whereFilter,
    include: {
      client: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      fixer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      gig: {
        select: {
          title: true,
        },
      },
      request: {
        select: {
          title: true,
        },
      },
      payment: {
        select: {
          status: true,
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
    });
  };

  const formatAmount = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, any> = {
      PENDING: { bg: '#FEF5E7', color: '#95620D' },
      PAID_PARTIAL: { bg: '#FFF3CD', color: '#856404' },
      PAID: { bg: '#E8F4F8', color: '#2952A3' },
      IN_PROGRESS: { bg: colors.primaryLight, color: colors.primaryDark },
      COMPLETED: { bg: '#D5F5E3', color: '#186A3B' },
      SETTLED: { bg: '#D5F5E3', color: '#186A3B' },
      CANCELLED: { bg: '#FDEDEC', color: '#922B21' },
      DISPUTED: { bg: '#F8D7DA', color: '#721C24' },
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
        {status.replace(/_/g, ' ')}
      </span>
    );
  };

  // Calculate stats
  const stats = {
    total: await prisma.order.count(),
    pending: await prisma.order.count({ where: { status: 'PENDING' } }),
    paid: await prisma.order.count({ where: { status: 'PAID' } }),
    inProgress: await prisma.order.count({ where: { status: 'IN_PROGRESS' } }),
    completed: await prisma.order.count({ where: { status: 'COMPLETED' } }),
    settled: await prisma.order.count({ where: { status: 'SETTLED' } }),
  };

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
          Orders Management
        </h1>
        <p style={{ fontSize: '14px', color: colors.textSecondary }}>
          View and manage all platform orders
        </p>
      </div>

      {/* Summary Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <Link href="/admin/orders" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: borderRadius.lg,
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            cursor: 'pointer',
          }}>
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Total Orders
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary }}>
              {stats.total}
            </p>
          </div>
        </Link>

        <Link href="/admin/orders?status=PENDING" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: borderRadius.lg,
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            cursor: 'pointer',
          }}>
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Pending
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#ffc107' }}>
              {stats.pending}
            </p>
          </div>
        </Link>

        <Link href="/admin/orders?status=IN_PROGRESS" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: borderRadius.lg,
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            cursor: 'pointer',
          }}>
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              In Progress
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: colors.primary }}>
              {stats.inProgress}
            </p>
          </div>
        </Link>

        <Link href="/admin/orders?status=COMPLETED" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: borderRadius.lg,
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            cursor: 'pointer',
          }}>
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Completed
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#28a745' }}>
              {stats.completed}
            </p>
          </div>
        </Link>

        <Link href="/admin/orders?status=SETTLED" style={{ textDecoration: 'none' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: borderRadius.lg,
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            cursor: 'pointer',
          }}>
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Settled
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#28a745' }}>
              {stats.settled}
            </p>
          </div>
        </Link>
      </div>

      {/* Orders Table */}
      <div style={{
        backgroundColor: 'white',
        borderRadius: borderRadius.lg,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '24px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary }}>
            {statusFilter ? `${statusFilter.replace(/_/g, ' ')} Orders` : 'All Orders'}
          </h2>
          {statusFilter && (
            <Link
              href="/admin/orders"
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                color: colors.primary,
                textDecoration: 'none',
              }}
            >
              Clear Filter
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No orders found</p>
            <p style={{ fontSize: '14px' }}>Orders will appear here</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Actions
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Order ID
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Service
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Client
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Fixer
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Amount
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Status
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <Link
                        href={`/admin/orders/${order.id}`}
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
                        View
                      </Link>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: colors.textPrimary, fontFamily: 'monospace' }}>
                      #{order.id.slice(-8).toUpperCase()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: colors.textPrimary, maxWidth: '200px' }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.gig?.title || order.request?.title || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: colors.textPrimary }}>
                      <div>{order.client.name || 'Anonymous'}</div>
                      <div style={{ fontSize: '12px', color: colors.textSecondary }}>{order.client.email}</div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: colors.textPrimary }}>
                      <div>{order.fixer.name || 'N/A'}</div>
                      <div style={{ fontSize: '12px', color: colors.textSecondary }}>{order.fixer.email}</div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: colors.textPrimary, fontWeight: '600' }}>
                      {formatAmount(Number(order.totalAmount))}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px' }}>
                      {getStatusBadge(order.status)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: colors.textSecondary }}>
                      {formatDate(order.createdAt)}
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
                href={`/admin/orders?page=${currentPage - 1}${statusFilter ? `&status=${statusFilter}` : ''}`}
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
                href={`/admin/orders?page=${currentPage + 1}${statusFilter ? `&status=${statusFilter}` : ''}`}
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
