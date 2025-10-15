import { redirect, notFound } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard } from '@/components/DashboardLayout';
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
    PENDING_PAYMENT: colors.warning,
    PAID: colors.info,
    IN_PROGRESS: colors.primary,
    COMPLETED: colors.success,
    SETTLED: colors.success,
    CANCELLED: colors.error,
    REFUNDED: colors.textSecondary,
  };

  return (
    <DashboardLayoutWithHeader user={user}>
      <div style={{ padding: '32px' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <Link
            href="/admin/settlements"
            style={{
              color: colors.primary,
              textDecoration: 'none',
              fontSize: '14px',
              marginBottom: '8px',
              display: 'inline-block',
            }}
          >
            ← Back to Settlements
          </Link>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: colors.text }}>
            Order Details
          </h1>
        </div>

        <div style={{ display: 'grid', gap: '24px' }}>
          {/* Order Status Card */}
          <DashboardCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '24px' }}>
              <div>
                <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>
                  Order Status
                </h2>
                <div style={{
                  display: 'inline-block',
                  padding: '6px 12px',
                  borderRadius: borderRadius.medium,
                  backgroundColor: statusColors[order.status] || colors.textSecondary,
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                }}>
                  {order.status.replace(/_/g, ' ')}
                </div>
              </div>
              {order.status === 'COMPLETED' && order.payment?.status === 'HELD_IN_ESCROW' && (
                <SettleOrderButton orderId={order.id} />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
              <div>
                <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>Order ID</div>
                <div style={{ fontSize: '14px', color: colors.text, fontFamily: 'monospace' }}>{order.id}</div>
              </div>
              <div>
                <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>Created</div>
                <div style={{ fontSize: '14px', color: colors.text }}>{formatDate(order.createdAt)}</div>
              </div>
              {order.startedAt && (
                <div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>Started</div>
                  <div style={{ fontSize: '14px', color: colors.text }}>{formatDate(order.startedAt)}</div>
                </div>
              )}
              {order.completedAt && (
                <div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>Completed</div>
                  <div style={{ fontSize: '14px', color: colors.text }}>{formatDate(order.completedAt)}</div>
                </div>
              )}
            </div>
          </DashboardCard>

          {/* Service Details */}
          <DashboardCard>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.text, marginBottom: '16px' }}>
              Service Details
            </h2>
            {order.gig ? (
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '8px' }}>
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
                <div style={{ fontSize: '16px', fontWeight: '600', color: colors.text, marginBottom: '8px' }}>
                  {order.request.title}
                </div>
                <div style={{ fontSize: '14px', color: colors.textSecondary }}>
                  Category: {order.request.subcategory?.category?.name} → {order.request.subcategory?.name}
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '14px', color: colors.textSecondary }}>No service details available</div>
            )}
          </DashboardCard>

          {/* Financial Details */}
          <DashboardCard>
            <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.text, marginBottom: '16px' }}>
              Financial Breakdown
            </h2>
            <div style={{ display: 'grid', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '12px', borderBottom: `1px solid ${colors.border}` }}>
                <span style={{ fontSize: '14px', color: colors.textSecondary }}>Total Amount</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: colors.text }}>{formatAmount(Number(order.totalAmount))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: colors.textSecondary }}>Platform Fee (20%)</span>
                <span style={{ fontSize: '14px', color: colors.text }}>{formatAmount(Number(order.platformFee))}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '12px', borderTop: `1px solid ${colors.border}` }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: colors.text }}>Fixer Payout</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: colors.success }}>{formatAmount(Number(order.fixerAmount))}</span>
              </div>
            </div>
          </DashboardCard>

          {/* Parties Involved */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
            {/* Client Details */}
            <DashboardCard>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.text, marginBottom: '16px' }}>
                Client
              </h2>
              <div style={{ display: 'grid', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary }}>Name</div>
                  <div style={{ fontSize: '14px', color: colors.text, fontWeight: '500' }}>{order.client.name || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary }}>Email</div>
                  <div style={{ fontSize: '14px', color: colors.text }}>{order.client.email || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary }}>Phone</div>
                  <div style={{ fontSize: '14px', color: colors.text }}>{order.client.phone || 'N/A'}</div>
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
            </DashboardCard>

            {/* Fixer Details */}
            <DashboardCard>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', color: colors.text, marginBottom: '16px' }}>
                Service Provider
              </h2>
              <div style={{ display: 'grid', gap: '8px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary }}>Name</div>
                  <div style={{ fontSize: '14px', color: colors.text, fontWeight: '500' }}>{order.fixer.name || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary }}>Email</div>
                  <div style={{ fontSize: '14px', color: colors.text }}>{order.fixer.email || 'N/A'}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary }}>Phone</div>
                  <div style={{ fontSize: '14px', color: colors.text }}>{order.fixer.phone || 'N/A'}</div>
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
            </DashboardCard>
          </div>

          {/* Payment Details */}
          {order.payment && (
            <DashboardCard>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: colors.text, marginBottom: '16px' }}>
                Payment Information
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>Payment Status</div>
                  <div style={{
                    display: 'inline-block',
                    padding: '4px 8px',
                    borderRadius: borderRadius.small,
                    backgroundColor: order.payment.status === 'RELEASED' ? colors.success : colors.info,
                    color: 'white',
                    fontSize: '12px',
                    fontWeight: '600',
                  }}>
                    {order.payment.status.replace(/_/g, ' ')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>Payment ID</div>
                  <div style={{ fontSize: '14px', color: colors.text, fontFamily: 'monospace' }}>{order.payment.stripePaymentId}</div>
                </div>
                <div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>Paid At</div>
                  <div style={{ fontSize: '14px', color: colors.text }}>{formatDate(order.payment.paidAt)}</div>
                </div>
                {order.payment.releasedAt && (
                  <div>
                    <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>Released At</div>
                    <div style={{ fontSize: '14px', color: colors.text }}>{formatDate(order.payment.releasedAt)}</div>
                  </div>
                )}
              </div>
            </DashboardCard>
          )}
        </div>
      </div>
    </DashboardLayoutWithHeader>
  );
}
