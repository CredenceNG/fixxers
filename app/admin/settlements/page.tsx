import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';
import { SettleOrderButton } from './SettleOrderButton';

export default async function SettlementsPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/auth/login');
  }

  // Fetch all PAID orders (ready for settlement)
  const paidOrders = await prisma.order.findMany({
    where: { status: 'PAID' },
    include: {
      gig: true,
      package: true,
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
    <DashboardLayoutWithHeader
      title="Payment Settlements"
      subtitle="Review and settle payments with fixers"
    >
      <DashboardCard>
        {paidOrders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>
            <p style={{ fontSize: '16px', marginBottom: '8px' }}>No payments to settle</p>
            <p style={{ fontSize: '14px' }}>All orders have been settled or are not yet paid</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Order ID
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Service
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Fixer
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Client
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Order Total
                  </th>
                  <th style={{ padding: '12px', textAlign: 'right', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Fixer Earnings
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Paid Date
                  </th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '13px', fontWeight: '600', color: colors.textSecondary }}>
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {paidOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '12px', fontSize: '14px', color: colors.textPrimary }}>
                      #{order.id.slice(-8).toUpperCase()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: colors.textPrimary }}>
                      <div style={{ fontWeight: '500' }}>
                        {order.gig?.title || order.request?.title || 'Service'}
                      </div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                        {order.gig ? order.package?.name : 'Service Request'}
                      </div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: colors.textPrimary }}>
                      <div>{order.fixer.name || 'Anonymous'}</div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary }}>{order.fixer.email}</div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: colors.textPrimary }}>
                      <div>{order.client.name || 'Anonymous'}</div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary }}>{order.client.email}</div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, textAlign: 'right' }}>
                      ₦{order.totalAmount.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: colors.success, textAlign: 'right' }}>
                      ₦{order.fixerAmount.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', color: colors.textSecondary }}>
                      {formatDate(order.acceptedAt)}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <SettleOrderButton orderId={order.id} sellerName={order.fixer.name || 'Fixer'} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>

      {/* Summary Card */}
      <DashboardCard title="Summary" style={{ marginTop: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px' }}>
              Pending Settlements
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: colors.warning }}>
              {paidOrders.length}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px' }}>
              Total Amount
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: colors.textPrimary }}>
              ₦{paidOrders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px' }}>
              To Settle with Fixers
            </div>
            <div style={{ fontSize: '24px', fontWeight: '700', color: colors.success }}>
              ₦{paidOrders.reduce((sum, order) => sum + order.fixerAmount, 0).toLocaleString()}
            </div>
          </div>
        </div>
      </DashboardCard>
    </DashboardLayoutWithHeader>
  );
}
