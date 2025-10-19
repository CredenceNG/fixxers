import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';

export default async function ClientOrdersPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user has CLIENT role
  const roles = user.roles || [];
  if (!roles.includes('CLIENT')) {
    redirect('/auth/login');
  }

  // Fetch all orders (both service request and gig orders)
  const allOrders = await prisma.order.findMany({
    where: {
      clientId: user.id,
    },
    include: {
      fixer: true,
      // Service request relations
      request: {
        include: {
          subcategory: {
            include: {
              category: true,
            },
          },
        },
      },
      // Gig order relations
      gig: {
        include: {
          subcategory: {
            include: {
              category: true,
            },
          },
        },
      },
      package: true,
      payment: true,
      review: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  // Separate active and completed orders
  const activeOrders = allOrders.filter((order) =>
    ['PENDING', 'PAID', 'IN_PROGRESS'].includes(order.status)
  );
  const completedOrders = allOrders.filter((order) => order.status === 'COMPLETED');

  return (
    <DashboardLayoutWithHeader
      title="My Orders"
      subtitle="Manage all your service orders"
    >
      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <DashboardCard title="Active Orders" style={{ marginBottom: '32px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Service</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Provider</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
                        {order.gig?.title || order.request?.title || 'Service'}
                      </div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                        {order.gig ? 'Gig Order' : 'Service Request'}
                        {order.package && ` • ${order.package.name}`}
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                      {order.fixer?.name || order.fixer?.email || 'Anonymous'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                      ₦{order.totalAmount?.toLocaleString() || '0'}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        borderRadius: borderRadius.full,
                        backgroundColor: order.status === 'COMPLETED' ? colors.successLight
                          : order.status === 'PAID' || order.status === 'IN_PROGRESS' ? colors.primaryLight
                          : order.status === 'PAID_PARTIAL' ? colors.warningLight
                          : colors.errorLight,
                        color: order.status === 'COMPLETED' ? colors.success
                          : order.status === 'PAID' || order.status === 'IN_PROGRESS' ? colors.primary
                          : order.status === 'PAID_PARTIAL' ? colors.warning
                          : colors.error
                      }}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Link href={`/client/orders/${order.id}`} style={{ color: colors.primary, fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      )}

      {/* Completed Orders */}
      {completedOrders.length > 0 && (
        <DashboardCard title="Completed Orders">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Service</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Provider</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Completed</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {completedOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
                        {order.gig?.title || order.request?.title || 'Service'}
                      </div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                        {order.gig ? 'Gig Order' : 'Service Request'}
                        {order.package && ` • ${order.package.name}`}
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                      {order.fixer?.name || order.fixer?.email || 'Anonymous'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                      ₦{order.totalAmount?.toLocaleString() || '0'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textSecondary }}>
                      {new Date(order.completedAt || order.updatedAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Link href={`/client/orders/${order.id}`} style={{ color: colors.primary, fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
                          View
                        </Link>
                        {!order.review && (
                          <Link
                            href={`/orders/${order.id}/review`}
                            style={{
                              padding: '4px 12px',
                              fontSize: '13px',
                              fontWeight: '600',
                              color: colors.white,
                              backgroundColor: colors.primary,
                              border: 'none',
                              borderRadius: borderRadius.md,
                              textDecoration: 'none',
                            }}
                          >
                            Leave Review
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      )}

      {/* Empty State */}
      {allOrders.length === 0 && (
        <DashboardCard>
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ color: colors.textSecondary, marginBottom: '16px', fontSize: '16px' }}>
              You don't have any orders yet
            </p>
            <Link
              href="/gigs"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: colors.primary,
                color: colors.white,
                borderRadius: borderRadius.lg,
                fontWeight: '600',
                textDecoration: 'none',
                marginRight: '12px',
              }}
            >
              Browse Services
            </Link>
            <Link
              href="/client/requests/new"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: colors.white,
                color: colors.primary,
                border: `2px solid ${colors.primary}`,
                borderRadius: borderRadius.lg,
                fontWeight: '600',
                textDecoration: 'none',
              }}
            >
              Create Request
            </Link>
          </div>
        </DashboardCard>
      )}
    </DashboardLayoutWithHeader>
  );
}
