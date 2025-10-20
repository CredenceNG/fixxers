import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors, borderRadius } from '@/lib/theme';

const prismaAny = prisma as any;

export default async function AdminDashboard() {
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

  // Fetch active disputes
  const activeDisputes = await prisma.dispute.count({
    where: {
      status: {
        in: ['OPEN', 'UNDER_REVIEW', 'ESCALATED']
      }
    },
  });

  // Fetch pending fixer approvals
  const pendingFixers = await prisma.user.count({
    where: {
      roles: { has: 'FIXER' },
      OR: [
        { status: 'PENDING' },
        {
          fixerProfile: {
            isNot: null,
            is: {
              pendingChanges: true,
            },
          },
        },
      ],
    },
  });

  // Fetch pending gigs
  const pendingGigs = await prisma.gig.count({
    where: { status: 'PENDING_REVIEW' },
  });

  // Fetch pending service requests
  const pendingRequests = await prisma.serviceRequest.count({
    where: { status: 'PENDING' },
  });

  // Platform stats
  const totalUsers = await prisma.user.count();
  const totalClients = await prisma.user.count({ where: { roles: { has: 'CLIENT' } } });
  const totalFixers = await prisma.user.count({ where: { roles: { has: 'FIXER' } } });
  const activeFixers = await prisma.user.count({ where: { roles: { has: 'FIXER' }, status: 'ACTIVE' } });
  const totalOrders = await prisma.order.count();
  const completedOrders = await prisma.order.count({ where: { status: 'COMPLETED' } });

  // Calculate revenue
  const payments = await prisma.payment.findMany({
    where: { status: 'RELEASED' },
    select: { amount: true },
  });
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  const platformFeeSetting = await prisma.platformSettings.findUnique({
    where: { key: 'PLATFORM_FEE_PERCENTAGE' },
  });
  const platformFeePercentage = platformFeeSetting ? parseFloat(platformFeeSetting.value) : 10;
  const platformEarnings = totalRevenue * (platformFeePercentage / 100);

  const cardStyle = {
    backgroundColor: colors.white,
    padding: '24px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  };

  const actionCardStyle = {
    backgroundColor: colors.white,
    padding: '16px 20px',
    borderRadius: '8px',
    border: `1px solid ${colors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textDecoration: 'none',
    transition: 'box-shadow 0.2s',
  };

  return (
    <AdminDashboardWrapper
      userName={user.name || 'Admin'}
      userAvatar={user.profileImage || undefined}
      pendingBadgeRequests={pendingBadgeRequests}
      pendingAgentApplications={pendingAgentApplications}
      pendingReports={pendingReports}
      activeDisputes={activeDisputes}
    >
      {/* Welcome Section */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
          Admin Dashboard
        </h1>
        <p style={{ fontSize: '16px', color: colors.textLight }}>
          Platform Management & Analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="admin-stats-grid" style={{ marginBottom: '32px' }}>
        <div style={cardStyle} className="admin-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p className="admin-stat-title" style={{ color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>Total Users</p>
              <p className="admin-stat-value" style={{ fontWeight: '700', color: colors.textPrimary }}>{totalUsers}</p>
              <p className="admin-stat-subtitle" style={{ color: colors.textLight, marginTop: '4px' }}>
                {totalClients} Clients, {totalFixers} Fixers
              </p>
            </div>
            <div className="admin-stat-icon">👥</div>
          </div>
        </div>

        <div style={cardStyle} className="admin-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p className="admin-stat-title" style={{ color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>Active Fixers</p>
              <p className="admin-stat-value" style={{ fontWeight: '700', color: '#28a745' }}>{activeFixers}</p>
              <p className="admin-stat-subtitle" style={{ color: colors.textLight, marginTop: '4px' }}>
                {pendingFixers} pending approval
              </p>
            </div>
            <div className="admin-stat-icon">🔧</div>
          </div>
        </div>

        <div style={cardStyle} className="admin-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p className="admin-stat-title" style={{ color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>Total Orders</p>
              <p className="admin-stat-value" style={{ fontWeight: '700', color: colors.primary }}>{totalOrders}</p>
              <p className="admin-stat-subtitle" style={{ color: colors.textLight, marginTop: '4px' }}>
                {completedOrders} completed
              </p>
            </div>
            <div className="admin-stat-icon">📦</div>
          </div>
        </div>

        <div style={cardStyle} className="admin-stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <p className="admin-stat-title" style={{ color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>Platform Earnings</p>
              <p className="admin-stat-value" style={{ fontWeight: '700', color: colors.primary }}>₦{Math.round(platformEarnings).toLocaleString()}</p>
              <p className="admin-stat-subtitle" style={{ color: colors.textLight, marginTop: '4px' }}>
                {platformFeePercentage}% of ₦{totalRevenue.toLocaleString()}
              </p>
            </div>
            <div className="admin-stat-icon">💰</div>
          </div>
        </div>
      </div>

      {/* Pending Actions */}
      {(pendingFixers > 0 || pendingGigs > 0 || pendingRequests > 0 || pendingAgentApplications > 0 || pendingBadgeRequests > 0 || pendingReports > 0 || activeDisputes > 0) && (
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
            Pending Actions
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {pendingFixers > 0 && (
              <Link href="/admin/users?status=PENDING&role=FIXER" style={actionCardStyle} className="admin-action-card">
                <div>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
                    Fixer Approvals
                  </p>
                  <p style={{ fontSize: '14px', color: colors.textLight }}>
                    {pendingFixers} fixer{pendingFixers !== 1 ? 's' : ''} awaiting approval
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
                  {pendingFixers}
                </span>
              </Link>
            )}

            {pendingGigs > 0 && (
              <Link href="/admin/gigs?status=PENDING_REVIEW" style={actionCardStyle} className="admin-action-card">
                <div>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
                    Service Offers
                  </p>
                  <p style={{ fontSize: '14px', color: colors.textLight }}>
                    {pendingGigs} gig{pendingGigs !== 1 ? 's' : ''} pending review
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
                  {pendingGigs}
                </span>
              </Link>
            )}

            {pendingRequests > 0 && (
              <Link href="/admin/requests" style={actionCardStyle} className="admin-action-card">
                <div>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
                    Service Requests
                  </p>
                  <p style={{ fontSize: '14px', color: colors.textLight }}>
                    {pendingRequests} request{pendingRequests !== 1 ? 's' : ''} from clients
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
                  {pendingRequests}
                </span>
              </Link>
            )}

            {pendingAgentApplications > 0 && (
              <Link href="/admin/agents?status=PENDING" style={actionCardStyle} className="admin-action-card">
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
              </Link>
            )}

            {pendingBadgeRequests > 0 && (
              <Link href="/admin/badges/requests" style={actionCardStyle} className="admin-action-card">
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
              </Link>
            )}

            {pendingReports > 0 && (
              <Link href="/admin/reports" style={actionCardStyle} className="admin-action-card">
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
              </Link>
            )}

            {activeDisputes > 0 && (
              <Link href="/admin/disputes" style={actionCardStyle} className="admin-action-card">
                <div>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
                    Active Disputes
                  </p>
                  <p style={{ fontSize: '14px', color: colors.textLight }}>
                    {activeDisputes} dispute{activeDisputes !== 1 ? 's' : ''} requiring attention
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
                  {activeDisputes}
                </span>
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
          Quick Actions
        </h2>

        <div className="admin-quick-actions">
          {[
            { href: '/admin/users', icon: '👥', label: 'Manage Users' },
            { href: '/admin/categories', icon: '📂', label: 'Categories' },
            { href: '/admin/gigs', icon: '💼', label: 'All Gigs' },
            { href: '/admin/disputes', icon: '⚖️', label: 'Disputes' },
            { href: '/admin/requests', icon: '📝', label: 'Service Requests' },
            { href: '/admin/settlements', icon: '💳', label: 'Settlements' },
            { href: '/admin/settings', icon: '⚙️', label: 'Settings' },
          ].map((action) => (
            <Link key={action.href} href={action.href} style={{ textDecoration: 'none' }}>
              <div style={{
                ...cardStyle,
                textAlign: 'center' as const,
                cursor: 'pointer',
              }}>
                <div className="admin-quick-action-icon">{action.icon}</div>
                <p className="admin-quick-action-label" style={{ fontWeight: '600', color: colors.textPrimary }}>{action.label}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AdminDashboardWrapper>
  );
}
