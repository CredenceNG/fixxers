import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard, DashboardButton } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';
import { CancelButton } from '../dashboard/CancelButton';

export default async function ClientRequestsPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user has CLIENT role
  const roles = user.roles || [];
  if (!roles.includes('CLIENT')) {
    redirect('/auth/login');
  }

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

  return (
    <DashboardLayoutWithHeader
      title="My Service Requests"
      subtitle="Manage all your service requests"
      actions={
        <DashboardButton href="/client/requests/new">
          + New Request
        </DashboardButton>
      }
    >
      <DashboardCard>
        {requests.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p style={{ color: colors.textSecondary, marginBottom: '16px', fontSize: '16px' }}>
              You haven't made any service requests yet
            </p>
            <Link
              href="/client/requests/new"
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                backgroundColor: colors.primary,
                color: colors.white,
                borderRadius: borderRadius.lg,
                fontWeight: '600',
                textDecoration: 'none',
              }}
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
    </DashboardLayoutWithHeader>
  );
}
