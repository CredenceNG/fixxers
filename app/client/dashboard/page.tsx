import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard, DashboardButton, DashboardStat } from '@/components/DashboardLayout';
import { PurseBalanceInline } from '@/components/PurseBalanceInline';
import { colors, borderRadius } from '@/lib/theme';
import { CancelButton } from './CancelButton';

export default async function ClientDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user has CLIENT role
  const roles = user.roles || [];
  if (!roles.includes('CLIENT')) {
    redirect('/auth/login');
  }

  // Check if user has multiple roles (dual-role)
  const hasFIXERRole = roles.includes('FIXER');

  // Fetch client's service requests with quotes
  const requests = await prisma.serviceRequest.findMany({
    where: { clientId: user.id },
    include: {
      subcategory: {
        include: {
          category: true,
        },
      },
      neighborhood: true,
      quotes: {
        include: {
          fixer: true,
        },
      },
      order: {
        include: {
          payment: true,
          review: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch all active orders (both service request and gig orders)
  const activeOrders = await prisma.order.findMany({
    where: {
      clientId: user.id,
      status: { in: ['PENDING', 'PAID', 'IN_PROGRESS'] },
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
    },
    orderBy: { createdAt: 'desc' },
  });

  // Fetch completed orders (both types)
  const completedOrders = await prisma.order.findMany({
    where: {
      clientId: user.id,
      status: 'COMPLETED',
    },
    include: {
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
      package: true,
      review: true,
    },
    orderBy: { completedAt: 'desc' },
    take: 5,
  });

  // Separate active orders by type
  const activeServiceOrders = activeOrders.filter((o) => o.requestId);
  const activeGigOrders = activeOrders.filter((o) => o.gigId);
  const completedGigOrders = completedOrders.filter((o) => o.gigId);

  const stats = {
    totalRequests: requests.length,
    pendingRequests: requests.filter((r) => ['PENDING', 'APPROVED'].includes(r.status)).length,
    activeOrders: activeOrders.length + activeGigOrders.length,
    completedOrders: await prisma.order.count({
      where: { clientId: user.id, status: 'COMPLETED' },
    }) + completedGigOrders.length,
  };

  return (
    <DashboardLayoutWithHeader
      title="Client Dashboard"
      subtitle={`Welcome back, ${user.name || user.email || user.phone}`}
      actions={
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <PurseBalanceInline />
          {hasFIXERRole && (
            <DashboardButton variant="outline" href="/fixer/dashboard">
              🔧 Switch to Fixer Mode
            </DashboardButton>
          )}
          <DashboardButton variant="outline" href="/client/profile">
            Edit Profile
          </DashboardButton>
          <DashboardButton href="/client/requests/new">
            + New Request
          </DashboardButton>
        </div>
      }
    >
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <DashboardStat label="Total Requests" value={stats.totalRequests} icon="📋" />
        <DashboardStat label="Pending Requests" value={stats.pendingRequests} icon="⏳" color={colors.warning} />
        <DashboardStat label="Active Orders" value={stats.activeOrders} icon="🔧" color={colors.primary} />
        <DashboardStat label="Completed" value={stats.completedOrders} icon="✅" color={colors.success} />
      </div>

      {/* Gig Orders */}
      {activeGigOrders.length > 0 && (
        <DashboardCard title="My Orders" style={{ marginBottom: '32px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Service</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Seller</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Package</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Amount</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {activeGigOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
                        {order.gig?.title}
                      </div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                        Ordered {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                      {order.fixer?.name || order.fixer?.email || 'Anonymous'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                      {order.package?.name || 'N/A'}
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
                          : order.status === 'PAID' ? colors.primaryLight
                          : order.status === 'PAID_PARTIAL' ? colors.warningLight
                          : colors.errorLight,
                        color: order.status === 'COMPLETED' ? colors.success
                          : order.status === 'PAID' ? colors.primary
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

      {/* Active Orders (legacy service requests) */}
      {activeOrders.length > 0 && (
        <DashboardCard title="Active Orders" style={{ marginBottom: '32px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Service</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Fixer</th>
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
                        {order.request?.subcategory?.category?.name || order.gig?.subcategory?.category?.name || 'N/A'}
                      </div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                        {order.request?.subcategory?.name || order.gig?.subcategory?.name || 'N/A'}
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                      {order.fixer.name || order.fixer.email || order.fixer.phone}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>₦{order.totalAmount.toLocaleString()}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        borderRadius: borderRadius.full,
                        backgroundColor: order.status === 'PAID' ? colors.primaryLight : order.status === 'IN_PROGRESS' ? colors.warningLight : colors.bgTertiary,
                        color: order.status === 'PAID' ? colors.primary : order.status === 'IN_PROGRESS' ? colors.warning : colors.textSecondary
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

      {/* Service Requests */}
      <DashboardCard title="My Service Requests" style={{ marginBottom: '32px' }}>
        {requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ color: colors.textSecondary, marginBottom: '16px' }}>You haven't made any service requests yet</p>
            <Link
              href="/client/requests/new"
              style={{ color: colors.primary, fontWeight: '600', textDecoration: 'none' }}
            >
              Create your first request
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Title</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Category</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Quotes</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Created</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => (
                  <tr key={request.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>{request.title}</div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary }}>{request.neighborhood.name}</div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                      {request.subcategory.category.name}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>{request.quotes.length}</td>
                    <td style={{ padding: '16px' }}>
                      <span style={{
                        padding: '4px 12px',
                        fontSize: '12px',
                        fontWeight: '600',
                        borderRadius: borderRadius.full,
                        backgroundColor: request.status === 'PENDING' ? colors.bgTertiary
                          : request.status === 'APPROVED' ? colors.successLight
                          : request.status === 'QUOTED' ? colors.primaryLight
                          : request.status === 'ACCEPTED' ? colors.primaryDark
                          : colors.errorLight,
                        color: request.status === 'PENDING' ? colors.textSecondary
                          : request.status === 'APPROVED' ? colors.success
                          : request.status === 'QUOTED' ? colors.primary
                          : request.status === 'ACCEPTED' ? colors.white
                          : colors.error
                      }}>
                        {request.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textSecondary }}>
                      {new Date(request.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <Link
                          href={`/client/requests/${request.id}`}
                          style={{ color: colors.primary, fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}
                        >
                          View
                        </Link>
                        {!['CANCELLED', 'ACCEPTED'].includes(request.status) && (
                          <CancelButton requestId={request.id} requestTitle={request.title} />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>

      {/* Recent Completed Orders */}
      {completedOrders.length > 0 && (
        <DashboardCard title="Recently Completed">
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Service</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Fixer</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Completed</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Review</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {completedOrders.map((order) => (
                  <tr key={order.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                      {order.request?.subcategory?.name || order.gig?.subcategory?.name || 'N/A'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textPrimary }}>
                      {order.fixer?.name || order.fixer?.email || order.fixer?.phone || 'N/A'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px', color: colors.textSecondary }}>
                      {order.completedAt ? new Date(order.completedAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td style={{ padding: '16px', fontSize: '14px' }}>
                      {order.review ? (
                        <span style={{ color: colors.success, fontWeight: '600' }}>Reviewed</span>
                      ) : (
                        <Link
                          href={`/client/orders/${order.id}/review`}
                          style={{ color: colors.primary, fontWeight: '600', textDecoration: 'none' }}
                        >
                          Leave Review
                        </Link>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <Link href={`/client/orders/${order.id}`} style={{ color: colors.primary, fontSize: '14px', fontWeight: '600', textDecoration: 'none' }}>
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      )}
    </DashboardLayoutWithHeader>
  );
}
