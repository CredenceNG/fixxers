import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import NeighborhoodFilters from '@/components/NeighborhoodFilters';
import { colors, borderRadius } from '@/lib/theme';

export default async function AdminNeighborhoodsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; country?: string; state?: string; city?: string }>;
}) {
  const user = await getCurrentUser();
  const roles = user?.roles || [];

  if (!user || !roles.includes('ADMIN')) {
    redirect('/auth/login');
  }

  // Fetch pending counts for AdminDashboardWrapper
  const prismaAny = prisma as any;

  const [pendingBadgeRequests, pendingAgentApplications, pendingReports] = await Promise.all([
    prismaAny.badgeRequest?.count({
      where: {
        status: {
          in: ['PENDING', 'PAYMENT_RECEIVED', 'UNDER_REVIEW'],
        },
      },
    }) ?? 0,
    prismaAny.agent?.count({
      where: {
        status: 'PENDING',
      },
    }) ?? 0,
    prismaAny.reviewReport?.count({
      where: {
        status: {
          in: ['PENDING', 'REVIEWING'],
        },
      },
    }) ?? 0,
  ]);

  // Pagination setup
  const resolvedParams = await searchParams;

  // Helper to normalize param values (handle arrays from duplicate params)
  const getParam = (value: string | string[] | undefined): string => {
    if (!value) return '';
    if (Array.isArray(value)) {
      // Find first non-empty value in array
      const nonEmpty = value.find(v => v && v.trim() !== '');
      return nonEmpty || '';
    }
    return value;
  };

  const currentPage = Number(resolvedParams.page) || 1;
  const searchQuery = getParam(resolvedParams.search);
  const countryFilter = getParam(resolvedParams.country);
  const stateFilter = getParam(resolvedParams.state);
  const cityFilter = getParam(resolvedParams.city);
  const itemsPerPage = 20;
  const skip = (currentPage - 1) * itemsPerPage;

  // Build where filter
  const whereFilter: any = {};

  if (searchQuery) {
    whereFilter.OR = [
      { name: { contains: searchQuery, mode: 'insensitive' } },
      { legacyCity: { contains: searchQuery, mode: 'insensitive' } },
      { legacyState: { contains: searchQuery, mode: 'insensitive' } },
    ];
  }

  if (countryFilter) {
    whereFilter.legacyCountry = countryFilter;
  }

  if (stateFilter) {
    whereFilter.legacyState = stateFilter;
  }

  if (cityFilter) {
    whereFilter.legacyCity = cityFilter;
  }

  // Get unique values for filters
  const [countriesRaw, statesRaw, citiesRaw] = await Promise.all([
    prisma.neighborhood.findMany({
      select: { legacyCountry: true },
      distinct: ['legacyCountry'],
      orderBy: { legacyCountry: 'asc' },
    }),
    prisma.neighborhood.findMany({
      select: { legacyState: true },
      distinct: ['legacyState'],
      where: countryFilter ? { legacyCountry: countryFilter } : {},
      orderBy: { legacyState: 'asc' },
    }),
    prisma.neighborhood.findMany({
      select: { legacyCity: true },
      distinct: ['legacyCity'],
      where: {
        ...(countryFilter ? { legacyCountry: countryFilter } : {}),
        ...(stateFilter ? { legacyState: stateFilter } : {}),
      },
      orderBy: { legacyCity: 'asc' },
    }),
  ]);

  // Map legacy fields to expected field names for the component
  const countries = countriesRaw.map(c => ({ country: c.legacyCountry || '' }));
  const states = statesRaw.map(s => ({ state: s.legacyState || '' }));
  const cities = citiesRaw.map(c => ({ city: c.legacyCity || '' }));

  // Get total count
  const totalCount = await prisma.neighborhood.count({ where: whereFilter });
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Fetch paginated neighborhoods
  const neighborhoods = await prisma.neighborhood.findMany({
    where: whereFilter,
    orderBy: [{ legacyState: 'asc' }, { legacyCity: 'asc' }, { name: 'asc' }],
    take: itemsPerPage,
    skip: skip,
    include: {
      _count: {
        select: {
          serviceRequests: true,
          fixerServices: true,
        },
      },
    },
  });

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <AdminDashboardWrapper
      userName={user.name || undefined}
      userAvatar={user.profileImage || undefined}
      pendingBadgeRequests={pendingBadgeRequests}
      pendingAgentApplications={pendingAgentApplications}
      pendingReports={pendingReports}
    >
      {/* Page Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
          Neighborhoods
        </h1>
        <p style={{ fontSize: '14px', color: colors.textSecondary }}>
          Manage service areas and neighborhoods ({totalCount} total)
        </p>
      </div>

      {/* Filters */}
      <NeighborhoodFilters
        searchQuery={searchQuery}
        countryFilter={countryFilter}
        stateFilter={stateFilter}
        cityFilter={cityFilter}
        countries={countries}
        states={states}
        cities={cities}
      />

      {/* Neighborhoods Table */}
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: borderRadius.lg,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          padding: '0',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                <th
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: colors.textSecondary,
                    textTransform: 'uppercase',
                  }}
                >
                  Name
                </th>
                <th
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: colors.textSecondary,
                    textTransform: 'uppercase',
                  }}
                >
                  City
                </th>
                <th
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: colors.textSecondary,
                    textTransform: 'uppercase',
                  }}
                >
                  State
                </th>
                <th
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: colors.textSecondary,
                    textTransform: 'uppercase',
                  }}
                >
                  Country
                </th>
                <th
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: colors.textSecondary,
                    textTransform: 'uppercase',
                  }}
                >
                  Service Requests
                </th>
                <th
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: colors.textSecondary,
                    textTransform: 'uppercase',
                  }}
                >
                  Fixer Services
                </th>
                <th
                  style={{
                    padding: '16px 20px',
                    textAlign: 'left',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: colors.textSecondary,
                    textTransform: 'uppercase',
                  }}
                >
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {neighborhoods.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: colors.textSecondary }}>
                    {searchQuery ? 'No neighborhoods found matching your search' : 'No neighborhoods found'}
                  </td>
                </tr>
              ) : (
                neighborhoods.map((neighborhood) => (
                  <tr key={neighborhood.id} style={{ borderBottom: `1px solid ${colors.border}` }}>
                    <td style={{ padding: '16px 20px', fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
                      {neighborhood.name}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                      {neighborhood.legacyCity}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                      {neighborhood.legacyState}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                      {neighborhood.legacyCountry}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textPrimary }}>
                      {neighborhood._count.serviceRequests}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textPrimary }}>
                      {neighborhood._count.fixerServices}
                    </td>
                    <td style={{ padding: '16px 20px', fontSize: '14px', color: colors.textSecondary }}>
                      {formatDate(neighborhood.createdAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div
            style={{
              marginTop: '0',
              padding: '20px',
              borderTop: `1px solid ${colors.border}`,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {currentPage > 1 && (
              <Link
                href={`/admin/neighborhoods?page=${currentPage - 1}${searchQuery ? `&search=${searchQuery}` : ''}${countryFilter ? `&country=${countryFilter}` : ''}${stateFilter ? `&state=${stateFilter}` : ''}${cityFilter ? `&city=${cityFilter}` : ''}`}
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
                href={`/admin/neighborhoods?page=${currentPage + 1}${searchQuery ? `&search=${searchQuery}` : ''}${countryFilter ? `&country=${countryFilter}` : ''}${stateFilter ? `&state=${stateFilter}` : ''}${cityFilter ? `&city=${cityFilter}` : ''}`}
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
      </div>
    </AdminDashboardWrapper>
  );
}
