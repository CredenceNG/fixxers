import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors } from '@/lib/theme';

const prismaAny = prisma as any;

export default async function AdminDashboardV2() {
  const user = await getCurrentUser();

  const roles = user?.roles || [];
  if (!user || !roles.includes('ADMIN')) {
    redirect('/auth/login');
  }

  // Fetch pending counts for badges
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

  // Platform stats
  const totalUsers = await prisma.user.count();
  const totalFixers = await prisma.user.count({ where: { roles: { has: 'FIXER' } } });
  const totalOrders = await prisma.order.count();
  const completedOrders = await prisma.order.count({ where: { status: 'COMPLETED' } });

  const cardStyle = {
    backgroundColor: colors.white,
    padding: '24px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
  };

  const actionCardStyle = {
    backgroundColor: colors.white,
    padding: '16px 20px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  return (
    <AdminDashboardWrapper
      userName={user.name || 'Admin'}
      userAvatar={user.profileImage || undefined}
      pendingBadgeRequests={pendingBadgeRequests}
      pendingAgentApplications={pendingAgentApplications}
      pendingReports={pendingReports}
    >
      {/* Welcome Section */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
          Welcome back, {user.name}!
        </h1>
        <p style={{ fontSize: '16px', color: colors.textLight }}>
          Here's what's happening with your platform today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="admin-dashboardv2-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div className="admin-dashboardv2-stat-card" style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p className="admin-dashboardv2-stat-label" style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px' }}>Total Users</p>
              <p className="admin-dashboardv2-stat-value" style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary }}>{totalUsers}</p>
            </div>
            <div style={{ fontSize: '32px' }}>👥</div>
          </div>
        </div>

        <div className="admin-dashboardv2-stat-card" style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p className="admin-dashboardv2-stat-label" style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px' }}>Active Fixers</p>
              <p className="admin-dashboardv2-stat-value" style={{ fontSize: '32px', fontWeight: '700', color: colors.primary }}>{totalFixers}</p>
            </div>
            <div style={{ fontSize: '32px' }}>🔧</div>
          </div>
        </div>

        <div className="admin-dashboardv2-stat-card" style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p className="admin-dashboardv2-stat-label" style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px' }}>Total Orders</p>
              <p className="admin-dashboardv2-stat-value" style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary }}>{totalOrders}</p>
            </div>
            <div style={{ fontSize: '32px' }}>📦</div>
          </div>
        </div>

        <div className="admin-dashboardv2-stat-card" style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p className="admin-dashboardv2-stat-label" style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px' }}>Completed</p>
              <p className="admin-dashboardv2-stat-value" style={{ fontSize: '32px', fontWeight: '700', color: '#28a745' }}>{completedOrders}</p>
            </div>
            <div style={{ fontSize: '32px' }}>✅</div>
          </div>
        </div>
      </div>

      {/* Pending Actions */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
          Pending Actions
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {pendingAgentApplications > 0 && (
            <Link href="/admin/agents?status=PENDING" style={{ textDecoration: 'none' }}>
              <div style={{ ...actionCardStyle, borderLeft: `4px solid #007bff` }}>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
                    Agent Applications
                  </p>
                  <p style={{ fontSize: '14px', color: colors.textLight }}>
                    {pendingAgentApplications} application{pendingAgentApplications !== 1 ? 's' : ''} awaiting review
                  </p>
                </div>
                <span style={{
                  backgroundColor: '#007bff',
                  color: colors.white,
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600',
                }}>
                  {pendingAgentApplications}
                </span>
              </div>
            </Link>
          )}

          {pendingBadgeRequests > 0 && (
            <Link href="/admin/badges" style={{ textDecoration: 'none' }}>
              <div style={{ ...actionCardStyle, borderLeft: `4px solid #ffc107` }}>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
                    Badge Requests
                  </p>
                  <p style={{ fontSize: '14px', color: colors.textLight }}>
                    {pendingBadgeRequests} request{pendingBadgeRequests !== 1 ? 's' : ''} awaiting review
                  </p>
                </div>
                <span style={{
                  backgroundColor: '#ffc107',
                  color: '#000',
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600',
                }}>
                  {pendingBadgeRequests}
                </span>
              </div>
            </Link>
          )}

          {pendingReports > 0 && (
            <Link href="/admin/reports" style={{ textDecoration: 'none' }}>
              <div style={{ ...actionCardStyle, borderLeft: `4px solid #dc3545` }}>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
                    Review Reports
                  </p>
                  <p style={{ fontSize: '14px', color: colors.textLight }}>
                    {pendingReports} report{pendingReports !== 1 ? 's' : ''} awaiting moderation
                  </p>
                </div>
                <span style={{
                  backgroundColor: '#dc3545',
                  color: colors.white,
                  padding: '6px 16px',
                  borderRadius: '20px',
                  fontSize: '14px',
                  fontWeight: '600',
                }}>
                  {pendingReports}
                </span>
              </div>
            </Link>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
          Quick Actions
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          {[
            { href: '/admin/users', icon: '👥', label: 'Manage Users' },
            { href: '/admin/categories', icon: '📂', label: 'Categories' },
            { href: '/admin/settings', icon: '⚙️', label: 'Settings' },
            { href: '/admin/analytics', icon: '📈', label: 'Analytics' },
          ].map((action) => (
            <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
              <div style={{
                ...cardStyle,
                textAlign: 'center' as const,
              }}>
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{action.icon}</div>
                <p style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>{action.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AdminDashboardWrapper>
  );
}
