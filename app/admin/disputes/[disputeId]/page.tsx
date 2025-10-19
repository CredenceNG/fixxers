import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import DisputeResolutionForm from './DisputeResolutionForm';
import DisputeMessaging from './DisputeMessaging';
import { colors, borderRadius } from '@/lib/theme';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ disputeId: string }>;
}

export default async function AdminDisputeDetailPage({ params }: PageProps) {
  const user = await getCurrentUser();
  const roles = user?.roles || [];

  if (!user || !roles.includes('ADMIN')) {
    redirect('/auth/login');
  }

  const { disputeId } = await params;

  // Fetch pending counts for sidebar
  const prismaAny = prisma as any;
  const [pendingBadgeRequests, pendingAgentApplications, pendingReports] = await Promise.all([
    prismaAny.badgeRequest?.count({
      where: { status: { in: ['PENDING', 'PAYMENT_RECEIVED', 'UNDER_REVIEW'] } },
    }) ?? 0,
    prismaAny.agent?.count({
      where: { status: 'PENDING' },
    }) ?? 0,
    prismaAny.reviewReport?.count({
      where: { status: { in: ['PENDING', 'REVIEWING'] } },
    }) ?? 0,
  ]);

  // Fetch dispute with all relations
  const dispute = await prisma.dispute.findUnique({
    where: { id: disputeId },
    include: {
      initiatedBy: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          profileImage: true,
        },
      },
      order: {
        include: {
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
              email: true,
              phone: true,
              profileImage: true,
            },
          },
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
      },
      resolvedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      messages: {
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              profileImage: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!dispute) {
    return <div>Dispute not found</div>;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN':
        return { bg: colors.warningLight, text: colors.warningDark, border: colors.warning };
      case 'UNDER_REVIEW':
        return { bg: '#E8F4FD', text: '#1565C0', border: '#2196F3' };
      case 'RESOLVED':
        return { bg: colors.successLight, text: colors.successDark, border: colors.success };
      case 'CLOSED':
        return { bg: colors.bgSecondary, text: colors.textSecondary, border: colors.border };
      case 'ESCALATED':
        return { bg: colors.errorLight, text: colors.errorDark, border: colors.error };
      default:
        return { bg: colors.bgSecondary, text: colors.textSecondary, border: colors.border };
    }
  };

  const getReasonLabel = (reason: string) => {
    const labels: Record<string, string> = {
      QUALITY_ISSUES: 'Quality Issues',
      INCOMPLETE_WORK: 'Incomplete Work',
      OVERCHARGING: 'Overcharging',
      PAYMENT_DISPUTE: 'Payment Dispute',
      TIMELINE_ISSUES: 'Timeline Issues',
      COMMUNICATION_ISSUES: 'Communication Issues',
      SCOPE_DISAGREEMENT: 'Scope Disagreement',
      OTHER: 'Other',
    };
    return labels[reason] || reason;
  };

  const statusColors = getStatusColor(dispute.status);
  const isResolved = ['RESOLVED', 'CLOSED'].includes(dispute.status);
  const serviceName = dispute.order.request
    ? `${dispute.order.request.subcategory.category.name} - ${dispute.order.request.subcategory.name}`
    : dispute.order.gig
    ? dispute.order.gig.title
    : 'Service';

  return (
    <AdminDashboardWrapper
      userName={user.name || undefined}
      userAvatar={user.profileImage || undefined}
      pendingBadgeRequests={pendingBadgeRequests}
      pendingAgentApplications={pendingAgentApplications}
      pendingReports={pendingReports}
    >
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
            Dispute #{dispute.id.slice(0, 8)}
          </h1>
          <p style={{ fontSize: '16px', color: colors.textLight }}>
            {serviceName}
          </p>
        </div>
        <Link
          href="/admin/disputes"
          style={{
            padding: '10px 20px',
            backgroundColor: colors.white,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.md,
            fontSize: '14px',
            fontWeight: '600',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          ← Back to Disputes
        </Link>
      </div>

      {/* Status Banner */}
      <div style={{
        padding: '20px',
        backgroundColor: statusColors.bg,
        borderLeft: `4px solid ${statusColors.border}`,
        borderRadius: borderRadius.lg,
        marginBottom: '32px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontSize: '14px', color: statusColors.text, fontWeight: '600', marginBottom: '4px' }}>
              Status
            </p>
            <p style={{ fontSize: '20px', fontWeight: '700', color: statusColors.text }}>
              {dispute.status.replace(/_/g, ' ')}
            </p>
          </div>
          {dispute.resolvedBy && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '14px', color: statusColors.text, marginBottom: '4px' }}>
                Resolved by {dispute.resolvedBy.name}
              </p>
              <p style={{ fontSize: '13px', color: statusColors.text }}>
                {new Date(dispute.resolvedAt!).toLocaleString()}
              </p>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* Dispute Details */}
        <div style={{
          backgroundColor: colors.white,
          padding: '24px',
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.border}`,
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
            Dispute Details
          </h2>

          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
              Initiated By
            </p>
            <p style={{ fontSize: '15px', color: colors.textPrimary, fontWeight: '500' }}>
              {dispute.initiatedBy.name || dispute.initiatedBy.email}
              {dispute.initiatedById === dispute.order.clientId ? ' (Client)' : ' (Fixer)'}
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
              Reason
            </p>
            <p style={{ fontSize: '15px', color: colors.textPrimary, fontWeight: '500' }}>
              {getReasonLabel(dispute.reason)}
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
              Description
            </p>
            <p style={{ fontSize: '15px', color: colors.textPrimary, lineHeight: '1.6' }}>
              {dispute.description}
            </p>
          </div>

          {dispute.evidence.length > 0 && (
            <div>
              <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>
                Evidence ({dispute.evidence.length} file{dispute.evidence.length !== 1 ? 's' : ''})
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {dispute.evidence.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '8px 12px',
                      backgroundColor: colors.bgSecondary,
                      borderRadius: borderRadius.md,
                      fontSize: '14px',
                      color: colors.primary,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    📎 Evidence {index + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
            <p style={{ fontSize: '13px', color: colors.textSecondary }}>
              Filed on {new Date(dispute.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Order & Payment Details */}
        <div style={{
          backgroundColor: colors.white,
          padding: '24px',
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.border}`,
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
            Order & Payment Details
          </h2>

          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
              Order ID
            </p>
            <Link
              href={`/admin/orders/${dispute.order.id}`}
              style={{ fontSize: '15px', color: colors.primary, fontWeight: '500', textDecoration: 'none' }}
            >
              {dispute.order.id.slice(0, 12)}...
            </Link>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
              Total Amount
            </p>
            <p style={{ fontSize: '20px', color: colors.textPrimary, fontWeight: '700' }}>
              ₦{dispute.order.totalAmount.toLocaleString()}
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
              Platform Fee
            </p>
            <p style={{ fontSize: '15px', color: colors.textPrimary, fontWeight: '500' }}>
              ₦{dispute.order.platformFee.toLocaleString()}
            </p>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
              Fixer Amount
            </p>
            <p style={{ fontSize: '15px', color: colors.textPrimary, fontWeight: '500' }}>
              ₦{dispute.order.fixerAmount.toLocaleString()}
            </p>
          </div>

          {dispute.order.payment && (
            <>
              <div style={{ marginBottom: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
                <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
                  Payment Status
                </p>
                <p style={{ fontSize: '15px', color: colors.textPrimary, fontWeight: '500' }}>
                  {dispute.order.payment.status}
                </p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
                  Payment Reference
                </p>
                <p style={{ fontSize: '13px', color: colors.textPrimary, fontFamily: 'monospace' }}>
                  {dispute.order.payment.paystackReference || dispute.order.payment.stripePaymentId || 'N/A'}
                </p>
              </div>
            </>
          )}

          <div style={{ marginBottom: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>
              Client
            </p>
            <Link
              href={`/admin/users/${dispute.order.client.id}`}
              style={{ fontSize: '15px', color: colors.primary, fontWeight: '500', textDecoration: 'none', display: 'block' }}
            >
              {dispute.order.client.name || dispute.order.client.email}
            </Link>
          </div>

          <div>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>
              Fixer
            </p>
            <Link
              href={`/admin/users/${dispute.order.fixer.id}`}
              style={{ fontSize: '15px', color: colors.primary, fontWeight: '500', textDecoration: 'none', display: 'block' }}
            >
              {dispute.order.fixer.name || dispute.order.fixer.email}
            </Link>
          </div>
        </div>
      </div>

      {/* Resolution Form (if not resolved) */}
      {!isResolved && (
        <DisputeResolutionForm
          disputeId={dispute.id}
          orderId={dispute.order.id}
          totalAmount={dispute.order.totalAmount}
          fixerAmount={dispute.order.fixerAmount}
        />
      )}

      {/* Resolution Details (if resolved) */}
      {isResolved && dispute.resolution && (
        <div style={{
          backgroundColor: colors.white,
          padding: '24px',
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.border}`,
          marginBottom: '32px',
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
            Resolution
          </h2>
          <p style={{ fontSize: '15px', color: colors.textPrimary, lineHeight: '1.6' }}>
            {dispute.resolution}
          </p>
        </div>
      )}

      {/* Dispute Messaging */}
      <DisputeMessaging
        disputeId={dispute.id}
        messages={dispute.messages}
        currentUserId={user.id}
      />
    </AdminDashboardWrapper>
  );
}
