import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors, borderRadius } from '@/lib/theme';
import { SettleOrderButton } from './SettleOrderButton';

const prismaAny = prisma as any;

export default async function SettlementsPage() {
  const user = await getCurrentUser();

  if (!user || !user.roles?.includes('ADMIN')) {
    redirect('/auth/login');
  }

  // Fetch pending counts for badges
  const pendingBadgeRequests = await prismaAny.badgeRequest?.count({
    where: {
      status: {
        in: ['PENDING', 'PAYMENT_RECEIVED', 'UNDER_REVIEW'],
      },
    },
  }) ?? 0;

  const pendingAgentApplications = await prismaAny.agent?.count({
    where: {
      status: 'PENDING',
    },
  }) ?? 0;

  const pendingReports = await prismaAny.reviewReport?.count({
    where: {
      status: {
        in: ['PENDING', 'REVIEWING'],
      },
    },
  }) ?? 0;

  // Fetch all PAID orders (ready for settlement)
  const paidOrders = await prisma.order.findMany({
    where: { status: 'PAID' },
    include: {
      gig: true,
      package: true,
      request: true,
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
      payment: true,
    },
    orderBy: {
      acceptedAt: 'desc',
    },
  });

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminDashboardWrapper
      userName={user.name || 'Admin'}
      userAvatar={user.profileImage || undefined}
      pendingBadgeRequests={pendingBadgeRequests}
      pendingAgentApplications={pendingAgentApplications}
      pendingReports={pendingReports}
    >
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
          Payment Settlements
        </h1>
        <p style={{ fontSize: '16px', color: colors.textLight }}>
          Review and settle payments with fixers
        </p>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', marginBottom: '32px' }}>
        <div style={{
          backgroundColor: colors.white,
          padding: '24px',
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
            Pending Settlements
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.warning }}>
            {paidOrders.length}
          </div>
        </div>

        <div style={{
          backgroundColor: colors.white,
          padding: '24px',
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
            Total Amount
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary }}>
            ₦{paidOrders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}
          </div>
        </div>

        <div style={{
          backgroundColor: colors.white,
          padding: '24px',
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600' }}>
            To Settle with Fixers
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.success }}>
            ₦{paidOrders.reduce((sum, order) => sum + order.fixerAmount, 0).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Orders Table */}
      <div style={{
        backgroundColor: colors.white,
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden',
      }}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${colors.border}` }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
            Orders Ready for Settlement
          </h2>
        </div>

        {paidOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 40px', color: colors.textSecondary }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💳</div>
            <p style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: colors.textPrimary }}>
              No payments to settle
            </p>
            <p style={{ fontSize: '14px' }}>All orders have been settled or are not yet paid</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: colors.bgSecondary }}>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                    Order ID
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                    Service
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                    Fixer
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                    Client
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                    Order Total
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                    Fixer Earnings
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                    Paid Date
                  </th>
                  <th style={{ padding: '16px 24px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {paidOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: colors.textPrimary, fontFamily: 'monospace' }}>
                      #{order.id.slice(-8).toUpperCase()}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: colors.textPrimary }}>
                      <div style={{ fontWeight: '500' }}>
                        {order.gig?.title || order.request?.title || 'Service'}
                      </div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
                        {order.gig ? order.package?.name : 'Service Request'}
                      </div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: colors.textPrimary }}>
                      <div style={{ fontWeight: '500' }}>{order.fixer.name || 'Anonymous'}</div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>{order.fixer.email}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: colors.textPrimary }}>
                      <div style={{ fontWeight: '500' }}>{order.client.name || 'Anonymous'}</div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>{order.client.email}</div>
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '16px', fontWeight: '600', color: colors.textPrimary, textAlign: 'right', fontFamily: 'monospace' }}>
                      ₦{order.totalAmount.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '16px', fontWeight: '600', color: colors.success, textAlign: 'right', fontFamily: 'monospace' }}>
                      ₦{order.fixerAmount.toLocaleString()}
                    </td>
                    <td style={{ padding: '16px 24px', fontSize: '14px', color: colors.textSecondary }}>
                      {formatDate(order.acceptedAt)}
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'center' }}>
                      <SettleOrderButton orderId={order.id} sellerName={order.fixer.name || 'Fixer'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminDashboardWrapper>
  );
}
