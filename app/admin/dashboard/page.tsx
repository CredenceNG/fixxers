import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard, DashboardButton, DashboardStat } from '@/components/DashboardLayout';
import { PurseBalanceInline } from '@/components/PurseBalanceInline';
import { colors, borderRadius } from '@/lib/theme';

export default async function AdminDashboard() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/auth/login');
  }

  // Fetch pending fixer approvals (new applications or profile changes)
  const pendingFixers = await prisma.user.findMany({
    where: {
      role: 'FIXER',
      OR: [
        { status: 'PENDING' }, // New applications
        {
          fixerProfile: {
            isNot: null,
            is: {
              pendingChanges: true, // Profile changes
            },
          },
        },
      ],
    },
    include: {
      fixerProfile: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch pending gigs
  const pendingGigs = await prisma.gig.findMany({
    where: {
      status: 'PENDING_REVIEW',
    },
    include: {
      seller: true,
      subcategory: {
        include: {
          category: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch flagged payments
  const flaggedPayments = await prisma.payment.findMany({
    where: {
      isFlagged: true,
      adminApproved: false,
    },
    include: {
      order: {
        include: {
          client: true,
          fixer: true,
          request: {
            include: {
              subcategory: {
                include: {
                  category: true,
                },
              },
            },
          },
          gig: {
            include: {
              subcategory: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch pending settlements (PAID orders)
  const pendingSettlements = await prisma.order.findMany({
    where: { status: 'PAID' },
    select: {
      id: true,
      fixerAmount: true,
    },
  });

  // Fetch recent users
  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Fetch recent clients
  const recentClients = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Fetch recent service requests (only show 5 on dashboard)
  const recentRequests = await prisma.serviceRequest.findMany({
    include: {
      client: true,
      subcategory: {
        include: {
          category: true,
        },
      },
      quotes: true,
    },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  // Count pending service requests (no quotes yet)
  const pendingRequests = await prisma.serviceRequest.count({
    where: {
      status: 'PENDING',
    },
  });

  // Calculate platform statistics
  const totalUsers = await prisma.user.count();
  const totalClients = await prisma.user.count({ where: { role: 'CLIENT' } });
  const totalFixers = await prisma.user.count({ where: { role: 'FIXER' } });
  const activeFixers = await prisma.user.count({ where: { role: 'FIXER', status: 'ACTIVE' } });

  const totalRequests = await prisma.serviceRequest.count();
  const totalOrders = await prisma.order.count();
  const completedOrders = await prisma.order.count({ where: { status: 'COMPLETED' } });

  // Calculate revenue
  const payments = await prisma.payment.findMany({
    where: { status: 'RELEASED' },
    select: { amount: true },
  });
  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

  // Get platform fee from settings
  const platformFeeSetting = await prisma.platformSettings.findUnique({
    where: { key: 'PLATFORM_FEE_PERCENTAGE' },
  });
  const platformFeePercentage = platformFeeSetting ? parseFloat(platformFeeSetting.value) : 10;
  const platformEarnings = totalRevenue * (platformFeePercentage / 100);

  const stats = {
    totalUsers,
    totalClients,
    totalFixers,
    activeFixers,
    pendingFixers: pendingFixers.length,
    pendingGigs: pendingGigs.length,
    totalRequests,
    pendingRequests,
    totalOrders,
    completedOrders,
    totalRevenue,
    platformEarnings,
    flaggedPayments: flaggedPayments.length,
    pendingSettlements: pendingSettlements.length,
    pendingSettlementsAmount: pendingSettlements.reduce((sum, order) => sum + order.fixerAmount, 0),
  };

  return (
    <DashboardLayoutWithHeader
      title="Admin Dashboard"
      subtitle="Platform Management & Analytics"
      actions={
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <PurseBalanceInline />
          <DashboardButton variant="outline" href="/admin/categories">
            Manage Categories
          </DashboardButton>
          <DashboardButton variant="primary" href="/admin/settings">
            Settings
          </DashboardButton>
        </div>
      }
    >
        {/* Alert Badges */}
        {(stats.pendingFixers > 0 || stats.pendingGigs > 0 || stats.flaggedPayments > 0 || stats.pendingSettlements > 0 || stats.pendingRequests > 0) && (
          <div style={{ marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {stats.pendingFixers > 0 && (
              <DashboardCard style={{ borderLeft: `4px solid ${colors.warningDark}`, padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ flexShrink: 0 }}>
                    <svg style={{ height: '24px', width: '24px', color: colors.warningDark }} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <p style={{ fontSize: '15px', color: colors.textPrimary }}>
                      <Link href="#pending-fixers" style={{ fontWeight: '600', textDecoration: 'none', color: colors.primary }}>
                        {stats.pendingFixers} fixer{stats.pendingFixers !== 1 ? 's' : ''} awaiting approval
                      </Link>
                    </p>
                  </div>
                </div>
              </DashboardCard>
            )}
            {stats.pendingGigs > 0 && (
              <DashboardCard style={{ borderLeft: `4px solid ${colors.warningDark}`, padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ flexShrink: 0 }}>
                    <svg style={{ height: '24px', width: '24px', color: colors.warningDark }} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <p style={{ fontSize: '15px', color: colors.textPrimary }}>
                      <Link href="#pending-gigs" style={{ fontWeight: '600', textDecoration: 'none', color: colors.primary }}>
                        {stats.pendingGigs} service offer{stats.pendingGigs !== 1 ? 's' : ''} awaiting review
                      </Link>
                    </p>
                  </div>
                </div>
              </DashboardCard>
            )}
            {stats.pendingRequests > 0 && (
              <DashboardCard style={{ borderLeft: `4px solid ${colors.primary}`, padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ flexShrink: 0 }}>
                      <svg style={{ height: '24px', width: '24px', color: colors.primary }} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div style={{ marginLeft: '16px' }}>
                      <p style={{ fontSize: '15px', color: colors.textPrimary, fontWeight: '600' }}>
                        {stats.pendingRequests} pending service request{stats.pendingRequests !== 1 ? 's' : ''} from clients
                      </p>
                      <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
                        Clients waiting for fixers to quote
                      </p>
                    </div>
                  </div>
                  <Link href="/admin/requests">
                    <DashboardButton variant="outline">
                      View Requests
                    </DashboardButton>
                  </Link>
                </div>
              </DashboardCard>
            )}
            {stats.pendingSettlements > 0 && (
              <DashboardCard style={{ borderLeft: `4px solid ${colors.success}`, padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center' }}>
                    <div style={{ flexShrink: 0 }}>
                      <svg style={{ height: '24px', width: '24px', color: colors.success }} viewBox="0 0 20 20" fill="currentColor">
                        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div style={{ marginLeft: '16px' }}>
                      <p style={{ fontSize: '15px', color: colors.textPrimary, fontWeight: '600' }}>
                        {stats.pendingSettlements} payment{stats.pendingSettlements !== 1 ? 's' : ''} ready to settle
                      </p>
                      <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
                        Total: ₦{stats.pendingSettlementsAmount.toLocaleString()} to be released to fixers
                      </p>
                    </div>
                  </div>
                  <Link href="/admin/settlements">
                    <DashboardButton variant="primary">
                      View Settlements
                    </DashboardButton>
                  </Link>
                </div>
              </DashboardCard>
            )}
            {stats.flaggedPayments > 0 && (
              <DashboardCard style={{ borderLeft: `4px solid ${colors.error}`, padding: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <div style={{ flexShrink: 0 }}>
                    <svg style={{ height: '24px', width: '24px', color: colors.error }} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div style={{ marginLeft: '16px' }}>
                    <p style={{ fontSize: '15px', color: colors.textPrimary }}>
                      <Link href="#flagged-payments" style={{ fontWeight: '600', textDecoration: 'none', color: colors.primary }}>
                        {stats.flaggedPayments} flagged payment{stats.flaggedPayments !== 1 ? 's' : ''} requiring review
                      </Link>
                    </p>
                  </div>
                </div>
              </DashboardCard>
            )}
          </div>
        )}

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
          <DashboardCard padding="24px">
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Total Users</p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, lineHeight: '1' }}>{stats.totalUsers}</p>
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
              {stats.totalClients} Clients, {stats.totalFixers} Fixers
            </p>
          </DashboardCard>
          <DashboardCard padding="24px">
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Active Fixers</p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: colors.success, lineHeight: '1' }}>{stats.activeFixers}</p>
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
              {stats.pendingFixers} pending approval
            </p>
          </DashboardCard>
          <DashboardCard padding="24px">
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Total Orders</p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: colors.primary, lineHeight: '1' }}>{stats.totalOrders}</p>
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
              {stats.completedOrders} completed
            </p>
          </DashboardCard>
          <DashboardCard padding="24px">
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Platform Earnings</p>
            <p style={{ fontSize: '32px', fontWeight: '700', color: colors.primary, lineHeight: '1' }}>₦{stats.platformEarnings.toLocaleString()}</p>
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
              {platformFeePercentage}% of ₦{stats.totalRevenue.toLocaleString()}
            </p>
          </DashboardCard>
        </div>

        {/* Pending Gigs */}
        {pendingGigs.length > 0 && (
          <div id="pending-gigs" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: colors.textPrimary, marginBottom: '24px' }}>Pending Service Offers</h2>
            <DashboardCard padding="0">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Title</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fixer</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Submitted</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingGigs.map((gig) => (
                    <tr key={gig.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textPrimary }}>
                        {gig.title}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textSecondary }}>
                        {gig.seller.name || gig.seller.email || gig.seller.phone}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textSecondary }}>
                        {gig.subcategory.category.name} / {gig.subcategory.name}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textSecondary }}>
                        {new Date(gig.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '15px' }}>
                        <Link
                          href={`/admin/gigs/${gig.id}`}
                          style={{ color: colors.primary, fontWeight: '600', textDecoration: 'none' }}
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DashboardCard>
          </div>
        )}

        {/* Pending Fixer Approvals */}
        {pendingFixers.length > 0 && (
          <div id="pending-fixers" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: colors.textPrimary, marginBottom: '24px' }}>Pending Fixer Approvals</h2>
            <DashboardCard padding="0">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Joined</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingFixers.map((fixer) => (
                    <tr key={fixer.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textPrimary }}>
                        {fixer.name || 'N/A'}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textSecondary }}>
                        {fixer.email || fixer.phone}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textSecondary }}>
                        {new Date(fixer.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '15px' }}>
                        <Link
                          href={`/admin/users/${fixer.id}`}
                          style={{ color: colors.primary, fontWeight: '600', textDecoration: 'none' }}
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DashboardCard>
          </div>
        )}

        {/* Flagged Payments */}
        {flaggedPayments.length > 0 && (
          <div id="flagged-payments" style={{ marginBottom: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: colors.textPrimary, marginBottom: '24px' }}>Flagged Payments</h2>
            <DashboardCard padding="0">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Client</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Fixer</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Reason</th>
                    <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {flaggedPayments.map((payment) => (
                    <tr key={payment.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                      <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textPrimary }}>
                        {payment.order?.request?.subcategory?.name || payment.order?.gig?.subcategory?.name || 'N/A'}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textSecondary }}>
                        {payment.order?.client?.name || payment.order?.client?.email || payment.order?.client?.phone || 'N/A'}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textSecondary }}>
                        {payment.order?.fixer?.name || payment.order?.fixer?.email || payment.order?.fixer?.phone || 'N/A'}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textPrimary }}>
                        ₦{payment.amount.toLocaleString()}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textSecondary }}>
                        {payment.flagReason || 'No reason provided'}
                      </td>
                      <td style={{ padding: '16px 24px', fontSize: '15px' }}>
                        <Link
                          href={`/admin/payments/${payment.id}`}
                          style={{ color: colors.primary, fontWeight: '600', textDecoration: 'none' }}
                        >
                          Review
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </DashboardCard>
          </div>
        )}

        {/* Recent Users */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: colors.textPrimary }}>Recent Users</h2>
            <Link href="/admin/users" style={{ color: colors.primary, fontWeight: '600', fontSize: '14px', textDecoration: 'none' }}>
              View All
            </Link>
          </div>
          <DashboardCard padding="0">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Role</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textPrimary }}>
                      {user.name || 'N/A'}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textSecondary }}>{user.email || user.phone}</td>
                    <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textPrimary }}>{user.role}</td>
                    <td style={{ padding: '16px 24px', fontSize: '15px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          fontSize: '12px',
                          borderRadius: borderRadius.md,
                          fontWeight: '600',
                          ...(user.status === 'ACTIVE'
                            ? { backgroundColor: colors.primaryLight, color: colors.primaryDark }
                            : user.status === 'PENDING'
                            ? { backgroundColor: '#FEF5E7', color: '#95620D' }
                            : user.status === 'SUSPENDED'
                            ? { backgroundColor: '#FDEDEC', color: '#922B21' }
                            : { backgroundColor: colors.gray100, color: colors.gray700 }
                          )
                        }}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textSecondary }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DashboardCard>
        </div>

        {/* Recent Clients */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: colors.textPrimary }}>Recent Clients</h2>
            <Link href="/admin/clients" style={{ color: colors.primary, fontWeight: '600', fontSize: '14px', textDecoration: 'none' }}>
              View All
            </Link>
          </div>
          <DashboardCard padding="0">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Name</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Contact</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Joined</th>
                </tr>
              </thead>
              <tbody>
                {recentClients.map((client) => (
                  <tr key={client.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textPrimary }}>
                      {client.name || 'N/A'}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textSecondary }}>{client.email || client.phone}</td>
                    <td style={{ padding: '16px 24px', fontSize: '15px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          fontSize: '12px',
                          borderRadius: borderRadius.md,
                          fontWeight: '600',
                          ...(client.status === 'ACTIVE'
                            ? { backgroundColor: colors.primaryLight, color: colors.primaryDark }
                            : client.status === 'PENDING'
                            ? { backgroundColor: '#FEF5E7', color: '#95620D' }
                            : client.status === 'SUSPENDED'
                            ? { backgroundColor: '#FDEDEC', color: '#922B21' }
                            : { backgroundColor: colors.gray100, color: colors.gray700 }
                          )
                        }}
                      >
                        {client.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textSecondary }}>
                      {new Date(client.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DashboardCard>
        </div>

        {/* Recent Service Requests */}
        <div id="recent-service-requests">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '600', color: colors.textPrimary }}>Recent Service Requests</h2>
            <Link href="/admin/requests" style={{ color: colors.primary, fontWeight: '600', fontSize: '14px', textDecoration: 'none' }}>
              View All
            </Link>
          </div>
          <DashboardCard padding="0">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Title</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Client</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Quotes</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentRequests.map((request) => (
                  <tr key={request.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textPrimary }}>{request.title}</td>
                    <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textSecondary }}>
                      {request.client.name || request.client.email || request.client.phone}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textSecondary }}>
                      {request.subcategory.category.name}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textPrimary }}>{request.quotes.length}</td>
                    <td style={{ padding: '16px 24px', fontSize: '15px' }}>
                      <span
                        style={{
                          padding: '4px 12px',
                          fontSize: '12px',
                          borderRadius: borderRadius.md,
                          fontWeight: '600',
                          ...(request.status === 'PENDING'
                            ? { backgroundColor: colors.gray100, color: colors.gray700 }
                            : request.status === 'QUOTED'
                            ? { backgroundColor: colors.blueLight, color: '#2952A3' }
                            : request.status === 'ACCEPTED' || request.status === 'COMPLETED'
                            ? { backgroundColor: colors.primaryLight, color: colors.primaryDark }
                            : { backgroundColor: '#FEF5E7', color: '#95620D' }
                          )
                        }}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '15px', color: colors.textSecondary }}>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </DashboardCard>
        </div>
    </DashboardLayoutWithHeader>
  );
}
