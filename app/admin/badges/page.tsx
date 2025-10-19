import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors, borderRadius } from '@/lib/theme';

type BadgeType =
    | 'IDENTITY_VERIFICATION'
    | 'INSURANCE_VERIFICATION'
    | 'BACKGROUND_CHECK'
    | 'SKILL_CERTIFICATION'
    | 'QUALITY_PERFORMANCE';

const badgeTypeLabels: Record<BadgeType, string> = {
    IDENTITY_VERIFICATION: 'Identity Verification',
    INSURANCE_VERIFICATION: 'Insurance Verification',
    BACKGROUND_CHECK: 'Background Check',
    SKILL_CERTIFICATION: 'Skill Certification',
    QUALITY_PERFORMANCE: 'Quality Performance',
};

async function BadgeManagementContent({ pendingBadgeRequests, pendingAgentApplications, pendingReports }: {
    pendingBadgeRequests: number;
    pendingAgentApplications: number;
    pendingReports: number;
}) {
    const prismaAny = prisma as any;

    const badges = await prismaAny.badge.findMany({
        orderBy: [
            { isActive: 'desc' },
            { cost: 'asc' },
        ],
        include: {
            _count: {
                select: {
                    requests: true,
                    assignments: true,
                },
            },
        },
    });

    return (
        <>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '24px'
            }}>
                <div>
                    <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary }}>
                        All Badges ({badges.length})
                    </h2>
                    <p style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '4px' }}>
                        Manage badge requirements, costs, and settings
                    </p>
                </div>
                <Link href="/admin/badges/requests" style={{
                    padding: '10px 20px',
                    backgroundColor: colors.white,
                    color: colors.primary,
                    border: `2px solid ${colors.primary}`,
                    borderRadius: borderRadius.md,
                    fontSize: '14px',
                    fontWeight: '600',
                    textDecoration: 'none',
                    display: 'inline-block',
                }}>
                    📝 View Badge Requests
                </Link>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))',
                gap: '24px'
            }}>
                {badges.map((badge: any) => (
                    <div key={badge.id} style={{
                        backgroundColor: 'white',
                        borderRadius: borderRadius.lg,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        padding: '24px',
                    }}>
                            {/* Header */}
                            <div style={{ display: 'flex', alignItems: 'start', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <span style={{ fontSize: '32px' }}>{badge.icon}</span>
                                    <div>
                                        <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>
                                            {badge.name}
                                        </h3>
                                        <span style={{
                                            fontSize: '12px',
                                            color: colors.textSecondary,
                                            fontWeight: '500'
                                        }}>
                                            {badgeTypeLabels[badge.type as BadgeType]}
                                        </span>
                                    </div>
                                </div>
                                <div style={{
                                    padding: '4px 12px',
                                    borderRadius: borderRadius.md,
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    backgroundColor: badge.isActive ? colors.successLight : colors.errorLight,
                                    color: badge.isActive ? colors.successDark : colors.errorDark,
                                }}>
                                    {badge.isActive ? '✓ Active' : '✗ Inactive'}
                                </div>
                            </div>

                            {/* Description */}
                            <p style={{
                                fontSize: '14px',
                                color: colors.textSecondary,
                                lineHeight: '1.5',
                                marginBottom: '16px'
                            }}>
                                {badge.description}
                            </p>

                            {/* Stats Grid */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '12px',
                                marginBottom: '16px',
                                padding: '16px',
                                backgroundColor: colors.gray50,
                                borderRadius: borderRadius.md
                            }}>
                                <div>
                                    <p style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>
                                        Cost
                                    </p>
                                    <p style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                                        {badge.cost === 0 ? 'FREE' : `₦${(badge.cost / 100).toLocaleString()}`}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>
                                        Expiry
                                    </p>
                                    <p style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                                        {badge.expiryMonths ? `${badge.expiryMonths} months` : 'No expiry'}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>
                                        Requests
                                    </p>
                                    <p style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                                        {badge._count.requests}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '4px' }}>
                                        Assigned
                                    </p>
                                    <p style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                                        {badge._count.assignments}
                                    </p>
                                </div>
                            </div>

                            {/* Required Documents */}
                            <div style={{ marginBottom: '16px' }}>
                                <p style={{
                                    fontSize: '12px',
                                    fontWeight: '600',
                                    color: colors.textSecondary,
                                    marginBottom: '8px',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.5px'
                                }}>
                                    {badge.isAutomatic ? 'Performance Criteria' : 'Required Documents'}
                                </p>
                                {badge.isAutomatic ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {badge.minJobsRequired && (
                                            <div style={{
                                                fontSize: '13px',
                                                color: colors.textPrimary,
                                                padding: '6px 12px',
                                                backgroundColor: colors.white,
                                                borderRadius: borderRadius.sm,
                                                border: `1px solid ${colors.gray200}`
                                            }}>
                                                📊 Min Jobs: <strong>{badge.minJobsRequired}</strong>
                                            </div>
                                        )}
                                        {badge.minAverageRating && (
                                            <div style={{
                                                fontSize: '13px',
                                                color: colors.textPrimary,
                                                padding: '6px 12px',
                                                backgroundColor: colors.white,
                                                borderRadius: borderRadius.sm,
                                                border: `1px solid ${colors.gray200}`
                                            }}>
                                                ⭐ Min Rating: <strong>{badge.minAverageRating}</strong>
                                            </div>
                                        )}
                                        {badge.maxCancellationRate && (
                                            <div style={{
                                                fontSize: '13px',
                                                color: colors.textPrimary,
                                                padding: '6px 12px',
                                                backgroundColor: colors.white,
                                                borderRadius: borderRadius.sm,
                                                border: `1px solid ${colors.gray200}`
                                            }}>
                                                ❌ Max Cancellation: <strong>{(badge.maxCancellationRate * 100).toFixed(0)}%</strong>
                                            </div>
                                        )}
                                        {badge.maxResponseMinutes && (
                                            <div style={{
                                                fontSize: '13px',
                                                color: colors.textPrimary,
                                                padding: '6px 12px',
                                                backgroundColor: colors.white,
                                                borderRadius: borderRadius.sm,
                                                border: `1px solid ${colors.gray200}`
                                            }}>
                                                ⚡ Max Response: <strong>{badge.maxResponseMinutes} min</strong>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {(badge.requiredDocuments as string[]).map((doc: string, idx: number) => (
                                            <span
                                                key={idx}
                                                style={{
                                                    fontSize: '12px',
                                                    padding: '6px 12px',
                                                    backgroundColor: colors.blueLight,
                                                    color: colors.blue,
                                                    borderRadius: borderRadius.full,
                                                    fontWeight: '500',
                                                }}
                                            >
                                                {doc.replace(/_/g, ' ')}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <Link href={`/admin/badges/${badge.id}/edit`} style={{
                                display: 'block',
                                width: '100%',
                                padding: '10px 20px',
                                backgroundColor: colors.primary,
                                color: 'white',
                                borderRadius: borderRadius.md,
                                fontSize: '14px',
                                fontWeight: '600',
                                textAlign: 'center',
                                textDecoration: 'none',
                            }}>
                                ✏️ Edit Badge Settings
                            </Link>
                    </div>
                ))}
            </div>

            {badges.length === 0 && (
                <div style={{
                    backgroundColor: 'white',
                    borderRadius: borderRadius.lg,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                    padding: '48px',
                    textAlign: 'center',
                }}>
                    <span style={{ fontSize: '64px' }}>🏅</span>
                    <h3 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginTop: '16px' }}>
                        No Badges Found
                    </h3>
                    <p style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '8px' }}>
                        Run the database seed to create default badges
                    </p>
                </div>
            )}
        </>
    );
}

export default async function AdminBadgesPage() {
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
                    Badge Management
                </h1>
                <p style={{ fontSize: '14px', color: colors.textSecondary }}>
                    Configure badge requirements, costs, and verification criteria
                </p>
            </div>
            <BadgeManagementContent
                pendingBadgeRequests={pendingBadgeRequests}
                pendingAgentApplications={pendingAgentApplications}
                pendingReports={pendingReports}
            />
        </AdminDashboardWrapper>
    );
}
