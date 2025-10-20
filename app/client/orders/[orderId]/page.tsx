import { notFound, redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard, DashboardButton } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';
import { CancelOrderButton } from './CancelOrderButton';
import { ContactSellerButton } from './ContactSellerButton';
import { MessagesThread } from './MessagesThread';
import { AcceptDeliveryButton } from './AcceptDeliveryButton';
import { RequestRevisionButton } from './RequestRevisionButton';

export default async function ClientOrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const user = await getCurrentUser();
  const roles = user?.roles || [];

  if (!user || !roles.includes('CLIENT')) {
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
      request: true,

      // Common relations
      fixer: true,
      client: true,
    },
  });

  if (!order) {
    notFound();
  }

  // Verify ownership
  if (order.clientId !== user.id) {
    redirect('/client/dashboard');
  }

  // If service order, redirect to request details
  if (order.requestId) {
    redirect(`/client/requests/${order.requestId}`);
  }

  // Otherwise, it's a gig order - show gig order view below

  const statusColors: Record<string, string> = {
    PENDING: colors.warning,
    IN_PROGRESS: colors.primary,
    COMPLETED: colors.success,
    CANCELLED: colors.error,
  };

  const statusColor = statusColors[order.status] || colors.gray500;

  return (
    <DashboardLayoutWithHeader
      title="Order Details"
      subtitle={`Order #${order.id.slice(0, 8)}`}
      actions={
        <Link href="/client/dashboard">
          <DashboardButton variant="outline">← Back to Dashboard</DashboardButton>
        </Link>
      }
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Status Banner */}
        <DashboardCard
          style={{
            marginBottom: '24px',
            backgroundColor: `${statusColor}10`,
            borderLeft: `4px solid ${statusColor}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '700', color: colors.textPrimary, marginBottom: '4px' }}>
                Order Status: {order.status}
              </h3>
              <p style={{ fontSize: '14px', color: colors.textSecondary }}>
                {order.status === 'PENDING' && 'Your order is waiting for the fixer to start'}
                {order.status === 'IN_PROGRESS' && 'The fixer is working on your order'}
                {order.status === 'COMPLETED' && order.deliveryNote && 'Fixer has delivered! Please review the work and process payment'}
                {order.status === 'COMPLETED' && !order.deliveryNote && 'Fixer has marked this as completed'}
                {order.status === 'PAID' && 'Payment successful and held in escrow. Waiting for platform to settle with fixer.'}
                {order.status === 'SETTLED' && 'Payment has been settled with the fixer. Order complete!'}
                {order.status === 'CANCELLED' && 'This order was cancelled'}
              </p>
            </div>
            {order.status === 'PENDING' && (
              <CancelOrderButton orderId={order.id} />
            )}
          </div>
        </DashboardCard>

        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}
          className="client-order-layout"
        >
          {/* Main Content */}
          <div className="client-order-main">
            {/* Timeline */}
            <DashboardCard title="Order Timeline" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: colors.success,
                      color: colors.white,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    ✓
                  </div>
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
                      Order Placed
                    </div>
                    <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {['IN_PROGRESS', 'COMPLETED'].includes(order.status) && (
                  <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: colors.success,
                        color: colors.white,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
                        Work Started
                      </div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                        Seller has begun working on your order
                      </div>
                    </div>
                  </div>
                )}

                {order.status === 'COMPLETED' && order.deliveredAt && (
                  <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: colors.success,
                        color: colors.white,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
                        Order Delivered
                      </div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                        {order.deliveredAt ? new Date(order.deliveredAt).toLocaleString() : 'Recently delivered'}
                      </div>
                    </div>
                  </div>
                )}

                {order.status === 'COMPLETED' && (
                  <div style={{ display: 'flex', alignItems: 'start', gap: '12px' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: colors.success,
                        color: colors.white,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      ✓
                    </div>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
                        Order Completed
                      </div>
                      <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                        {order.completedAt ? new Date(order.completedAt).toLocaleString() : 'Completed'}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </DashboardCard>

            {/* Service Details */}
            <DashboardCard title="Service Details" style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                    Service
                  </label>
                  {order.gig ? (
                    <Link
                      href={`/gigs/${order.gig.slug}`}
                      style={{ fontSize: '16px', fontWeight: '600', color: colors.primary, textDecoration: 'none' }}
                    >
                      {order.gig.title}
                    </Link>
                  ) : (
                    <span style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                      {order.request?.title || 'Service Request'}
                    </span>
                  )}
                </div>

                {order.package && (
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                      Package
                    </label>
                    <div style={{ fontSize: '15px', color: colors.textPrimary }}>
                      {order.package.name} - ₦{order.package.price.toLocaleString()}
                    </div>
                  </div>
                )}

                {order.package?.deliveryDays && (
                  <div>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '4px' }}>
                      Delivery Time
                    </label>
                    <div style={{ fontSize: '15px', color: colors.textPrimary }}>
                      {order.package.deliveryDays} days
                    </div>
                  </div>
                )}
              </div>
            </DashboardCard>

            {/* Requirements & Answers */}
            {order.requirementResponses && typeof order.requirementResponses === 'object' && (
              <DashboardCard title="Requirements" style={{ marginBottom: '24px' }}>
                {Object.entries(order.requirementResponses as Record<string, string>).map(([question, answer], index) => (
                  <div key={index} style={{ marginBottom: '16px' }}>
                    <label style={{ fontSize: '14px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '8px' }}>
                      {question}
                    </label>
                    <div
                      style={{
                        padding: '12px',
                        backgroundColor: colors.bgSecondary,
                        borderRadius: borderRadius.md,
                        fontSize: '15px',
                        color: colors.textPrimary,
                        lineHeight: '1.6',
                      }}
                    >
                      {answer || 'No answer provided'}
                    </div>
                  </div>
                ))}
              </DashboardCard>
            )}

            {/* Delivery */}
            {order.status === 'COMPLETED' && order.deliveryNote && (
              <DashboardCard title="Delivery" style={{ marginBottom: '24px' }}>
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: colors.textSecondary, display: 'block', marginBottom: '8px' }}>
                    Delivery Note
                  </label>
                  <div
                    style={{
                      padding: '12px',
                      backgroundColor: colors.bgSecondary,
                      borderRadius: borderRadius.md,
                      fontSize: '15px',
                      color: colors.textPrimary,
                      lineHeight: '1.6',
                    }}
                  >
                    {order.deliveryNote}
                  </div>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <AcceptDeliveryButton orderId={order.id} amount={order.totalAmount} hasReview={!!order.rating} />
                  <RequestRevisionButton
                    orderId={order.id}
                    revisionsUsed={order.revisionsUsed}
                    revisionsAllowed={order.revisionsAllowed}
                  />
                </div>
              </DashboardCard>
            )}

            {/* Messages */}
            <DashboardCard title="Messages" style={{ marginBottom: '24px' }}>
              <MessagesThread orderId={order.id} currentUserId={user.id} />
            </DashboardCard>
          </div>

          {/* Sidebar */}
          <div className="client-order-sidebar">
            {/* Service Provider Info */}
            <DashboardCard title="Service Provider" style={{ marginBottom: '24px' }}>
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
                  {order.fixer.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
                    {order.fixer.name || 'Anonymous'}
                  </div>
                  <div style={{ fontSize: '13px', color: colors.textSecondary }}>
                    Service Provider
                  </div>
                </div>
              </div>
              <ContactSellerButton
                orderId={order.id}
                sellerName={order.fixer.name || 'the provider'}
              />
            </DashboardCard>

            {/* Order Summary */}
            <DashboardCard title="Order Summary">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: colors.textSecondary }}>Service Price</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                    ₦{order.totalAmount.toLocaleString()}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: colors.textSecondary }}>Platform Fee</span>
                  <span style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                    ₦{order.platformFee.toLocaleString()}
                  </span>
                </div>
                <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: colors.textPrimary }}>Total</span>
                  <span style={{ fontSize: '16px', fontWeight: '700', color: colors.primary }}>
                    ₦{order.totalAmount.toLocaleString()}
                  </span>
                </div>
                <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '8px' }}>
                  Provider receives: ₦{order.fixerAmount.toLocaleString()}
                </p>
              </div>
            </DashboardCard>
          </div>
        </div>
      </div>
    </DashboardLayoutWithHeader>
  );
}
