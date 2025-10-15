import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';

export default async function AdminGigsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const user = await getCurrentUser();

  // Check if user has ADMIN role
  const roles = user?.roles || [];
  if (!user || !roles.includes('ADMIN')) {
    redirect('/auth/login');
  }

  // Pagination setup
  const resolvedParams = await searchParams;
  const currentPage = Number(resolvedParams.page) || 1;
  const statusFilter = resolvedParams.status;
  const itemsPerPage = 5;
  const skip = (currentPage - 1) * itemsPerPage;

  // Build where clause
  const where = statusFilter ? { status: statusFilter as any } : {};

  // Get total count
  const totalCount = await prisma.gig.count({ where });
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Fetch paginated gigs
  const gigs = await prisma.gig.findMany({
    where,
    include: {
      seller: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
        },
      },
      subcategory: {
        include: {
          category: true,
        },
      },
      packages: {
        orderBy: { price: 'asc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
    take: itemsPerPage,
    skip: skip,
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, any> = {
      ACTIVE: { bg: colors.primaryLight, color: colors.primaryDark },
      PENDING: { bg: '#FEF5E7', color: '#95620D' },
      REJECTED: { bg: colors.errorLight, color: colors.error },
      PAUSED: { bg: colors.gray100, color: colors.gray700 },
    };

    const style = styles[status] || styles.PENDING;
    return (
      <span
        style={{
          padding: '4px 12px',
          fontSize: '12px',
          borderRadius: borderRadius.md,
          fontWeight: '600',
          backgroundColor: style.bg,
          color: style.color,
        }}
      >
        {status}
      </span>
    );
  };

  return (
    <DashboardLayoutWithHeader
      title="Service Offers / Gigs"
      subtitle={`Manage all service offers on the platform (${totalCount} total)`}
    >
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <Link
          href="/admin/gigs"
          style={{
            padding: '8px 16px',
            borderRadius: borderRadius.md,
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '600',
            ...((!statusFilter)
              ? { backgroundColor: colors.primary, color: colors.white }
              : { backgroundColor: colors.bgSecondary, color: colors.textSecondary })
          }}
        >
          All
        </Link>
        <Link
          href="/admin/gigs?status=PENDING"
          style={{
            padding: '8px 16px',
            borderRadius: borderRadius.md,
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '600',
            ...(statusFilter === 'PENDING'
              ? { backgroundColor: colors.primary, color: colors.white }
              : { backgroundColor: colors.bgSecondary, color: colors.textSecondary })
          }}
        >
          Pending
        </Link>
        <Link
          href="/admin/gigs?status=ACTIVE"
          style={{
            padding: '8px 16px',
            borderRadius: borderRadius.md,
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '600',
            ...(statusFilter === 'ACTIVE'
              ? { backgroundColor: colors.primary, color: colors.white }
              : { backgroundColor: colors.bgSecondary, color: colors.textSecondary })
          }}
        >
          Active
        </Link>
        <Link
          href="/admin/gigs?status=REJECTED"
          style={{
            padding: '8px 16px',
            borderRadius: borderRadius.md,
            textDecoration: 'none',
            fontSize: '14px',
            fontWeight: '600',
            ...(statusFilter === 'REJECTED'
              ? { backgroundColor: colors.primary, color: colors.white }
              : { backgroundColor: colors.bgSecondary, color: colors.textSecondary })
          }}
        >
          Rejected
        </Link>
      </div>

      <DashboardCard padding="0">
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                  Title
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                  Seller
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                  Category
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                  Price
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                  Orders
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                  Status
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                  Created
                </th>
                <th style={{ padding: '16px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {gigs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 20px', textAlign: 'center', color: colors.textSecondary }}>
                    No gigs found
                  </td>
                </tr>
              ) : (
                gigs.map((gig) => (
                  <tr key={gig.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '16px 20px' }}>
                      <Link
                        href={`/gigs/${gig.slug}`}
                        style={{
                          color: colors.textPrimary,
                          textDecoration: 'none',
                          fontWeight: '500',
                          fontSize: '14px'
                        }}
                      >
                        {gig.title}
                      </Link>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                      <Link
                        href={`/admin/users/${gig.seller.id}`}
                        style={{ color: colors.textSecondary, textDecoration: 'none' }}
                      >
                        {gig.seller.name || gig.seller.email || gig.seller.phone}
                      </Link>
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                      {gig.subcategory.category.name}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                      ₦{gig.packages[0]?.price?.toLocaleString() || 'N/A'}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                      {gig.ordersCount || 0}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      {getStatusBadge(gig.status)}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                      {formatDate(gig.createdAt)}
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <Link
                        href={`/admin/gigs/${gig.id}`}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: colors.primary,
                          color: colors.white,
                          borderRadius: borderRadius.md,
                          fontSize: '13px',
                          fontWeight: '600',
                          textDecoration: 'none',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
              padding: '20px',
              borderTop: `1px solid ${colors.border}`,
            }}
          >
            {currentPage > 1 && (
              <Link
                href={`/admin/gigs?page=${currentPage - 1}${statusFilter ? `&status=${statusFilter}` : ''}`}
                style={{
                  padding: '8px 16px',
                  backgroundColor: colors.bgSecondary,
                  color: colors.textPrimary,
                  borderRadius: borderRadius.md,
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                Previous
              </Link>
            )}
            <span style={{ color: colors.textSecondary, fontSize: '14px' }}>
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages && (
              <Link
                href={`/admin/gigs?page=${currentPage + 1}${statusFilter ? `&status=${statusFilter}` : ''}`}
                style={{
                  padding: '8px 16px',
                  backgroundColor: colors.primary,
                  color: colors.white,
                  borderRadius: borderRadius.md,
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '600',
                }}
              >
                Next
              </Link>
            )}
          </div>
        )}
      </DashboardCard>
    </DashboardLayoutWithHeader>
  );
}
