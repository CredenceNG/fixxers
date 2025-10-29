import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors, borderRadius } from '@/lib/theme';
import { getAnalyticsInsights, getActiveUsersNow, getDailyTrends, getSessionStats, getUserJourneyPaths } from '@/lib/analytics';
import DailyTrendsChart from './DailyTrendsChart';
import RecentActivityTable from './RecentActivityTable';

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

  // Payment statistics for conversion tracking
  const totalPayments = await prisma.payment.count();
  const settledPayments = await prisma.payment.count({ where: { status: 'RELEASED' } });

  const platformFeeSetting = await prisma.platformSettings.findUnique({
    where: { key: 'PLATFORM_FEE_PERCENTAGE' },
  });
  const platformFeePercentage = platformFeeSetting ? parseFloat(platformFeeSetting.value) : 10;
  const platformEarnings = totalRevenue * (platformFeePercentage / 100);

  // Activity analytics (last 7 days)
  const activityInsights = await getAnalyticsInsights(7);
  const activeUsersNow = await getActiveUsersNow();

  // Daily trends for charts (last 30 days)
  const dailyTrends = await getDailyTrends(30);

  // Session statistics
  const sessionStats = await getSessionStats(7);

  // User journey paths
  const journeyPaths = await getUserJourneyPaths(7, 10);

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
      <div className="admin-analytics-header" style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
          Analytics Dashboard
        </h1>
        <p style={{ fontSize: '16px', color: colors.textLight }}>
          Platform performance metrics and insights
        </p>
      </div>

      {/* User Statistics */}
      <div className="admin-analytics-section" style={{ marginBottom: '32px' }}>
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
      <div className="admin-analytics-section" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
          Order Metrics
        </h2>
        <div className="admin-analytics-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div className="admin-analytics-stat-card" style={statCardStyle}>
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

          <div className="admin-analytics-stat-card" style={{ ...statCardStyle, borderLeftColor: '#28a745' }}>
            <p className="admin-analytics-stat-label" style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Completed Orders
            </p>
            <p className="admin-analytics-stat-value" style={{ fontSize: '32px', fontWeight: '700', color: '#28a745', marginBottom: '4px' }}>
              {completedOrders}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              {totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0}% completion rate
            </p>
          </div>

          <div className="admin-analytics-stat-card" style={{ ...statCardStyle, borderLeftColor: '#ffc107' }}>
            <p className="admin-analytics-stat-label" style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Active Orders
            </p>
            <p className="admin-analytics-stat-value" style={{ fontSize: '32px', fontWeight: '700', color: '#ffc107', marginBottom: '4px' }}>
              {activeOrders}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              Currently in progress
            </p>
          </div>
        </div>
      </div>

      {/* Service Metrics */}
      <div className="admin-analytics-section" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
          Service Metrics
        </h2>
        <div className="admin-analytics-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div className="admin-analytics-stat-card" style={statCardStyle}>
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

          <div className="admin-analytics-stat-card" style={statCardStyle}>
            <p className="admin-analytics-stat-label" style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Service Requests
            </p>
            <p className="admin-analytics-stat-value" style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, marginBottom: '4px' }}>
              {totalRequests}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              {pendingRequests} pending
            </p>
          </div>

          <div className="admin-analytics-stat-card" style={{ ...statCardStyle, borderLeftColor: '#28a745' }}>
            <p className="admin-analytics-stat-label" style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Avg. Gigs per Fixer
            </p>
            <p className="admin-analytics-stat-value" style={{ fontSize: '32px', fontWeight: '700', color: '#28a745', marginBottom: '4px' }}>
              {totalFixers > 0 ? (totalGigs / totalFixers).toFixed(1) : 0}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              Service offerings
            </p>
          </div>
        </div>
      </div>

      {/* Revenue Statistics */}
      <div className="admin-analytics-section" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
          Revenue Metrics
        </h2>
        <div className="admin-analytics-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
          <div className="admin-analytics-stat-card" style={{ ...statCardStyle, borderLeftColor: '#28a745' }}>
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

          <div className="admin-analytics-stat-card" style={statCardStyle}>
            <p className="admin-analytics-stat-label" style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Platform Earnings
            </p>
            <p className="admin-analytics-stat-value" style={{ fontSize: '32px', fontWeight: '700', color: colors.primary, marginBottom: '4px' }}>
              ₦{Math.round(platformEarnings).toLocaleString()}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              {platformFeePercentage}% commission
            </p>
          </div>

          <div className="admin-analytics-stat-card" style={statCardStyle}>
            <p className="admin-analytics-stat-label" style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Avg. Order Value
            </p>
            <p className="admin-analytics-stat-value" style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, marginBottom: '4px' }}>
              ₦{completedOrders > 0 ? Math.round(totalRevenue / completedOrders).toLocaleString() : 0}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              Per completed order
            </p>
          </div>
        </div>
      </div>

      {/* User Activity Insights */}
      <div className="admin-analytics-section" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
          User Activity (Last 7 Days)
        </h2>
        <div className="admin-analytics-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <div style={{ ...statCardStyle, borderLeftColor: '#17a2b8' }}>
            <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Active Users Now
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#17a2b8', marginBottom: '4px' }}>
              {activeUsersNow}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              Active in last 15 minutes
            </p>
          </div>

          <div style={statCardStyle}>
            <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Daily Active Users
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, marginBottom: '4px' }}>
              {activityInsights.dailyActiveUsers}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              Unique users with activity
            </p>
          </div>

          <div style={statCardStyle}>
            <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Total Page Views
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, marginBottom: '4px' }}>
              {activityInsights.totalPageViews}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              All page visits
            </p>
          </div>

          <div style={statCardStyle}>
            <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Total Logins
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, marginBottom: '4px' }}>
              {activityInsights.totalLogins}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              Login events
            </p>
          </div>
        </div>

        {/* Session Statistics */}
        <div className="admin-analytics-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '24px' }}>
          <div style={{ ...statCardStyle, borderLeftColor: '#6c757d' }}>
            <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Total Sessions
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#6c757d', marginBottom: '4px' }}>
              {sessionStats.totalSessions}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              Last 7 days
            </p>
          </div>

          <div style={{ ...statCardStyle, borderLeftColor: '#17a2b8' }}>
            <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Avg. Session Duration
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#17a2b8', marginBottom: '4px' }}>
              {sessionStats.averageDuration} min
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              Per session
            </p>
          </div>

          <div style={{ ...statCardStyle, borderLeftColor: '#28a745' }}>
            <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
              Avg. Actions/Session
            </p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: '#28a745', marginBottom: '4px' }}>
              {sessionStats.averageActionsPerSession}
            </p>
            <p style={{ fontSize: '13px', color: colors.textLight }}>
              Interactions per visit
            </p>
          </div>
        </div>

        {/* Most Visited Pages */}
        <div style={cardStyle}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
            Most Visited Pages
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '13px', color: colors.textLight, fontWeight: '600' }}>Page</th>
                  <th style={{ textAlign: 'right', padding: '12px', fontSize: '13px', color: colors.textLight, fontWeight: '600' }}>Views</th>
                </tr>
              </thead>
              <tbody>
                {activityInsights.popularPages.length > 0 ? (
                  activityInsights.popularPages.map((page, index) => (
                    <tr key={index} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '12px', fontSize: '14px', color: colors.textPrimary }}>{page.page}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: colors.textPrimary, textAlign: 'right', fontWeight: '600' }}>{page.views}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} style={{ padding: '24px', textAlign: 'center', fontSize: '14px', color: colors.textLight }}>
                      No page view data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Daily Trends Chart */}
      <div className="admin-analytics-section" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
          Daily Trends (Last 30 Days)
        </h2>
        <div className="admin-analytics-chart" style={cardStyle}>
          <DailyTrendsChart data={dailyTrends} />
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="admin-analytics-section" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
          Recent Activity
        </h2>
        <div style={cardStyle}>
          <RecentActivityTable activities={activityInsights.recentActivities} />
        </div>
      </div>

      {/* Activity Breakdown */}
      <div className="admin-analytics-section" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
          Activity Breakdown
        </h2>
        <div style={cardStyle}>
          <div className="admin-analytics-breakdown-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '24px' }}>
            {activityInsights.activityByType.map((item) => (
              <div key={item.action}>
                <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px' }}>
                  {item.action}
                </p>
                <p style={{ fontSize: '24px', fontWeight: '700', color: colors.primary }}>
                  {item.count}
                </p>
              </div>
            ))}
            {activityInsights.activityByType.length === 0 && (
              <p style={{ fontSize: '14px', color: colors.textLight, textAlign: 'center', gridColumn: '1 / -1' }}>
                No activity data available
              </p>
            )}
          </div>
        </div>
      </div>

      {/* User Journey Paths */}
      <div className="admin-analytics-section" style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
          Common User Journeys
        </h2>
        <div style={cardStyle}>
          <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '16px' }}>
            Most frequent page navigation paths (first 3 pages per session)
          </p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                  <th style={{ textAlign: 'left', padding: '12px', fontSize: '13px', color: colors.textLight, fontWeight: '600' }}>Journey Path</th>
                  <th style={{ textAlign: 'right', padding: '12px', fontSize: '13px', color: colors.textLight, fontWeight: '600' }}>Occurrences</th>
                </tr>
              </thead>
              <tbody>
                {journeyPaths.length > 0 ? (
                  journeyPaths.map((journey, index) => (
                    <tr key={index} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '12px', fontSize: '14px', color: colors.textPrimary, fontFamily: 'monospace' }}>
                        {journey.path}
                      </td>
                      <td style={{ padding: '12px', fontSize: '14px', color: colors.textPrimary, textAlign: 'right', fontWeight: '600' }}>
                        {journey.count}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} style={{ padding: '24px', textAlign: 'center', fontSize: '14px', color: colors.textLight }}>
                      No journey data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Conversion Rates */}
      <div className="admin-analytics-section">
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
          Conversion Rates
        </h2>
        <div style={cardStyle}>
          <div className="admin-analytics-conversion-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
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

            <div>
              <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px' }}>
                Orders Completed
              </p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#28a745' }}>
                {completedOrders}
              </p>
              <p style={{ fontSize: '12px', color: colors.textLight, marginTop: '4px' }}>
                Total successful orders
              </p>
            </div>

            <div>
              <p style={{ fontSize: '14px', color: colors.textLight, marginBottom: '8px' }}>
                Payments Settled
              </p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: '#28a745' }}>
                {settledPayments}
              </p>
              <p style={{ fontSize: '12px', color: colors.textLight, marginTop: '4px' }}>
                {totalPayments > 0 ? ((settledPayments / totalPayments) * 100).toFixed(1) : 0}% of {totalPayments} payments
              </p>
            </div>
          </div>
        </div>
      </div>
    </AdminDashboardWrapper>
  );
}
