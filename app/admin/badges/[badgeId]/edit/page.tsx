import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors, borderRadius, shadows } from '@/lib/theme';
import BadgeEditForm from '@/components/badges/BadgeEditForm';

async function BadgeEditContent({ badgeId }: { badgeId: string }) {
    const prismaAny = prisma as any;

    const badge = await prismaAny.badge.findUnique({
        where: { id: badgeId },
    });

    if (!badge) {
        return notFound();
    }

    return (
        <>
            <Link
                href="/admin/badges"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: colors.primary,
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '24px',
                    textDecoration: 'none',
                }}
            >
                ← Back to Badges
            </Link>

            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '24px'
            }}>
                <span style={{ fontSize: '48px' }}>{badge.icon}</span>
                <div>
                    <h2 style={{ fontSize: '24px', fontWeight: '600', color: colors.textPrimary }}>
                        {badge.name}
                    </h2>
                    <p style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '4px' }}>
                        {badge.type.replace(/_/g, ' ')}
                    </p>
                </div>
            </div>

            <div style={{ backgroundColor: 'white', borderRadius: borderRadius.lg, boxShadow: shadows.card, padding: '24px' }}>
                <BadgeEditForm badge={badge} />
            </div>
        </>
    );
}

export default async function AdminBadgeEditPage({
    params,
}: {
    params: Promise<{ badgeId: string }>;
}) {
    const { badgeId } = await params;
    const currentUser = await getCurrentUser();

    if (!currentUser) {
        redirect('/auth/signin');
    }

    if (!currentUser.roles?.includes('ADMIN')) {
        return notFound();
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
                    Edit Badge
                </h1>
                <p style={{ fontSize: '14px', color: colors.textSecondary }}>
                    Modify badge requirements and settings
                </p>
            </div>

            <BadgeEditContent badgeId={badgeId} />
        </AdminDashboardWrapper>
    );
}
