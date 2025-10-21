import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors, borderRadius } from '@/lib/theme';
import { SearchForm } from './SearchForm';

interface PageProps {
  searchParams: Promise<{ page?: string; search?: string; status?: string; role?: string }>;
}

export default async function UsersPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  const roles = user?.roles || [];

  if (!user || !roles.includes('ADMIN')) {
    redirect('/auth/login');
  }

  // Fetch pending counts for AdminDashboardWrapper
  const prismaAny = prisma as any;
  const pendingBadgeRequests = await prismaAny.badgeRequest.count({
    where: {
      status: {
        in: ['PENDING', 'PAYMENT_RECEIVED', 'UNDER_REVIEW'],
      },
    },
  });

  const pendingAgentApplications = await prismaAny.agent.count({
    where: {
      status: 'PENDING',
    },
  });

  const pendingReports = await prismaAny.reviewReport.count({
    where: {
      status: {
        in: ['PENDING', 'REVIEWING'],
      },
    },
  });

  // Await searchParams
  const params = await searchParams;

  // Pagination
  const currentPage = parseInt(params.page || '1', 10);
  const perPage = 5;
  const skip = (currentPage - 1) * perPage;
  const searchQuery = params.search || '';
  const statusFilter = params.status || '';
  const roleFilter = params.role || '';

  // Build search filter
  const searchFilter = searchQuery
    ? {
        OR: [
          { name: { contains: searchQuery, mode: 'insensitive' as const } },
          { email: { contains: searchQuery, mode: 'insensitive' as const } },
          { phone: { contains: searchQuery, mode: 'insensitive' as const } },
          {
            fixerServices: {
              some: {
                subcategory: {
                  OR: [
                    { name: { contains: searchQuery, mode: 'insensitive' as const } },
                    { category: { name: { contains: searchQuery, mode: 'insensitive' as const } } },
                  ],
                },
              },
            },
          },
        ],
      }
    : {};

  // Build status filter - handle special case for PENDING fixers
  let statusWhereFilter: any = {};
  if (statusFilter === 'PENDING' && roleFilter === 'FIXER') {
    // Match the dashboard query: PENDING status OR pendingChanges in fixerProfile
    statusWhereFilter = {
      OR: [
        { status: 'PENDING' },
        {
          fixerProfile: {
            isNot: null,
            is: {
              pendingChanges: true,
            },
          },
        },
      ],
    };
  } else if (statusFilter) {
    statusWhereFilter = { status: statusFilter as any };
  }

  // Build role filter
  let roleWhereFilter = {};
  if (roleFilter === 'CLIENT') {
    roleWhereFilter = { roles: { has: 'CLIENT' } };
  } else if (roleFilter === 'FIXER') {
    roleWhereFilter = { roles: { has: 'FIXER' } };
  } else if (roleFilter === 'ADMIN') {
    roleWhereFilter = { roles: { has: 'ADMIN' } };
  } else if (roleFilter === 'BOTH') {
    roleWhereFilter = {
      AND: [
        { roles: { has: 'CLIENT' } },
        { roles: { has: 'FIXER' } },
      ],
    };
  }

  // Combine filters
  const whereFilter = {
    ...searchFilter,
    ...statusWhereFilter,
    ...roleWhereFilter,
  };

  // Fetch total count for pagination
  const totalCount = await prisma.user.count({ where: whereFilter });
  const totalPages = Math.ceil(totalCount / perPage);

  // Fetch paginated users with counts
  const users = await prisma.user.findMany({
    where: whereFilter,
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
          pendingChanges: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  // Calculate stats (from total counts, not paginated results)
  const totalUsers = totalCount;
  const totalClients = await prisma.user.count({ where: { roles: { has: 'CLIENT' } } });
  const totalFixers = await prisma.user.count({ where: { roles: { has: 'FIXER' } } });
  const totalAdmins = await prisma.user.count({ where: { roles: { has: 'ADMIN' } } });
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
    <AdminDashboardWrapper
      userName={user.name || user.email || 'Admin'}
      userAvatar={user.profileImage || undefined}
      pendingBadgeRequests={pendingBadgeRequests}
      pendingAgentApplications={pendingAgentApplications}
      pendingReports={pendingReports}
    >
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, margin: 0 }}>
            User Management
          </h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <SearchForm />
            <Link
              href="/admin/dashboard"
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                color: colors.textPrimary,
                backgroundColor: colors.white,
                border: `2px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                textDecoration: 'none',
                cursor: 'pointer',
              }}
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
        <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
          View and manage all platform users
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div style={{ backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: '20px', border: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
            Total Users
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, lineHeight: '1' }}>
            {totalUsers}
          </div>
        </div>

        <div style={{ backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: '20px', border: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
            Clients
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.primary, lineHeight: '1' }}>
            {totalClients}
          </div>
        </div>

        <div style={{ backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: '20px', border: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
            Fixers
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.primary, lineHeight: '1' }}>
            {totalFixers}
          </div>
        </div>

        <div style={{ backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: '20px', border: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
            Active
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.success, lineHeight: '1' }}>
            {activeUsers}
          </div>
        </div>

        <div style={{ backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: '20px', border: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
            Pending
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.warningDark, lineHeight: '1' }}>
            {pendingUsers}
          </div>
        </div>

        <div style={{ backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: '20px', border: `1px solid ${colors.border}` }}>
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '8px', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>
            Suspended
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.error, lineHeight: '1' }}>
            {suspendedUsers}
          </div>
        </div>
      </div>

      {/* Role Filter Buttons */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginRight: '8px' }}>
          Role:
        </span>
        <Link
          href={`/admin/users?${statusFilter ? `status=${statusFilter}&` : ''}${searchQuery ? `search=${encodeURIComponent(searchQuery)}&` : ''}page=1`}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            color: !roleFilter ? colors.white : colors.textPrimary,
            backgroundColor: !roleFilter ? colors.primary : colors.white,
            border: `2px solid ${!roleFilter ? colors.primary : colors.border}`,
            borderRadius: borderRadius.md,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          All Roles
        </Link>
        <Link
          href={`/admin/users?role=CLIENT${statusFilter ? `&status=${statusFilter}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}&page=1`}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            color: roleFilter === 'CLIENT' ? colors.white : colors.textPrimary,
            backgroundColor: roleFilter === 'CLIENT' ? colors.primary : colors.white,
            border: `2px solid ${roleFilter === 'CLIENT' ? colors.primary : colors.border}`,
            borderRadius: borderRadius.md,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Client
        </Link>
        <Link
          href={`/admin/users?role=FIXER${statusFilter ? `&status=${statusFilter}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}&page=1`}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            color: roleFilter === 'FIXER' ? colors.white : colors.textPrimary,
            backgroundColor: roleFilter === 'FIXER' ? colors.primary : colors.white,
            border: `2px solid ${roleFilter === 'FIXER' ? colors.primary : colors.border}`,
            borderRadius: borderRadius.md,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Fixer
        </Link>
        <Link
          href={`/admin/users?role=ADMIN${statusFilter ? `&status=${statusFilter}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}&page=1`}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            color: roleFilter === 'ADMIN' ? colors.white : colors.textPrimary,
            backgroundColor: roleFilter === 'ADMIN' ? colors.error : colors.white,
            border: `2px solid ${roleFilter === 'ADMIN' ? colors.error : colors.border}`,
            borderRadius: borderRadius.md,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Admin
        </Link>
        <Link
          href={`/admin/users?role=BOTH${statusFilter ? `&status=${statusFilter}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}&page=1`}
          style={{
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: '600',
            color: roleFilter === 'BOTH' ? colors.white : colors.textPrimary,
            backgroundColor: roleFilter === 'BOTH' ? colors.primary : colors.white,
            border: `2px solid ${roleFilter === 'BOTH' ? colors.primary : colors.border}`,
            borderRadius: borderRadius.md,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Both (Client + Fixer)
        </Link>
      </div>

      {/* Status Filter Buttons */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginRight: '8px' }}>
          Status:
        </span>
        <Link
          href={`/admin/users?${roleFilter ? `role=${roleFilter}&` : ''}${searchQuery ? `search=${encodeURIComponent(searchQuery)}&` : ''}page=1`}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            color: !statusFilter ? colors.white : colors.textPrimary,
            backgroundColor: !statusFilter ? colors.primary : colors.white,
            border: `2px solid ${!statusFilter ? colors.primary : colors.border}`,
            borderRadius: borderRadius.md,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          All Status
        </Link>
        <Link
          href={`/admin/users?status=ACTIVE${roleFilter ? `&role=${roleFilter}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}&page=1`}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            color: statusFilter === 'ACTIVE' ? colors.white : colors.textPrimary,
            backgroundColor: statusFilter === 'ACTIVE' ? colors.success : colors.white,
            border: `2px solid ${statusFilter === 'ACTIVE' ? colors.success : colors.border}`,
            borderRadius: borderRadius.md,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Active
        </Link>
        <Link
          href={`/admin/users?status=PENDING${roleFilter ? `&role=${roleFilter}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}&page=1`}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            color: statusFilter === 'PENDING' ? colors.white : colors.textPrimary,
            backgroundColor: statusFilter === 'PENDING' ? colors.warningDark : colors.white,
            border: `2px solid ${statusFilter === 'PENDING' ? colors.warningDark : colors.border}`,
            borderRadius: borderRadius.md,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Pending
        </Link>
        <Link
          href={`/admin/users?status=REJECTED${roleFilter ? `&role=${roleFilter}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}&page=1`}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            color: statusFilter === 'REJECTED' ? colors.white : colors.textPrimary,
            backgroundColor: statusFilter === 'REJECTED' ? colors.error : colors.white,
            border: `2px solid ${statusFilter === 'REJECTED' ? colors.error : colors.border}`,
            borderRadius: borderRadius.md,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Rejected
        </Link>
        <Link
          href={`/admin/users?status=SUSPENDED${roleFilter ? `&role=${roleFilter}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}&page=1`}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            color: statusFilter === 'SUSPENDED' ? colors.white : colors.textPrimary,
            backgroundColor: statusFilter === 'SUSPENDED' ? colors.error : colors.white,
            border: `2px solid ${statusFilter === 'SUSPENDED' ? colors.error : colors.border}`,
            borderRadius: borderRadius.md,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          Suspended
        </Link>
      </div>

      {/* Users Table */}
      <div style={{ backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: '0', border: `1px solid ${colors.border}` }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Action
                </th>
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
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
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
                  <td style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: colors.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', color: colors.white, fontWeight: '600', fontSize: '16px' }}>
                        {(u.name || u.email || u.phone || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: '500', color: colors.textPrimary, fontSize: '14px' }}>
                          {u.name || 'N/A'}
                        </div>
                        {u.roles?.includes('FIXER') && u.fixerProfile && (
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
                        ...getRoleBadgeColor(u.roles?.[0] || 'CLIENT'),
                      }}
                    >
                      {u.roles?.join(', ') || 'N/A'}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        fontWeight: '600',
                        ...getStatusBadgeColor(u.fixerProfile?.pendingChanges ? 'PENDING' : u.status),
                      }}
                    >
                      {u.fixerProfile?.pendingChanges ? 'PENDING REVIEW' : u.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '13px', color: colors.textSecondary }}>
                    {u.roles?.includes('FIXER') && (
                      <div>
                        <div>{u._count.gigs} gigs</div>
                        <div>{u._count.fixerOrders} orders</div>
                      </div>
                    )}
                    {u.roles?.includes('CLIENT') && !u.roles?.includes('FIXER') && (
                      <div>{u._count.clientOrders} orders</div>
                    )}
                    {u.roles?.includes('ADMIN') && !u.roles?.includes('FIXER') && !u.roles?.includes('CLIENT') && (
                      <div style={{ color: colors.textSecondary }}>Admin</div>
                    )}
                  </td>
                  <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                    {formatDate(u.createdAt)}
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
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px' }}>
          <Link
            href={`/admin/users?page=${currentPage - 1}${roleFilter ? `&role=${roleFilter}` : ''}${statusFilter ? `&status=${statusFilter}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}
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
                href={`/admin/users?page=${page}${roleFilter ? `&role=${roleFilter}` : ''}${statusFilter ? `&status=${statusFilter}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}
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
            href={`/admin/users?page=${currentPage + 1}${roleFilter ? `&role=${roleFilter}` : ''}${statusFilter ? `&status=${statusFilter}` : ''}${searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ''}`}
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
    </AdminDashboardWrapper>
  );
}
