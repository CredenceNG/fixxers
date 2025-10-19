import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors } from '@/lib/theme';
import { ActionCard, QuickActionCard } from './DashboardCards';

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div style={{
          backgroundColor: colors.white,
          padding: '24px',
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px' }}>Total Users</p>
              <p style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary }}>{totalUsers}</p>
            </div>
            <div style={{ fontSize: '32px' }}>👥</div>
          </div>
        </div>

        <div style={{
          backgroundColor: colors.white,
          padding: '24px',
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px' }}>Active Fixers</p>
              <p style={{ fontSize: '32px', fontWeight: '700', color: colors.primary }}>{totalFixers}</p>
            </div>
            <div style={{ fontSize: '32px' }}>🔧</div>
          </div>
        </div>

        <div style={{
          backgroundColor: colors.white,
          padding: '24px',
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px' }}>Total Orders</p>
              <p style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary }}>{totalOrders}</p>
            </div>
            <div style={{ fontSize: '32px' }}>📦</div>
          </div>
        </div>

        <div style={{
          backgroundColor: colors.white,
          padding: '24px',
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px' }}>Completed</p>
              <p style={{ fontSize: '32px', fontWeight: '700', color: '#28a745' }}>{completedOrders}</p>
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
              <div style={{
                backgroundColor: colors.white,
                padding: '16px 20px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                borderLeft: `4px solid #007bff`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
              >
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
              <div style={{
                backgroundColor: colors.white,
                padding: '16px 20px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                borderLeft: `4px solid #ffc107`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
              >
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
              <div style={{
                backgroundColor: colors.white,
                padding: '16px 20px',
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
                borderLeft: `4px solid #dc3545`,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                cursor: 'pointer',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateX(4px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateX(0)'}
              >
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
          <Link href="/admin/users" style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: colors.white,
              padding: '20px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>👥</div>
              <p style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>Manage Users</p>
            </div>
          </Link>

          <Link href="/admin/categories" style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: colors.white,
              padding: '20px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📂</div>
              <p style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>Categories</p>
            </div>
          </Link>

          <Link href="/admin/settings" style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: colors.white,
              padding: '20px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>⚙️</div>
              <p style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>Settings</p>
            </div>
          </Link>

          <Link href="/admin/analytics" style={{ textDecoration: 'none' }}>
            <div style={{
              backgroundColor: colors.white,
              padding: '20px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>📈</div>
              <p style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>Analytics</p>
            </div>
          </Link>
        </div>
      </div>
    </AdminDashboardWrapper>
  );
}
