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

export default async function FixersPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  const roles = user?.roles || [];

  if (!user || !roles.includes('ADMIN')) {
    redirect('/auth/login');
  }

  // Await searchParams
  const params = await searchParams;

  // Pagination
  const currentPage = parseInt(params.page || '1', 10);
  const perPage = 5;
  const skip = (currentPage - 1) * perPage;

  // Fetch total count for pagination
  const totalCount = await prisma.user.count({ where: { roles: { has: 'FIXER' } } });
  const totalPages = Math.ceil(totalCount / perPage);

  // Fetch paginated fixers with counts
  const fixers = await prisma.user.findMany({
    where: { roles: { has: 'FIXER' } },
    skip,
    take: perPage,
    include: {
      _count: {
        select: {
          gigs: true,
          fixerOrders: true,
          fixerQuotes: true,
        },
      },
      fixerProfile: {
        select: {
          id: true,
          yearsOfService: true,
          city: true,
          state: true,
          neighbourhood: true,
          primaryPhone: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate stats
  const totalFixers = totalCount;
  const activeFixers = await prisma.user.count({ where: { roles: { has: 'FIXER' }, status: 'ACTIVE' } });
  const pendingFixers = await prisma.user.count({ where: { roles: { has: 'FIXER' }, status: 'PENDING' } });
  const suspendedFixers = await prisma.user.count({ where: { roles: { has: 'FIXER' }, status: 'SUSPENDED' } });

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
      title="Fixer Management"
      subtitle="View and manage all fixers on the platform"
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
            Total Fixers
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, lineHeight: '1' }}>
            {totalFixers}
          </div>
        </DashboardCard>

        <DashboardCard padding="20px">
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
            Active
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.success, lineHeight: '1' }}>
            {activeFixers}
          </div>
        </DashboardCard>

        <DashboardCard padding="20px">
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
            Pending
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.warningDark, lineHeight: '1' }}>
            {pendingFixers}
          </div>
        </DashboardCard>

        <DashboardCard padding="20px">
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
            Suspended
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.error, lineHeight: '1' }}>
            {suspendedFixers}
          </div>
        </DashboardCard>
      </div>

      {/* Fixers Table */}
      <DashboardCard padding="0">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Fixer
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Contact
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Location
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
              {fixers.map((fixer) => (
                <tr key={fixer.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.white, fontWeight: '600', fontSize: '16px' }}>
                        {(fixer.name || fixer.email || fixer.phone || 'F').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500', color: colors.textPrimary, fontSize: '14px' }}>
                          {fixer.name || 'N/A'}
                        </div>
                        {fixer.fixerProfile && (
                          <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                            {fixer.fixerProfile.yearsOfService} years experience
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                    <div>{fixer.email || 'No email'}</div>
                    {fixer.fixerProfile?.primaryPhone && (
                      <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                        {fixer.fixerProfile.primaryPhone}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                    {fixer.fixerProfile ? (
                      <div>
                        <div>{fixer.fixerProfile.neighbourhood}</div>
                        <div style={{ fontSize: '12px', marginTop: '2px' }}>
                          {fixer.fixerProfile.city}, {fixer.fixerProfile.state}
                        </div>
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        ...getStatusBadgeColor(fixer.status),
                      }}
                    >
                      {fixer.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '13px', color: colors.textSecondary }}>
                    <div>{fixer._count.gigs} gigs</div>
                    <div>{fixer._count.fixerOrders} orders</div>
                    <div>{fixer._count.fixerQuotes} quotes</div>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                    {formatDate(fixer.createdAt)}
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <Link
                      href={`/admin/users/${fixer.id}`}
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

        {fixers.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: colors.textSecondary }}>
            No fixers found
          </div>
        )}
      </DashboardCard>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
          <Link
            href={`/admin/fixers?page=${currentPage - 1}`}
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
                href={`/admin/fixers?page=${page}`}
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
            href={`/admin/fixers?page=${currentPage + 1}`}
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
        Showing {skip + 1} to {Math.min(skip + perPage, totalCount)} of {totalCount} fixers
      </div>
    </DashboardLayoutWithHeader>
  );
}
