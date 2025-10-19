import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors, borderRadius } from '@/lib/theme';
import { SettleOrderButton } from '@/app/admin/settlements/SettleOrderButton';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function AdminOrderDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user || !user.roles?.includes('ADMIN')) {
    redirect('/auth/login');
  }

  const { orderId } = await params;

  // Fetch pending counts for AdminDashboardWrapper
  const prismaAny = prisma as any;

  const [pendingBadgeRequests, pendingAgentApplications, pendingReports] = await Promise.all([
    prismaAny.badgeRequest?.count({
      where: {
        status: {
          in: ['PENDING', 'PAYMENT_RECEIVED', 'UNDER_REVIEW'],
        },
      },
    }) ?? 0,
    prismaAny.agent?.count({
      where: {
        status: 'PENDING',
      },
    }) ?? 0,
    prismaAny.reviewReport?.count({
      where: {
        status: {
          in: ['PENDING', 'REVIEWING'],
        },
      },
    }) ?? 0,
  ]);

  // Fetch order details
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
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
      request: {
        include: {
          subcategory: {
            include: {
              category: true,
            },
          },
        },
      },
      quote: true,
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      fixer: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      payment: true,
    },
  });

  if (!order) {
    notFound();
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return `₦${amount.toLocaleString()}`;
  };

  const statusColors: Record<string, string> = {
    PENDING_PAYMENT: '#ffc107',
    PAID: '#007bff',
    IN_PROGRESS: colors.primary,
    COMPLETED: '#28a745',
    SETTLED: '#28a745',
    CANCELLED: '#dc3545',
    REFUNDED: colors.textSecondary,
  };

  return (
    <AdminDashboardWrapper
      userName={user.name || 'Admin'}
      userAvatar={user.profileImage || undefined}
      pendingBadgeRequests={pendingBadgeRequests}
      pendingAgentApplications={pendingAgentApplications}
      pendingReports={pendingReports}
    >
      {/* Custom Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
          Order Details
        </h1>
        <Link
          href="/admin/settlements"
          style={{
            color: colors.primary,
            textDecoration: 'none',
            fontSize: '14px',
            display: 'inline-block',
          }}
        >
          ← Back to Settlements
        </Link>
      </div>

      <div style={{ display: 'grid', gap: '24px' }}>
        {/* Order Status Card */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: borderRadius.lg,
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
                Order Status
              </h2>
              <div style={{
                display: 'inline-block',
                padding: '6px 12px',
                borderRadius: borderRadius.md,
                backgroundColor: statusColors[order.status] || colors.textSecondary,
                color: 'white',
                fontSize: '14px',
                fontWeight: '600',
              }}>
                {order.status.replace(/_/g, ' ')}
              </div>
            </div>
            {order.status === 'COMPLETED' && order.payment?.status === 'HELD_IN_ESCROW' && (
              <SettleOrderButton orderId={order.id} sellerName={order.fixer.name || 'Service Provider'} />
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>Order ID</div>
              <div style={{ fontSize: '14px', color: colors.textPrimary, fontFamily: 'monospace' }}>{order.id}</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>Created</div>
              <div style={{ fontSize: '14px', color: colors.textPrimary }}>{formatDate(order.createdAt)}</div>
            </div>
            {order.startedAt && (
              <div>
                <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>Started</div>
                <div style={{ fontSize: '14px', color: colors.textPrimary }}>{formatDate(order.startedAt)}</div>
              </div>
            )}
            {order.completedAt && (
              <div>
                <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>Completed</div>
                <div style={{ fontSize: '14px', color: colors.textPrimary }}>{formatDate(order.completedAt)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Service Details */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: borderRadius.lg,
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px' }}>
            Service Details
          </h2>
          {order.gig ? (
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                {order.gig.title}
              </div>
              <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>
                Category: {order.gig.subcategory?.category?.name} → {order.gig.subcategory?.name}
              </div>
              {order.package && (
                <div style={{ fontSize: '14px', color: colors.textSecondary }}>
                  Package: {order.package.name} ({order.package.deliveryDays} days delivery)
                </div>
              )}
            </div>
          ) : order.request ? (
            <div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                {order.request.title}
              </div>
              <div style={{ fontSize: '14px', color: colors.textSecondary }}>
                Category: {order.request.subcategory?.category?.name} → {order.request.subcategory?.name}
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '14px', color: colors.textSecondary }}>No service details available</div>
          )}
        </div>

        {/* Financial Details */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: borderRadius.lg,
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px' }}>
            Financial Breakdown
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: `1px solid ${colors.border}` }}>
              <span style={{ fontSize: '14px', color: colors.textSecondary }}>Total Amount</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>{formatAmount(Number(order.totalAmount))}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: colors.textSecondary }}>Platform Fee (20%)</span>
              <span style={{ fontSize: '14px', color: colors.textPrimary }}>{formatAmount(Number(order.platformFee))}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: `1px solid ${colors.border}` }}>
              <span style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>Fixer Payout</span>
              <span style={{ fontSize: '16px', fontWeight: '600', color: '#28a745' }}>{formatAmount(Number(order.fixerAmount))}</span>
            </div>
          </div>
        </div>

        {/* Parties Involved */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
          {/* Client Details */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: borderRadius.lg,
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px' }}>
              Client
            </h2>
            <div style={{ display: 'grid', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>Name</div>
                <div style={{ fontSize: '14px', color: colors.textPrimary, fontWeight: '500' }}>{order.client.name || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>Email</div>
                <div style={{ fontSize: '14px', color: colors.textPrimary }}>{order.client.email || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>Phone</div>
                <div style={{ fontSize: '14px', color: colors.textPrimary }}>{order.client.phone || 'N/A'}</div>
              </div>
              <Link
                href={`/admin/users/${order.client.id}`}
                style={{
                  marginTop: '8px',
                  color: colors.primary,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                View Profile →
              </Link>
            </div>
          </div>

          {/* Fixer Details */}
          <div style={{
            backgroundColor: 'white',
            borderRadius: borderRadius.lg,
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px' }}>
              Service Provider
            </h2>
            <div style={{ display: 'grid', gap: '8px' }}>
              <div>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>Name</div>
                <div style={{ fontSize: '14px', color: colors.textPrimary, fontWeight: '500' }}>{order.fixer.name || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>Email</div>
                <div style={{ fontSize: '14px', color: colors.textPrimary }}>{order.fixer.email || 'N/A'}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: colors.textSecondary }}>Phone</div>
                <div style={{ fontSize: '14px', color: colors.textPrimary }}>{order.fixer.phone || 'N/A'}</div>
              </div>
              <Link
                href={`/admin/users/${order.fixer.id}`}
                style={{
                  marginTop: '8px',
                  color: colors.primary,
                  fontSize: '14px',
                  textDecoration: 'none',
                }}
              >
                View Profile →
              </Link>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        {order.payment && (
          <div style={{
            backgroundColor: 'white',
            borderRadius: borderRadius.lg,
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>
            <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px' }}>
              Payment Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>Payment Status</div>
                <div style={{
                  display: 'inline-block',
                  padding: '4px 8px',
                  borderRadius: borderRadius.sm,
                  backgroundColor: order.payment.status === 'RELEASED' ? '#28a745' : '#007bff',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                }}>
                  {order.payment.status.replace(/_/g, ' ')}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>Payment ID</div>
                <div style={{ fontSize: '14px', color: colors.textPrimary, fontFamily: 'monospace' }}>{order.payment.stripePaymentId}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>Paid At</div>
                <div style={{ fontSize: '14px', color: colors.textPrimary }}>{formatDate(order.payment.paidAt)}</div>
              </div>
              {order.payment.releasedAt && (
                <div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>Released At</div>
                  <div style={{ fontSize: '14px', color: colors.textPrimary }}>{formatDate(order.payment.releasedAt)}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminDashboardWrapper>
  );
}
