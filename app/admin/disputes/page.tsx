import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors, borderRadius } from '@/lib/theme';

interface PageProps {
  searchParams: Promise<{ status?: string; page?: string }>;
}

export default async function AdminDisputesPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  const roles = user?.roles || [];

  if (!user || !roles.includes('ADMIN')) {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const statusFilter = params.status || '';
  const currentPage = parseInt(params.page || '1', 10);
  const perPage = 10;
  const skip = (currentPage - 1) * perPage;

  // Fetch pending counts for sidebar
  const prismaAny = prisma as any;
  const [pendingBadgeRequests, pendingAgentApplications, pendingReports] = await Promise.all([
    prismaAny.badgeRequest?.count({
      where: { status: { in: ['PENDING', 'PAYMENT_RECEIVED', 'UNDER_REVIEW'] } },
    }) ?? 0,
    prismaAny.agent?.count({
      where: { status: 'PENDING' },
    }) ?? 0,
    prismaAny.reviewReport?.count({
      where: { status: { in: ['PENDING', 'REVIEWING'] } },
    }) ?? 0,
  ]);

  // Build where clause
  const whereClause: any = {};
  if (statusFilter) {
    whereClause.status = statusFilter;
  }

  // Fetch disputes
  const [disputes, totalCount] = await Promise.all([
    prisma.dispute.findMany({
      where: whereClause,
      include: {
        initiatedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        order: {
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
          },
        },
        resolvedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: perPage,
    }),
    prisma.dispute.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / perPage);

  // Get status counts
  const [openCount, underReviewCount, resolvedCount, closedCount, escalatedCount] = await Promise.all([
    prisma.dispute.count({ where: { status: 'OPEN' } }),
    prisma.dispute.count({ where: { status: 'UNDER_REVIEW' } }),
    prisma.dispute.count({ where: { status: 'RESOLVED' } }),
    prisma.dispute.count({ where: { status: 'CLOSED' } }),
    prisma.dispute.count({ where: { status: 'ESCALATED' } }),
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return { bg: colors.warningLight, text: colors.warningDark, border: colors.warning };
      case 'UNDER_REVIEW':
        return { bg: '#E8F4FD', text: '#1565C0', border: '#2196F3' };
      case 'RESOLVED':
        return { bg: colors.successLight, text: colors.successDark, border: colors.success };
      case 'CLOSED':
        return { bg: colors.bgSecondary, text: colors.textSecondary, border: colors.border };
      case 'ESCALATED':
        return { bg: colors.errorLight, text: colors.errorDark, border: colors.error };
      default:
        return { bg: colors.bgSecondary, text: colors.textSecondary, border: colors.border };
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      QUALITY_ISSUES: 'Quality Issues',
      INCOMPLETE_WORK: 'Incomplete Work',
      OVERCHARGING: 'Overcharging',
      PAYMENT_DISPUTE: 'Payment Dispute',
      TIMELINE_ISSUES: 'Timeline Issues',
      COMMUNICATION_ISSUES: 'Communication',
      SCOPE_DISAGREEMENT: 'Scope Disagreement',
      OTHER: 'Other',
    };
    return labels[reason] || reason;
  };

  return (
    <AdminDashboardWrapper
      userName={user.name || undefined}
      userAvatar={user.profileImage || undefined}
      pendingBadgeRequests={pendingBadgeRequests}
      pendingAgentApplications={pendingAgentApplications}
      pendingReports={pendingReports}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
          Dispute Resolution
        </h1>
        <p style={{ fontSize: '16px', color: colors.textLight }}>
          Manage and resolve disputes between clients and fixers
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{
          backgroundColor: colors.white,
          padding: '20px',
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.border}`,
          borderLeft: `4px solid ${colors.warning}`,
        }}>
          <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
            Open Disputes
          </p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: colors.warning }}>
            {openCount}
          </p>
        </div>

        <div style={{
          backgroundColor: colors.white,
          padding: '20px',
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.border}`,
          borderLeft: `4px solid #2196F3`,
        }}>
          <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
            Under Review
          </p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: '#2196F3' }}>
            {underReviewCount}
          </p>
        </div>

        <div style={{
          backgroundColor: colors.white,
          padding: '20px',
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.border}`,
          borderLeft: `4px solid ${colors.error}`,
        }}>
          <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
            Escalated
          </p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: colors.error }}>
            {escalatedCount}
          </p>
        </div>

        <div style={{
          backgroundColor: colors.white,
          padding: '20px',
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.border}`,
          borderLeft: `4px solid ${colors.success}`,
        }}>
          <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
            Resolved
          </p>
          <p style={{ fontSize: '32px', fontWeight: '700', color: colors.success }}>
            {resolvedCount}
          </p>
        </div>
      </div>

      {/* Status Filter */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link
          href="/admin/disputes"
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            color: !statusFilter ? colors.white : colors.textPrimary,
            backgroundColor: !statusFilter ? colors.primary : colors.white,
            border: `2px solid ${!statusFilter ? colors.primary : colors.border}`,
            borderRadius: borderRadius.md,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          All Statuses
        </Link>
        <Link
          href="/admin/disputes?status=OPEN"
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            color: statusFilter === 'OPEN' ? colors.white : colors.textPrimary,
            backgroundColor: statusFilter === 'OPEN' ? colors.warning : colors.white,
            border: `2px solid ${statusFilter === 'OPEN' ? colors.warning : colors.border}`,
            borderRadius: borderRadius.md,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Open ({openCount})
        </Link>
        <Link
          href="/admin/disputes?status=UNDER_REVIEW"
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            color: statusFilter === 'UNDER_REVIEW' ? colors.white : colors.textPrimary,
            backgroundColor: statusFilter === 'UNDER_REVIEW' ? '#2196F3' : colors.white,
            border: `2px solid ${statusFilter === 'UNDER_REVIEW' ? '#2196F3' : colors.border}`,
            borderRadius: borderRadius.md,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Under Review ({underReviewCount})
        </Link>
        <Link
          href="/admin/disputes?status=ESCALATED"
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            color: statusFilter === 'ESCALATED' ? colors.white : colors.textPrimary,
            backgroundColor: statusFilter === 'ESCALATED' ? colors.error : colors.white,
            border: `2px solid ${statusFilter === 'ESCALATED' ? colors.error : colors.border}`,
            borderRadius: borderRadius.md,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Escalated ({escalatedCount})
        </Link>
        <Link
          href="/admin/disputes?status=RESOLVED"
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            color: statusFilter === 'RESOLVED' ? colors.white : colors.textPrimary,
            backgroundColor: statusFilter === 'RESOLVED' ? colors.success : colors.white,
            border: `2px solid ${statusFilter === 'RESOLVED' ? colors.success : colors.border}`,
            borderRadius: borderRadius.md,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Resolved ({resolvedCount})
        </Link>
      </div>

      {/* Disputes List */}
      <div style={{ backgroundColor: colors.white, borderRadius: borderRadius.lg, border: `1px solid ${colors.border}` }}>
        {disputes.length === 0 ? (
          <div style={{ padding: '48px', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', color: colors.textSecondary }}>
              No disputes found
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                    Dispute ID
                  </th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                    Parties
                  </th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                    Reason
                  </th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                    Status
                  </th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                    Messages
                  </th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                    Created
                  </th>
                  <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {disputes.map((dispute) => {
                  const statusColors = getStatusColor(dispute.status);
                  return (
                    <tr key={dispute.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textPrimary, fontFamily: 'monospace' }}>
                        {dispute.id.slice(0, 8)}...
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ fontSize: '14px' }}>
                          <div style={{ color: colors.textPrimary, fontWeight: '500', marginBottom: '4px' }}>
                            Client: {dispute.order.client.name || dispute.order.client.email}
                          </div>
                          <div style={{ color: colors.textSecondary, fontSize: '13px' }}>
                            Fixer: {dispute.order.fixer.name || dispute.order.fixer.email}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: '600',
                          borderRadius: borderRadius.sm,
                          backgroundColor: colors.bgSecondary,
                          color: colors.textPrimary,
                        }}>
                          {getReasonLabel(dispute.reason)}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{
                          padding: '4px 10px',
                          fontSize: '12px',
                          fontWeight: '600',
                          borderRadius: borderRadius.sm,
                          backgroundColor: statusColors.bg,
                          color: statusColors.text,
                          border: `1px solid ${statusColors.border}`,
                        }}>
                          {dispute.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                        {dispute._count.messages}
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                        {new Date(dispute.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <Link
                          href={`/admin/disputes/${dispute.id}`}
                          style={{
                            color: colors.primary,
                            fontSize: '14px',
                            fontWeight: '600',
                            textDecoration: 'none',
                          }}
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '20px', borderTop: `1px solid ${colors.border}`, display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Link
                key={page}
                href={`/admin/disputes?${statusFilter ? `status=${statusFilter}&` : ''}page=${page}`}
                style={{
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: page === currentPage ? colors.white : colors.textPrimary,
                  backgroundColor: page === currentPage ? colors.primary : colors.white,
                  border: `2px solid ${page === currentPage ? colors.primary : colors.border}`,
                  borderRadius: borderRadius.md,
                  textDecoration: 'none',
                }}
              >
                {page}
              </Link>
            ))}
          </div>
        )}
      </div>
    </AdminDashboardWrapper>
  );
}
