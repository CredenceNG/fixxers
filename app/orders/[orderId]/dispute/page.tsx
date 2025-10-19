import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DisputeForm from './DisputeForm';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { colors, borderRadius } from '@/lib/theme';

interface PageProps {
  params: Promise<{ orderId: string }>;
}

export default async function DisputePage({ params }: PageProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { orderId } = await params;

  // Fetch the order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      client: true,
      fixer: true,
      payment: true,
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
  });

  if (!order) {
    return <div>Order not found</div>;
  }

  // Check if user is part of this order
  if (order.clientId !== user.id && order.fixerId !== user.id) {
    return <div>Unauthorized</div>;
  }

  // Check if a dispute already exists
  const existingDispute = await prisma.dispute.findFirst({
    where: {
      orderId,
      status: { in: ['OPEN', 'UNDER_REVIEW', 'ESCALATED'] },
    },
  });

  if (existingDispute) {
    redirect(`/orders/${orderId}`);
  }

  // Check if order status allows disputes
  if (order.status === 'PENDING' || order.status === 'CANCELLED') {
    return (
      <DashboardLayoutWithHeader
        title="Cannot File Dispute"
        subtitle="This order cannot be disputed"
      >
        <div style={{
          backgroundColor: colors.white,
          padding: '32px',
          borderRadius: borderRadius.lg,
          textAlign: 'center',
        }}>
          <p style={{ fontSize: '16px', color: colors.textSecondary }}>
            Disputes can only be filed for orders that are in progress or completed.
          </p>
        </div>
      </DashboardLayoutWithHeader>
    );
  }

  const isClient = order.clientId === user.id;
  const serviceName = order.request
    ? `${order.request.subcategory.category.name} - ${order.request.subcategory.name}`
    : order.gig
    ? order.gig.title
    : 'Service';

  return (
    <DashboardLayoutWithHeader
      title="File a Dispute"
      subtitle={`Order: ${serviceName}`}
    >
      {/* Order Summary */}
      <div style={{
        backgroundColor: colors.white,
        padding: '24px',
        borderRadius: borderRadius.lg,
        marginBottom: '24px',
        border: `1px solid ${colors.border}`,
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
          Order Details
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
              Order ID
            </p>
            <p style={{ fontSize: '15px', color: colors.textPrimary, fontWeight: '500' }}>
              {order.id.slice(0, 8)}...
            </p>
          </div>
          <div>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
              Amount
            </p>
            <p style={{ fontSize: '15px', color: colors.textPrimary, fontWeight: '500' }}>
              ₦{order.totalAmount.toLocaleString()}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
              {isClient ? 'Fixer' : 'Client'}
            </p>
            <p style={{ fontSize: '15px', color: colors.textPrimary, fontWeight: '500' }}>
              {isClient ? order.fixer.name || order.fixer.email : order.client.name || order.client.email}
            </p>
          </div>
          <div>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
              Status
            </p>
            <p style={{ fontSize: '15px', color: colors.textPrimary, fontWeight: '500' }}>
              {order.status}
            </p>
          </div>
        </div>
      </div>

      {/* Dispute Form */}
      <DisputeForm orderId={orderId} />
    </DashboardLayoutWithHeader>
  );
}
