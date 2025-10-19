import { Suspense } from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors, borderRadius } from '@/lib/theme';
import { StatCard } from '@/components/badges/StatCard';
import { FilterTab } from '@/components/badges/FilterTab';
import { BadgeRequestsTable } from '@/components/badges/BadgeRequestsTable';

// Badge status color mapping
const statusColors = {
    PENDING: { bg: colors.warningLight, text: colors.warningDark, border: colors.warning },
    PAYMENT_RECEIVED: { bg: colors.blueLight, text: colors.blue, border: colors.blue },
    UNDER_REVIEW: { bg: '#F3E8FF', text: '#7C3AED', border: '#A78BFA' },
    APPROVED: { bg: colors.successLight, text: colors.successDark, border: colors.success },
    REJECTED: { bg: colors.errorLight, text: colors.errorDark, border: colors.error },
    MORE_INFO_NEEDED: { bg: '#FED7AA', text: '#EA580C', border: '#FB923C' },
};

type BadgeRequestStatus =
    | 'PENDING'
    | 'PAYMENT_RECEIVED'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'MORE_INFO_NEEDED';

const statusIcons: Record<BadgeRequestStatus, string> = {
    PENDING: '⏳',
    PAYMENT_RECEIVED: '💳',
    UNDER_REVIEW: '🔍',
    APPROVED: '✅',
    REJECTED: '❌',
    MORE_INFO_NEEDED: '📝',
};

async function BadgeRequestsQueue({ filter }: { filter: string }) {
    const user = await getCurrentUser();

    if (!user || !user.roles.includes('ADMIN')) {
        redirect('/');
    }

    // Build where clause based on filter
    const where: any = {};

    if (filter === 'pending-payment') {
        where.status = 'PENDING';
        where.paymentStatus = 'PENDING';
    } else if (filter === 'ready-for-review') {
        where.status = 'PAYMENT_RECEIVED';
    } else if (filter === 'under-review') {
        where.status = 'UNDER_REVIEW';
    } else if (filter === 'approved') {
        where.status = 'APPROVED';
    } else if (filter === 'rejected') {
        where.status = 'REJECTED';
    } else if (filter === 'more-info') {
        where.status = 'MORE_INFO_NEEDED';
    }

    // Cast prisma to any to avoid type issues if Prisma client types are stale
    const prismaAny = prisma as any;

    interface AdminBadgeRequest {
        id: string;
        badge: { name: string; icon: string };
        fixer: { id: string; name: string | null; email: string; profileImage: string | null };
        paymentAmount: number;
        status: BadgeRequestStatus;
        createdAt: Date;
    }

    const requests = (await prismaAny.badgeRequest.findMany({
        where,
        include: {
            badge: true,
            fixer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profileImage: true,
                },
            },
        },
        orderBy: [
            { status: 'asc' },
            { createdAt: 'desc' },
        ],
    })) as AdminBadgeRequest[];

    // Get statistics
    const stats = (await prismaAny.badgeRequest.groupBy({
        by: ['status'],
        _count: true,
    })) as Array<{ status: BadgeRequestStatus; _count: number }>;

    const statsMap = stats.reduce<Record<BadgeRequestStatus, number>>((acc, stat) => {
        acc[stat.status] = stat._count;
        return acc;
    }, {
        PENDING: 0,
        PAYMENT_RECEIVED: 0,
        UNDER_REVIEW: 0,
        APPROVED: 0,
        REJECTED: 0,
        MORE_INFO_NEEDED: 0,
    });

    return (
        <>
            {/* Statistics Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
                <StatCard
                    label="Pending Payment"
                    count={statsMap.PENDING || 0}
                    icon="⏳"
                    filter="pending-payment"
                    colorStyles={{ bg: colors.warningLight, text: colors.warningDark, hover: colors.warning }}
                    isActive={filter === 'pending-payment'}
                />
                <StatCard
                    label="Ready to Review"
                    count={statsMap.PAYMENT_RECEIVED || 0}
                    icon="💳"
                    filter="ready-for-review"
                    colorStyles={{ bg: colors.blueLight, text: colors.blue, hover: colors.blue }}
                    isActive={filter === 'ready-for-review'}
                />
                <StatCard
                    label="Under Review"
                    count={statsMap.UNDER_REVIEW || 0}
                    icon="🔍"
                    filter="under-review"
                    colorStyles={{ bg: '#F3E8FF', text: '#7C3AED', hover: '#A78BFA' }}
                    isActive={filter === 'under-review'}
                />
                <StatCard
                    label="Approved"
                    count={statsMap.APPROVED || 0}
                    icon="✅"
                    filter="approved"
                    colorStyles={{ bg: colors.successLight, text: colors.successDark, hover: colors.success }}
                    isActive={filter === 'approved'}
                />
                <StatCard
                    label="Rejected"
                    count={statsMap.REJECTED || 0}
                    icon="❌"
                    filter="rejected"
                    colorStyles={{ bg: colors.errorLight, text: colors.errorDark, hover: colors.error }}
                    isActive={filter === 'rejected'}
                />
                <StatCard
                    label="More Info Needed"
                    count={statsMap.MORE_INFO_NEEDED || 0}
                    icon="📝"
                    filter="more-info"
                    colorStyles={{ bg: '#FED7AA', text: '#EA580C', hover: '#FB923C' }}
                    isActive={filter === 'more-info'}
                />
            </div>

            {/* Requests Table */}
            <div style={{
                backgroundColor: 'white',
                borderRadius: borderRadius.lg,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            }}>
                <div style={{ padding: '24px', borderBottom: `1px solid ${colors.gray200}` }}>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>
                        {filter === 'all' ? 'All Badge Requests' : `${getFilterTitle(filter)} Requests`}
                    </h2>
                    <p style={{ marginTop: '4px', fontSize: '14px', color: colors.textSecondary }}>
                        {requests.length} {requests.length === 1 ? 'request' : 'requests'} found
                    </p>
                </div>

                {requests.length === 0 ? (
                    <div style={{ padding: '96px 24px', textAlign: 'center' }}>
                        <div style={{ fontSize: '48px', color: colors.gray400, marginBottom: '16px' }}>📭</div>
                        <p style={{ color: colors.textPrimary, fontWeight: '600' }}>No requests found</p>
                        <p style={{ color: colors.textSecondary, fontSize: '14px', marginTop: '4px' }}>
                            {filter === 'all'
                                ? 'There are no badge requests yet.'
                                : 'Try selecting a different filter.'}
                        </p>
                    </div>
                ) : (
                    <BadgeRequestsTable
                        requests={requests}
                        statusColors={statusColors}
                        statusIcons={statusIcons}
                    />
                )}
            </div>
        </>
    );
}

