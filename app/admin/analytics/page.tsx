import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors, borderRadius } from '@/lib/theme';

const prismaAny = prisma as any;

export default async function AdminAnalyticsPage() {
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

  // Platform statistics
  const totalUsers = await prisma.user.count();
  const totalClients = await prisma.user.count({ where: { roles: { has: 'CLIENT' } } });
  const totalFixers = await prisma.user.count({ where: { roles: { has: 'FIXER' } } });
  const activeFixers = await prisma.user.count({ where: { roles: { has: 'FIXER' }, status: 'ACTIVE' } });

  const totalOrders = await prisma.order.count();
  const completedOrders = await prisma.order.count({ where: { status: 'COMPLETED' } });
  const activeOrders = await prisma.order.count({ where: { status: { in: ['PENDING', 'IN_PROGRESS'] } } });

  const totalGigs = await prisma.gig.count();
  const activeGigs = await prisma.gig.count({ where: { status: 'ACTIVE' } });

  const totalRequests = await prisma.serviceRequest.count();
  const pendingRequests = await prisma.serviceRequest.count({ where: { status: 'PENDING' } });

  // Revenue statistics
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

  const statCardStyle = {
    ...cardStyle,
    borderLeft: `4px solid ${colors.primary}`,
  };

  return (
    <AdminDashboardWrapper
      userName={user.name || 'Admin'}
      userAvatar={user.profileImage || undefined}
      pendingBadgeRequests={pendingBadgeRequests}
      pendingAgentApplications={pendingAgentApplications}
      pendingReports={pendingReports}
    >
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
          Analytics Dashboard
        </h1>
        <p style={{ fontSize: '16px', color: colors.textLight }}>
          Platform performance metrics and insights
        </p>
      </div>

      {/* User Statistics */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
          User Metrics
        </h2>
        <div className="admin-analytics-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div className="admin-analytics-stat-card" style={statCardStyle}>
            <p className="admin-analytics-stat-label" style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Total Users
            </p>
            <p className="admin-analytics-stat-value" style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, marginBottom: '4px' }}>
              {totalUsers}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              All registered users
            </p>
          </div>

          <div className="admin-analytics-stat-card" style={{ ...statCardStyle, borderLeftColor: '#28a745' }}>
            <p className="admin-analytics-stat-label" style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Clients
            </p>
            <p className="admin-analytics-stat-value" style={{ fontSize: '32px', fontWeight: '700', color: '#28a745', marginBottom: '4px' }}>
              {totalClients}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              {((totalClients / totalUsers) * 100).toFixed(1)}% of total users
            </p>
          </div>

          <div className="admin-analytics-stat-card" style={{ ...statCardStyle, borderLeftColor: '#007bff' }}>
            <p className="admin-analytics-stat-label" style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Fixers
            </p>
            <p className="admin-analytics-stat-value" style={{ fontSize: '32px', fontWeight: '700', color: '#007bff', marginBottom: '4px' }}>
              {totalFixers}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              {activeFixers} active ({((activeFixers / totalFixers) * 100).toFixed(1)}%)
            </p>
          </div>
        </div>
      </div>

      {/* Order Statistics */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
          Order Metrics
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div style={statCardStyle}>
            <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Total Orders
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, marginBottom: '4px' }}>
              {totalOrders}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              All time
            </p>
          </div>

          <div style={{ ...statCardStyle, borderLeftColor: '#28a745' }}>
            <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Completed Orders
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#28a745', marginBottom: '4px' }}>
              {completedOrders}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              {totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0}% completion rate
            </p>
          </div>

          <div style={{ ...statCardStyle, borderLeftColor: '#ffc107' }}>
            <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Active Orders
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#ffc107', marginBottom: '4px' }}>
              {activeOrders}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              Currently in progress
            </p>
          </div>
        </div>
      </div>

      {/* Service Metrics */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
          Service Metrics
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div style={statCardStyle}>
            <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Total Gigs
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, marginBottom: '4px' }}>
              {totalGigs}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              {activeGigs} active
            </p>
          </div>

          <div style={statCardStyle}>
            <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Service Requests
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, marginBottom: '4px' }}>
              {totalRequests}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              {pendingRequests} pending
            </p>
          </div>

          <div style={{ ...statCardStyle, borderLeftColor: '#28a745' }}>
            <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Avg. Gigs per Fixer
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#28a745', marginBottom: '4px' }}>
              {totalFixers > 0 ? (totalGigs / totalFixers).toFixed(1) : 0}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              Service offerings
            </p>
          </div>
        </div>
      </div>

      {/* Revenue Statistics */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
          Revenue Metrics
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div style={{ ...statCardStyle, borderLeftColor: '#28a745' }}>
            <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Total Revenue
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#28a745', marginBottom: '4px' }}>
              ₦{totalRevenue.toLocaleString()}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              All released payments
            </p>
          </div>

          <div style={statCardStyle}>
            <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Platform Earnings
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: colors.primary, marginBottom: '4px' }}>
              ₦{Math.round(platformEarnings).toLocaleString()}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              {platformFeePercentage}% commission
            </p>
          </div>

          <div style={statCardStyle}>
            <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Avg. Order Value
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, marginBottom: '4px' }}>
              ₦{completedOrders > 0 ? Math.round(totalRevenue / completedOrders).toLocaleString() : 0}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              Per completed order
            </p>
          </div>
        </div>
      </div>

      {/* Conversion Rates */}
      <div>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
          Conversion Rates
        </h2>
        <div style={cardStyle}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
            <div>
              <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px' }}>
                Fixer Activation Rate
              </p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.primary }}>
                {totalFixers > 0 ? ((activeFixers / totalFixers) * 100).toFixed(1) : 0}%
              </p>
              <p style={{ fontSize: '12px', color: colors.textLight, marginTop: '4px' }}>
                {activeFixers} of {totalFixers} approved
              </p>
            </div>

            <div>
              <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px' }}>
                Gig Activation Rate
              </p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.primary }}>
                {totalGigs > 0 ? ((activeGigs / totalGigs) * 100).toFixed(1) : 0}%
              </p>
              <p style={{ fontSize: '12px', color: colors.textLight, marginTop: '4px' }}>
                {activeGigs} of {totalGigs} gigs
              </p>
            </div>

            <div>
              <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px' }}>
                Order Completion Rate
              </p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#28a745' }}>
                {totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0}%
              </p>
              <p style={{ fontSize: '12px', color: colors.textLight, marginTop: '4px' }}>
                {completedOrders} of {totalOrders} orders
              </p>
            </div>

            <div>
              <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px' }}>
                Request Pending Rate
              </p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#ffc107' }}>
                {totalRequests > 0 ? ((pendingRequests / totalRequests) * 100).toFixed(1) : 0}%
              </p>
              <p style={{ fontSize: '12px', color: colors.textLight, marginTop: '4px' }}>
                {pendingRequests} of {totalRequests} requests
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminDashboardWrapper>
  );
}
