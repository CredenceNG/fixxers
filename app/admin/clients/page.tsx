import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard, DashboardButton } from '@/components/DashboardLayout';
import { colors } from '@/lib/theme';

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ClientsPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();

  if (!user || user.role !== 'ADMIN') {
    redirect('/auth/login');
  }

  // Await searchParams
  const params = await searchParams;

  // Pagination
  const currentPage = parseInt(params.page || '1', 10);
  const perPage = 5;
  const skip = (currentPage - 1) * perPage;

  // Fetch total count for pagination
  const totalCount = await prisma.user.count({ where: { role: 'CLIENT' } });
  const totalPages = Math.ceil(totalCount / perPage);

  // Fetch paginated clients with counts
  const clients = await prisma.user.findMany({
    where: { role: 'CLIENT' },
    skip,
    take: perPage,
    include: {
      _count: {
        select: {
          clientOrders: true,
          clientRequests: true,
          reviewsGiven: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate stats
  const totalClients = totalCount;
  const activeClients = await prisma.user.count({ where: { role: 'CLIENT', status: 'ACTIVE' } });
  const pendingClients = await prisma.user.count({ where: { role: 'CLIENT', status: 'PENDING' } });
  const suspendedClients = await prisma.user.count({ where: { role: 'CLIENT', status: 'SUSPENDED' } });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { backgroundColor: colors.primaryLight, color: colors.primaryDark };
      case 'PENDING':
        return { backgroundColor: '#FEF5E7', color: '#95620D' };
      case 'SUSPENDED':
        return { backgroundColor: '#FDEDEC', color: '#922B21' };
      default:
        return { backgroundColor: colors.gray100, color: colors.gray700 };
    }
  };

  return (
    <DashboardLayoutWithHeader
      title="Client Management"
      subtitle="View and manage all clients on the platform"
      actions={
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <DashboardButton variant="outline" href="/admin/users">
            All Users
          </DashboardButton>
          <DashboardButton variant="outline" href="/admin/dashboard">
            Dashboard
          </DashboardButton>
        </div>
      }
    >
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <DashboardCard padding="20px">
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
            Total Clients
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, lineHeight: '1' }}>
            {totalClients}
          </div>
        </DashboardCard>

        <DashboardCard padding="20px">
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
            Active
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.success, lineHeight: '1' }}>
            {activeClients}
          </div>
        </DashboardCard>

        <DashboardCard padding="20px">
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
            Pending
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.warningDark, lineHeight: '1' }}>
            {pendingClients}
          </div>
        </DashboardCard>

        <DashboardCard padding="20px">
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
            Suspended
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.error, lineHeight: '1' }}>
            {suspendedClients}
          </div>
        </DashboardCard>
      </div>

      {/* Clients Table */}
      <DashboardCard padding="0">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Client
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Contact
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Status
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Activity
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Joined
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client) => (
                <tr key={client.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: colors.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2952A3', fontWeight: '600', fontSize: '16px' }}>
                        {(client.name || client.email || client.phone || 'C').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500', color: colors.textPrimary, fontSize: '14px' }}>
                          {client.name || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                    <div>{client.email || 'No email'}</div>
                    {client.phone && (
                      <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                        {client.phone}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        ...getStatusBadgeColor(client.status),
                      }}
                    >
                      {client.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '13px', color: colors.textSecondary }}>
                    <div>{client._count.clientOrders} orders</div>
                    <div>{client._count.clientRequests} requests</div>
                    <div>{client._count.reviewsGiven} reviews</div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                    {formatDate(client.createdAt)}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <Link
                      href={`/admin/users/${client.id}`}
                      style={{
                        color: colors.primary,
                        fontWeight: '600',
                        fontSize: '14px',
                        textDecoration: 'none',
                      }}
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {clients.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: colors.textSecondary }}>
            No clients found
          </div>
        )}
      </DashboardCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
          <Link
            href={`/admin/clients?page=${currentPage - 1}`}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: currentPage === 1 ? colors.gray100 : colors.white,
              border: `1px solid ${colors.border}`,
              color: currentPage === 1 ? colors.textSecondary : colors.textPrimary,
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px',
              pointerEvents: currentPage === 1 ? 'none' : 'auto',
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            Previous
          </Link>

          <div style={{ display: 'flex', gap: '8px' }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Link
                key={page}
                href={`/admin/clients?page=${page}`}
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  backgroundColor: page === currentPage ? colors.primary : colors.white,
                  border: `1px solid ${page === currentPage ? colors.primary : colors.border}`,
                  color: page === currentPage ? colors.white : colors.textPrimary,
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '14px',
                  minWidth: '40px',
                  textAlign: 'center',
                }}
              >
                {page}
              </Link>
            ))}
          </div>

          <Link
            href={`/admin/clients?page=${currentPage + 1}`}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              backgroundColor: currentPage === totalPages ? colors.gray100 : colors.white,
              border: `1px solid ${colors.border}`,
              color: currentPage === totalPages ? colors.textSecondary : colors.textPrimary,
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '14px',
              pointerEvents: currentPage === totalPages ? 'none' : 'auto',
              opacity: currentPage === totalPages ? 0.5 : 1,
            }}
          >
            Next
          </Link>
        </div>
      )}

      {/* Showing info */}
      <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '14px', color: colors.textSecondary }}>
        Showing {skip + 1} to {Math.min(skip + perPage, totalCount)} of {totalCount} clients
      </div>
    </DashboardLayoutWithHeader>
  );
}
