import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard, DashboardButton, DashboardStat } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';

export default async function FixerOrdersPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'FIXER') {
    redirect('/auth/login');
  }

  // Fetch all orders (both gig and service request orders)
  const orders = await prisma.order.findMany({
    where: {
      fixerId: user.id,
      gigId: { not: null }, // Only gig orders for this page
    },
    include: {
      gig: true,
      package: true,
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
        },
      },
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'PENDING').length,
    paid: orders.filter((o) => o.status === 'PAID').length,
    completed: orders.filter((o) => o.status === 'COMPLETED').length,
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, any> = {
      PENDING: { bg: colors.warningLight, color: colors.warning },
      PAID: { bg: colors.primaryLight, color: colors.primary },
      COMPLETED: { bg: colors.successLight, color: colors.success },
      CANCELLED: { bg: colors.errorLight, color: colors.error },
      DISPUTED: { bg: colors.errorLight, color: colors.error },
      SETTLED: { bg: colors.successLight, color: colors.success },
    };

    const style = styles[status] || styles.PENDING;

    return (
      <span
        style={{
          padding: '4px 12px',
          fontSize: '12px',
          fontWeight: '600',
          borderRadius: borderRadius.full,
          backgroundColor: style.bg,
          color: style.color,
        }}
      >
        {status.replace('_', ' ')}
      </span>
    );
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <DashboardLayoutWithHeader
      title="Gig Orders"
      subtitle="Manage your service orders from clients"
    >
      {/* Stats */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '20px',
          marginBottom: '32px',
        }}
      >
        <DashboardStat label="Total Orders" value={stats.total} icon="📦" />
        <DashboardStat
          label="Pending"
          value={stats.pending}
          icon="⏳"
          color={colors.warning}
        />
        <DashboardStat
          label="Paid"
          value={stats.paid}
          icon="💰"
          color={colors.primary}
        />
        <DashboardStat
          label="Completed"
          value={stats.completed}
          icon="✅"
          color={colors.success}
        />
      </div>

      {/* Orders List */}
      <DashboardCard title="All Orders">
        {orders.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ fontSize: '16px', color: colors.textSecondary }}>
              No orders yet. Start getting orders by creating service offers!
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                  <th style={{ padding: '16px', textAlign: 'left', color: colors.textSecondary, fontWeight: '600', fontSize: '13px' }}>
                    ORDER ID
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', color: colors.textSecondary, fontWeight: '600', fontSize: '13px' }}>
                    GIG
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', color: colors.textSecondary, fontWeight: '600', fontSize: '13px' }}>
                    BUYER
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', color: colors.textSecondary, fontWeight: '600', fontSize: '13px' }}>
                    PACKAGE
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', color: colors.textSecondary, fontWeight: '600', fontSize: '13px' }}>
                    AMOUNT
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', color: colors.textSecondary, fontWeight: '600', fontSize: '13px' }}>
                    DUE DATE
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', color: colors.textSecondary, fontWeight: '600', fontSize: '13px' }}>
                    STATUS
                  </th>
                  <th style={{ padding: '16px', textAlign: 'left', color: colors.textSecondary, fontWeight: '600', fontSize: '13px' }}>
                    ACTIONS
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom: `1px solid ${colors.border}`,
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: colors.textPrimary }}>
                        #{order.id.slice(-8).toUpperCase()}
                      </div>
                      <div style={{ fontSize: '12px', color: colors.textSecondary }}>
                        {formatDate(order.createdAt)}
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      {order.gig && (
                        <Link
                          href={`/gigs/${order.gig.slug}`}
                          style={{
                            fontSize: '14px',
                            color: colors.primary,
                            textDecoration: 'none',
                            fontWeight: '500',
                          }}
                        >
                          {order.gig.title}
                        </Link>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: colors.bgTertiary,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: colors.textSecondary,
                          }}
                        >
                          {order.client.name?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
                            {order.client.name || 'Anonymous'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                      {order.package?.name || 'N/A'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
                        ₦{order.totalAmount.toLocaleString()}
                      </div>
                      <div style={{ fontSize: '12px', color: colors.success }}>
                        You earn: ₦{order.fixerAmount.toLocaleString()}
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                      {order.deliveryDate ? formatDate(order.deliveryDate) : 'Not set'}
                    </td>
                    <td style={{ padding: '16px' }}>{getStatusBadge(order.status)}</td>
                    <td style={{ padding: '16px' }}>
                      <Link
                        href={`/fixer/orders/${order.id}`}
                        style={{
                          padding: '6px 12px',
                          fontSize: '13px',
                          fontWeight: '600',
                          color: colors.primary,
                          backgroundColor: colors.white,
                          border: `1px solid ${colors.primary}`,
                          borderRadius: borderRadius.md,
                          textDecoration: 'none',
                          display: 'inline-block',
                        }}
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>
    </DashboardLayoutWithHeader>
  );
}
