import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard, DashboardButton } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';

interface PageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
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
  const totalCount = await prisma.user.count();
  const totalPages = Math.ceil(totalCount / perPage);

  // Fetch paginated users with counts
  const users = await prisma.user.findMany({
    skip,
    take: perPage,
    include: {
      _count: {
        select: {
          gigs: true,
          clientOrders: true,
          fixerOrders: true,
        },
      },
      fixerProfile: {
        select: {
          id: true,
          yearsOfService: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate stats (from total counts, not paginated results)
  const totalUsers = totalCount;
  const totalClients = await prisma.user.count({ where: { role: 'CLIENT' } });
  const totalFixers = await prisma.user.count({ where: { role: 'FIXER' } });
  const totalAdmins = await prisma.user.count({ where: { role: 'ADMIN' } });
  const activeUsers = await prisma.user.count({ where: { status: 'ACTIVE' } });
  const pendingUsers = await prisma.user.count({ where: { status: 'PENDING' } });
  const suspendedUsers = await prisma.user.count({ where: { status: 'SUSPENDED' } });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { backgroundColor: '#FEE2E2', color: '#991B1B' };
      case 'FIXER':
        return { backgroundColor: colors.primaryLight, color: colors.primaryDark };
      case 'CLIENT':
        return { backgroundColor: colors.blueLight, color: '#2952A3' };
      default:
        return { backgroundColor: colors.gray100, color: colors.gray700 };
    }
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
      title="User Management"
      subtitle="View and manage all platform users"
      actions={
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <DashboardButton variant="outline" href="/admin/dashboard">
            Back to Dashboard
          </DashboardButton>
        </div>
      }
    >
      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <DashboardCard padding="20px">
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
            Total Users
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, lineHeight: '1' }}>
            {totalUsers}
          </div>
        </DashboardCard>

        <DashboardCard padding="20px">
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
            Clients
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.primary, lineHeight: '1' }}>
            {totalClients}
          </div>
        </DashboardCard>

        <DashboardCard padding="20px">
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
            Fixers
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.primary, lineHeight: '1' }}>
            {totalFixers}
          </div>
        </DashboardCard>

        <DashboardCard padding="20px">
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
            Active
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.success, lineHeight: '1' }}>
            {activeUsers}
          </div>
        </DashboardCard>

        <DashboardCard padding="20px">
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
            Pending
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.warningDark, lineHeight: '1' }}>
            {pendingUsers}
          </div>
        </DashboardCard>

        <DashboardCard padding="20px">
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
            Suspended
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.error, lineHeight: '1' }}>
            {suspendedUsers}
          </div>
        </DashboardCard>
      </div>

      {/* Users Table */}
      <DashboardCard padding="0">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  User
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Contact
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Role
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
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.white, fontWeight: '600', fontSize: '16px' }}>
                        {(u.name || u.email || u.phone || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500', color: colors.textPrimary, fontSize: '14px' }}>
                          {u.name || 'N/A'}
                        </div>
                        {u.role === 'FIXER' && u.fixerProfile && (
                          <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                            {u.fixerProfile.yearsOfService} years experience
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                    <div>{u.email || 'No email'}</div>
                    {u.phone && (
                      <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                        {u.phone}
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
                        ...getRoleBadgeColor(u.role),
                      }}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        ...getStatusBadgeColor(u.status),
                      }}
                    >
                      {u.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '13px', color: colors.textSecondary }}>
                    {u.role === 'FIXER' && (
                      <div>
                        <div>{u._count.gigs} gigs</div>
                        <div>{u._count.fixerOrders} orders</div>
                      </div>
                    )}
                    {u.role === 'CLIENT' && (
                      <div>{u._count.clientOrders} orders</div>
                    )}
                    {u.role === 'ADMIN' && (
                      <div style={{ color: colors.textSecondary }}>Admin</div>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                    {formatDate(u.createdAt)}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <Link
                      href={`/admin/users/${u.id}`}
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

        {users.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: colors.textSecondary }}>
            No users found
          </div>
        )}
      </DashboardCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
          <Link
            href={`/admin/users?page=${currentPage - 1}`}
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
                href={`/admin/users?page=${page}`}
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
            href={`/admin/users?page=${currentPage + 1}`}
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
        Showing {skip + 1} to {Math.min(skip + perPage, totalCount)} of {totalCount} users
      </div>
    </DashboardLayoutWithHeader>
  );
}
