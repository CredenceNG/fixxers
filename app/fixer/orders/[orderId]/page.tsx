import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard, DashboardButton } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';
import OrderActions from '@/components/OrderActions';
import { MessagesThread } from './MessagesThread';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const user = await getCurrentUser();
  const roles = user?.roles || [];

  if (!user || !roles.includes('FIXER')) {
    redirect('/auth/login');
  }

  const { orderId } = await params;

  // Get order from unified Order table
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      // Gig order relations
      gig: true,
      package: true,

      // Service request order relations
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

      // Common relations
      client: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profileImage: true,
        },
      },
      fixer: {
        select: {
          id: true,
          name: true,
        },
      },
      payment: true,
    },
  });

  if (!order) {
    notFound();
  }

  if (order.fixerId !== user.id) {
    redirect('/fixer/orders');
  }

  // If this is a service request order, redirect to dedicated view
  if (order.requestId) {
    redirect(`/fixer/orders/${orderId}/view`);
  }

  // Otherwise, it's a gig order - show gig order view below

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, any> = {
      PENDING: { bg: colors.warningLight, color: colors.warning },
      IN_PROGRESS: { bg: colors.primaryLight, color: colors.primary },
      COMPLETED: { bg: colors.successLight, color: colors.success },
      PAID: { bg: colors.successLight, color: colors.success },
      SETTLED: { bg: '#E8F5E9', color: '#2E7D32' },
      CANCELLED: { bg: colors.errorLight, color: colors.error },
      DISPUTED: { bg: colors.errorLight, color: colors.error },
    };

    const style = styles[status] || styles.PENDING;

    return (
      <span
        style={{
          padding: '6px 16px',
          fontSize: '14px',
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

  return (
    <DashboardLayoutWithHeader
      title={`Order #${order.id.slice(-8).toUpperCase()}`}
      subtitle={`For: ${order.gig?.title || order.request?.title || 'Service'}`}
      actions={
        <Link href="/fixer/orders">
          <DashboardButton variant="outline">← Back to Orders</DashboardButton>
        </Link>
      }
    >
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        {/* Main Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Revision Request */}
          {order.revisionRequested && order.revisionNote && (
            <DashboardCard title="⚠️ Revision Requested">
              <div
                style={{
                  padding: '16px',
                  backgroundColor: colors.warningLight,
                  borderRadius: borderRadius.md,
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '14px', fontWeight: '600', color: colors.warning, marginBottom: '8px' }}>
                  The client has requested a revision ({order.revisionsUsed}/{order.revisionsAllowed} used)
                </div>
                <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                  Please review the feedback below and submit an updated delivery.
                </div>
              </div>
              <div style={{ fontSize: '14px', fontWeight: '500', color: colors.textPrimary, marginBottom: '8px' }}>
                Client Feedback:
              </div>
              <div
                style={{
                  fontSize: '14px',
                  color: colors.textPrimary,
                  whiteSpace: 'pre-wrap',
                  padding: '12px',
                  backgroundColor: colors.bgSecondary,
                  borderRadius: borderRadius.md,
                  borderLeft: `4px solid ${colors.warning}`,
                }}
              >
                {order.revisionNote}
              </div>
            </DashboardCard>
          )}

          {/* Messages */}
          <DashboardCard title="Messages">
            <MessagesThread orderId={order.id} currentUserId={user.id} />
          </DashboardCard>

          {/* Order Status */}
          <DashboardCard title="Order Status">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>
                  Current Status
                </div>
                {getStatusBadge(order.status)}
              </div>
              <OrderActions order={order} />
            </div>

            {/* Timeline */}
            <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: `1px solid ${colors.border}` }}>
              <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
                Order Timeline
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.success, marginTop: '6px' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
                      Order Placed
                    </div>
                    <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                      {formatDate(order.createdAt)}
                    </div>
                  </div>
                </div>

                {order.status !== 'PENDING' && (
                  <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.success, marginTop: '6px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
                        Started Working
                      </div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                        In Progress
                      </div>
                    </div>
                  </div>
                )}

                {order.deliveredAt && (
                  <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.success, marginTop: '6px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
                        Delivered
                      </div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                        {formatDate(order.deliveredAt)}
                      </div>
                    </div>
                  </div>
                )}

                {(order.status === 'PAID' || order.status === 'SETTLED') && order.acceptedAt && (
                  <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.success, marginTop: '6px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
                        Client Paid
                      </div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                        {formatDate(order.acceptedAt)}
                      </div>
                    </div>
                  </div>
                )}

                {order.status === 'SETTLED' && order.payment?.releasedAt && (
                  <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: colors.success, marginTop: '6px' }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
                        Payment Settled
                      </div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                        {formatDate(order.payment.releasedAt)}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <div
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: order.status === 'SETTLED' ? colors.success : colors.border,
                      marginTop: '6px',
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
                      Due Date
                    </div>
                    <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                      {order.deliveryDate ? formatDate(order.deliveryDate) : 'Not set'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </DashboardCard>

          {/* Package Details */}
          <DashboardCard title="Package Details">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              {order.package && (
                <>
                  <div>
                    <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px' }}>
                      Package
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                      {order.package.name}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px' }}>
                      Delivery Time
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                      {order.package.deliveryDays} days
                    </div>
                  </div>
                </>
              )}
              <div>
                <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px' }}>
                  Revisions
                </div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                  {order.revisionsUsed} / {order.revisionsAllowed}
                </div>
              </div>
            </div>

            {order.package?.features && order.package.features.length > 0 && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
                <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px' }}>
                  Features Included
                </div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                  {order.package.features.map((feature, index) => (
                    <li key={index} style={{ fontSize: '14px', color: colors.textPrimary, marginBottom: '4px' }}>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {order.package?.description && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
                <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px' }}>
                  Description
                </div>
                <div style={{ fontSize: '14px', color: colors.textPrimary }}>
                  {order.package.description}
                </div>
              </div>
            )}
          </DashboardCard>

          {/* Requirements */}
          {order.requirementResponses && (
            <DashboardCard title="Buyer Requirements">
              <div style={{ fontSize: '14px', color: colors.textPrimary, whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(order.requirementResponses, null, 2)}
              </div>
            </DashboardCard>
          )}

          {/* Delivery */}
          {order.deliveryNote && (
            <DashboardCard title="Delivery Note">
              <div style={{ fontSize: '14px', color: colors.textPrimary, whiteSpace: 'pre-wrap' }}>
                {order.deliveryNote}
              </div>
              {order.deliveryFiles && order.deliveryFiles.length > 0 && (
                <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
                  <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px' }}>
                    Attached Files
                  </div>
                  {order.deliveryFiles.map((file, index) => (
                    <div key={index} style={{ marginBottom: '4px' }}>
                      <a
                        href={file}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: '14px', color: colors.primary }}
                      >
                        File {index + 1}
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </DashboardCard>
          )}
        </div>

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Buyer Info */}
          <DashboardCard title="Buyer Information">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  backgroundColor: colors.bgTertiary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: '600',
                  color: colors.textSecondary,
                }}
              >
                {order.client.name?.charAt(0).toUpperCase() || '?'}
              </div>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                  {order.client.name || 'Anonymous'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {order.client.email && (
                <div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary }}>Email</div>
                  <div style={{ fontSize: '14px', color: colors.textPrimary }}>{order.client.email}</div>
                </div>
              )}
              {order.client.phone && (
                <div>
                  <div style={{ fontSize: '12px', color: colors.textSecondary }}>Phone</div>
                  <div style={{ fontSize: '14px', color: colors.textPrimary }}>{order.client.phone}</div>
                </div>
              )}
            </div>
          </DashboardCard>

          {/* Payment Info */}
          <DashboardCard title="Payment Information">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: colors.textSecondary }}>Order Price</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                  ₦{order.totalAmount.toLocaleString()}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: colors.textSecondary }}>Platform Fee</span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                  -₦{order.platformFee.toLocaleString()}
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: `1px solid ${colors.border}`,
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                  Your Earnings
                </span>
                <span style={{ fontSize: '18px', fontWeight: '700', color: colors.success }}>
                  ₦{order.fixerAmount.toLocaleString()}
                </span>
              </div>
            </div>
          </DashboardCard>

          {/* Gig Info */}
          {order.gig && (
            <DashboardCard title="Service Offer">
              <Link
                href={`/gigs/${order.gig.slug}`}
                style={{
                  fontSize: '15px',
                  fontWeight: '500',
                  color: colors.primary,
                  textDecoration: 'none',
                }}
              >
                {order.gig.title}
              </Link>
              <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '8px' }}>
                View the full service offer details
              </div>
            </DashboardCard>
          )}
        </div>
      </div>
    </DashboardLayoutWithHeader>
  );
}