function getFilterTitle(filter: string): string {
    const titles: Record<string, string> = {
        'pending-payment': 'Pending Payment',
        'ready-for-review': 'Ready to Review',
        'under-review': 'Under Review',
        'approved': 'Approved',
        'rejected': 'Rejected',
        'more-info': 'More Info Needed',
    };
    return titles[filter] || 'All';
}

export default async function AdminBadgeRequestsPage({
    searchParams,
}: {
    searchParams: Promise<{ filter?: string }>;
}) {
    const params = await searchParams;
    const filter = params.filter || 'ready-for-review';

    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.roles.includes('ADMIN')) {
        redirect('/');
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

    return (
        <AdminDashboardWrapper
            userName={currentUser.name || undefined}
            userAvatar={currentUser.profileImage || undefined}
            pendingBadgeRequests={pendingBadgeRequests}
            pendingAgentApplications={pendingAgentApplications}
            pendingReports={pendingReports}
        >
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
                    Badge Request Queue
                </h1>
                <p style={{ fontSize: '14px', color: colors.textSecondary }}>
                    Review and manage fixer badge verification requests
                </p>
            </div>

            {/* Filter Tabs */}
            <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                <FilterTab label="All" filter="all" isActive={filter === 'all'} />
                <FilterTab label="Ready to Review" filter="ready-for-review" isActive={filter === 'ready-for-review'} />
                <FilterTab label="Under Review" filter="under-review" isActive={filter === 'under-review'} />
                <FilterTab label="More Info Needed" filter="more-info" isActive={filter === 'more-info'} />
                <FilterTab label="Approved" filter="approved" isActive={filter === 'approved'} />
                <FilterTab label="Rejected" filter="rejected" isActive={filter === 'rejected'} />
                <FilterTab label="Pending Payment" filter="pending-payment" isActive={filter === 'pending-payment'} />
            </div>

            {/* Main Content */}
            <Suspense fallback={<LoadingSkeleton />}>
                <BadgeRequestsQueue filter={filter} />
            </Suspense>
        </AdminDashboardWrapper>
    );
}

function LoadingSkeleton() {
    return (
        <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            backgroundColor: colors.white,
                            border: `2px solid ${colors.gray200}`,
                            borderRadius: borderRadius.lg,
                            padding: '16px',
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                        }}
                    >
                        <div style={{ height: '16px', backgroundColor: colors.gray200, borderRadius: borderRadius.md, width: '75%', marginBottom: '12px' }}></div>
                        <div style={{ height: '32px', backgroundColor: colors.gray200, borderRadius: borderRadius.md, width: '50%' }}></div>
                    </div>
                ))}
            </div>
            <div style={{
                backgroundColor: 'white',
                borderRadius: borderRadius.lg,
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                padding: '32px',
            }}>
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        style={{
                            height: '64px',
                            backgroundColor: colors.gray200,
                            borderRadius: borderRadius.md,
                            marginBottom: i < 4 ? '12px' : 0,
                            animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                        }}
                    ></div>
                ))}
            </div>
        </>
    );
}
