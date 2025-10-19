import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { getAuditLogs } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors, borderRadius } from '@/lib/theme';
import { AuditAction } from '@prisma/client';

const prismaAny = prisma as any;

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; action?: string; targetType?: string }>;
}) {
  const user = await getCurrentUser();

  const roles = user?.roles || [];
  if (!user || !roles.includes('ADMIN')) {
    redirect('/auth/login');
  }

  const params = await searchParams;

  // Fetch pending counts for sidebar badges
  const pendingBadgeRequests = await prismaAny.badgeRequest.count({
    where: {
      status: {
        in: ['PENDING', 'PAYMENT_RECEIVED', 'UNDER_REVIEW']
      }
    },
  });

  const pendingAgentApplications = await prismaAny.agent.count({
    where: {
      status: 'PENDING'
    },
  });

  const pendingReports = await prisma.reviewReport.count({
    where: {
      status: {
        in: ['PENDING', 'REVIEWING']
      }
    },
  });

  const page = parseInt(params.page || '1');
  const limit = 50;
  const offset = (page - 1) * limit;

  const filters: any = {};
  if (params.action) filters.action = params.action as AuditAction;
  if (params.targetType) filters.targetType = params.targetType;

  const { logs, total } = await getAuditLogs({
    ...filters,
    limit,
    offset,
  });

  const totalPages = Math.ceil(total / limit);

  // Action color mapping
  const actionColors: Record<string, string> = {
    USER_APPROVED: '#28a745',
    USER_REJECTED: '#dc3545',
    USER_SUSPENDED: '#ffc107',
    FIXER_APPROVED: '#28a745',
    FIXER_REJECTED: '#dc3545',
    BADGE_REQUEST_APPROVED: '#28a745',
    BADGE_REQUEST_REJECTED: '#dc3545',
    ORDER_REFUNDED: '#ffc107',
    GIG_APPROVED: '#28a745',
    GIG_DELETED: '#dc3545',
    REVIEW_APPROVED: '#28a745',
    REVIEW_DELETED: '#dc3545',
    AGENT_APPROVED: '#28a745',
    AGENT_REJECTED: '#dc3545',
  };

  const getActionBadgeColor = (action: string) => {
    return actionColors[action] || colors.primary;
  };

  // Format action for display
  const formatAction = (action: string) => {
    return action
      .split('_')
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(' ');
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
          Audit Logs
        </h1>
        <p style={{ fontSize: '16px', color: colors.textLight }}>
          View all administrative actions and system events
        </p>
      </div>

      {/* Stats Cards */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
          System Activity
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          <div
            style={{
              backgroundColor: colors.white,
              padding: '24px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              borderLeft: `4px solid ${colors.primary}`,
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}
          >
            <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Total Events
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, marginBottom: '4px' }}>
              {total}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              Audit trail records
            </p>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
          Audit Trail
        </h2>
        <div
          style={{
            backgroundColor: colors.white,
            borderRadius: '8px',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: colors.bgSecondary }}>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Timestamp
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Action
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Target
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Performed By
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Description
                  </th>
                  <th
                    style={{
                      padding: '12px 16px',
                      textAlign: 'left',
                      fontSize: '12px',
                      fontWeight: '600',
                      color: colors.textSecondary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    IP Address
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: colors.textSecondary }}>
                      No audit logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      style={{
                        borderTop: `1px solid ${colors.border}`,
                      }}
                    >
                      <td style={{ padding: '16px', fontSize: '13px', color: colors.textSecondary }}>
                        {formatDate(log.createdAt)}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span
                          style={{
                            padding: '4px 12px',
                            borderRadius: borderRadius.md,
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: getActionBadgeColor(log.action) + '20',
                            color: getActionBadgeColor(log.action),
                          }}
                        >
                          {formatAction(log.action)}
                        </span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: colors.textPrimary }}>
                        <div>{log.targetType}</div>
                        {log.targetId && (
                          <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '2px' }}>
                            {log.targetId.slice(0, 8)}...
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: colors.textPrimary }}>
                        <div>{log.user.name || 'Unknown'}</div>
                        <div style={{ fontSize: '11px', color: colors.textSecondary, marginTop: '2px' }}>
                          {log.user.email}
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: colors.textSecondary }}>
                        {log.description || '-'}
                      </td>
                      <td style={{ padding: '16px', fontSize: '12px', color: colors.textSecondary }}>
                        {log.ipAddress || '-'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                padding: '16px',
                borderTop: `1px solid ${colors.border}`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ fontSize: '13px', color: colors.textLight }}>
                Showing {offset + 1} to {Math.min(offset + limit, total)} of {total} entries
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                {page > 1 && (
                  <a
                    href={`?page=${page - 1}`}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: colors.white,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '4px',
                      fontSize: '13px',
                      color: colors.textPrimary,
                      textDecoration: 'none',
                    }}
                  >
                    Previous
                  </a>
                )}
                {page < totalPages && (
                  <a
                    href={`?page=${page + 1}`}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: colors.primary,
                      color: colors.white,
                      borderRadius: '4px',
                      fontSize: '13px',
                      textDecoration: 'none',
                    }}
                  >
                    Next
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminDashboardWrapper>
  );
}
