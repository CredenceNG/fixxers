/**
 * Fixer Badges Dashboard
 * /fixer/badges
 * 
 * Shows fixer's current badges, available badges, and badge requests
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Suspense } from 'react';
import { calculateBadgeTier, getFixerActiveBadges, formatBadgePrice, getTierColor } from '@/lib/badges/badge-utils';
import { BadgeSuccessAlert } from '@/components/badges/BadgeSuccessAlert';
import { colors, borderRadius } from '@/lib/theme';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard, DashboardButton } from '@/components/DashboardLayout';
import { TierBadge, TierProgress, BadgeCard } from '@/components/badges';

export default async function FixerBadgesPage() {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/auth/login?redirect=/fixer/badges');
    }

    if (!user.roles.includes('FIXER')) {
        redirect('/dashboard');
    }

    // Get fixer's active badges
    const activeBadges = await getFixerActiveBadges(user.id);

    // Get all available badges
    const allBadges = await prisma.badge.findMany({
        where: { isActive: true },
        orderBy: [
            { isAutomatic: 'asc' },
            { cost: 'asc' },
        ],
    });

    // Get badge requests
    const badgeRequests = await prisma.badgeRequest.findMany({
        where: { fixerId: user.id },
        include: { badge: true },
        orderBy: { createdAt: 'desc' },
        take: 5,
    });

    // Calculate tier
    const tier = await calculateBadgeTier(user.id);
    const tierColor = getTierColor(tier);

    // Get tier labels
    const tierLabels = {
        BRONZE: 'Bronze Verified',
        SILVER: 'Trusted Professional',
        GOLD: 'Premium Verified',
        PLATINUM: 'Elite Professional',
    };

    const tierEmojis = {
        BRONZE: '🥉',
        SILVER: '🥈',
        GOLD: '🥇',
        PLATINUM: '💎',
    };

    // Determine next tier
    const activeBadgeCount = activeBadges.length;
    let nextTier = null;
    let badgesNeeded = 0;

    if (activeBadgeCount === 0) {
        nextTier = 'BRONZE';
        badgesNeeded = 1;
    } else if (activeBadgeCount <= 2) {
        nextTier = 'SILVER';
        badgesNeeded = 3 - activeBadgeCount;
    } else if (activeBadgeCount <= 4) {
        nextTier = 'GOLD';
        badgesNeeded = 5 - activeBadgeCount;
    } else if (tier === 'GOLD') {
        nextTier = 'PLATINUM';
        badgesNeeded = 0;
    }

    return (
        <DashboardLayoutWithHeader
            title="My Badges"
            subtitle="Earn trust badges to stand out and increase your credibility"
            actions={
                <DashboardButton variant="outline" href="/fixer/dashboard">
                    ← Back to Dashboard
                </DashboardButton>
            }
        >
            {/* Success Alert */}
            <Suspense fallback={null}>
                <BadgeSuccessAlert />
            </Suspense>

            {/* Tier & Active Badges Combined */}
            <DashboardCard title="Your Trust Profile" style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
                    {/* Left - Tier Status */}
                    <div style={{
                        flex: '1 1 300px',
                        padding: '24px',
                        backgroundColor: colors.bgSecondary,
                        borderRadius: borderRadius.lg,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                            {tier && <TierBadge tier={tier} size="medium" showLabel={false} />}
                            <div>
                                <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                                    {tier ? tierLabels[tier] : 'Not Yet Verified'}
                                </h3>
                                <p style={{ fontSize: '13px', color: colors.textSecondary, margin: 0 }}>
                                    {activeBadgeCount} active badge{activeBadgeCount !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        {tier && activeBadgeCount < 5 && (
                            <div style={{ marginTop: '16px' }}>
                                <TierProgress currentTier={tier} badgeCount={activeBadgeCount} />
                            </div>
                        )}

                        {!tier && (
                            <p style={{ fontSize: '14px', color: colors.textSecondary, lineHeight: '1.5', margin: 0 }}>
                                Get your first verified badge to start building trust and credibility with clients.
                            </p>
                        )}
                    </div>

                    {/* Right - Active Badges */}
                    <div style={{ flex: '2 1 500px' }}>
                        {activeBadges.length > 0 ? (
                            <>
                                <h3 style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px' }}>
                                    Active Verifications
                                </h3>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                    {activeBadges.map((assignment) => (
                                        <div
                                            key={assignment.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                padding: '8px 14px',
                                                backgroundColor: colors.bgSecondary,
                                                borderRadius: borderRadius.md,
                                                fontSize: '14px',
                                            }}
                                        >
                                            <span style={{ fontSize: '18px' }}>{assignment.badge.icon}</span>
                                            <span style={{ fontWeight: '500', color: colors.textPrimary }}>
                                                {assignment.badge.name}
                                            </span>
                                            <span style={{ fontSize: '12px', color: colors.success }}>✓</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div style={{ padding: '24px', backgroundColor: colors.bgSecondary, borderRadius: borderRadius.lg, textAlign: 'center' }}>
                                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🏅</div>
                                <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
                                    No verified badges yet. Browse available badges below.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </DashboardCard>

            {/* Available Badges */}
            <DashboardCard title={`Available Verifications (${allBadges.length})`} style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {allBadges.map((badge) => {
                        const hasActiveBadge = activeBadges.some((a) => a.badgeId === badge.id);
                        const hasPendingRequest = badgeRequests.some(
                            (r) => r.badgeId === badge.id && ['PENDING', 'PAYMENT_RECEIVED', 'UNDER_REVIEW'].includes(r.status)
                        );

                        return (
                            <div
                                key={badge.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    padding: '16px',
                                    backgroundColor: hasActiveBadge ? colors.bgSecondary : colors.bgSecondary,
                                    borderRadius: borderRadius.md,
                                    opacity: hasActiveBadge ? 0.6 : 1,
                                    transition: 'all 0.2s ease'
                                }}
                            >
                                {/* Badge Icon */}
                                <div style={{
                                    fontSize: '32px',
                                    lineHeight: 1,
                                    flexShrink: 0,
                                }}>
                                    {badge.icon}
                                </div>

                                {/* Badge Info */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <h3 style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
                                            {badge.name}
                                        </h3>
                                        {badge.isAutomatic && (
                                            <span style={{
                                                padding: '2px 8px',
                                                fontSize: '11px',
                                                fontWeight: '600',
                                                color: colors.info,
                                                backgroundColor: colors.blueLight,
                                                borderRadius: borderRadius.full
                                            }}>
                                                AUTO
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '13px', color: colors.textSecondary, lineHeight: '1.4', margin: 0 }}>
                                        {badge.description}
                                    </p>
                                </div>

                                {/* Price & Action */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '16px',
                                    flexShrink: 0
                                }}>
                                    {!badge.isAutomatic && (
                                        <div style={{
                                            fontSize: '15px',
                                            fontWeight: '600',
                                            color: colors.textPrimary,
                                            minWidth: '80px',
                                            textAlign: 'right'
                                        }}>
                                            {formatBadgePrice(badge.cost)}
                                        </div>
                                    )}

                                    {hasActiveBadge ? (
                                        <span style={{
                                            padding: '6px 12px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: colors.success,
                                            backgroundColor: colors.successLight,
                                            borderRadius: borderRadius.md,
                                            minWidth: '80px',
                                            textAlign: 'center'
                                        }}>
                                            ✓ Active
                                        </span>
                                    ) : hasPendingRequest ? (
                                        <span style={{
                                            padding: '6px 12px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            color: colors.warningDark,
                                            backgroundColor: colors.warningLight,
                                            borderRadius: borderRadius.md,
                                            minWidth: '80px',
                                            textAlign: 'center'
                                        }}>
                                            Pending
                                        </span>
                                    ) : badge.isAutomatic ? (
                                        <span style={{
                                            padding: '6px 12px',
                                            fontSize: '12px',
                                            color: colors.textTertiary,
                                            minWidth: '80px',
                                            textAlign: 'center'
                                        }}>
                                            Auto
                                        </span>
                                    ) : (
                                        <Link
                                            href={`/fixer/badges/request/${badge.id}`}
                                            style={{
                                                padding: '8px 16px',
                                                fontSize: '13px',
                                                fontWeight: '600',
                                                color: colors.white,
                                                backgroundColor: colors.primary,
                                                borderRadius: borderRadius.md,
                                                textDecoration: 'none',
                                                transition: 'all 0.2s ease',
                                                minWidth: '80px',
                                                textAlign: 'center'
                                            }}
                                        >
                                            Request
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </DashboardCard>

            {/* Recent Requests */}
            {badgeRequests.length > 0 && (
                <DashboardCard>
                    <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
                        Recent Requests
                    </h2>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                                    <th style={{
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: colors.textSecondary,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        Badge
                                    </th>
                                    <th style={{
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: colors.textSecondary,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        Status
                                    </th>
                                    <th style={{
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: colors.textSecondary,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        Submitted
                                    </th>
                                    <th style={{
                                        padding: '12px 16px',
                                        textAlign: 'left',
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        color: colors.textSecondary,
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.05em'
                                    }}>
                                        Amount
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {badgeRequests.map((request, index) => (
                                    <tr
                                        key={request.id}
                                        style={{
                                            borderBottom: index < badgeRequests.length - 1 ? `1px solid ${colors.border}` : 'none',
                                            transition: 'background-color 0.15s'
                                        }}
                                        className="table-row-hover"
                                    >
                                        <td style={{ padding: '16px' }}>
                                            <Link href={`/fixer/badges/requests/${request.id}`} style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
                                                <span style={{ fontSize: '24px', marginRight: '12px' }}>{request.badge.icon}</span>
                                                <span style={{ fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
                                                    {request.badge.name}
                                                </span>
                                            </Link>
                                        </td>
                                        <td style={{ padding: '16px' }}>
                                            <Link href={`/fixer/badges/requests/${request.id}`}>
                                                <span
                                                    style={{
                                                        padding: '4px 12px',
                                                        display: 'inline-block',
                                                        fontSize: '12px',
                                                        fontWeight: '600',
                                                        borderRadius: borderRadius.full,
                                                        backgroundColor: request.status === 'APPROVED' ? colors.successLight :
                                                            request.status === 'REJECTED' ? colors.errorLight :
                                                                request.status === 'UNDER_REVIEW' ? colors.blueLight :
                                                                    colors.warningLight,
                                                        color: request.status === 'APPROVED' ? colors.successDark :
                                                            request.status === 'REJECTED' ? colors.errorDark :
                                                                request.status === 'UNDER_REVIEW' ? colors.info :
                                                                    colors.warningDark
                                                    }}
                                                >
                                                    {request.status.replace('_', ' ')}
                                                </span>
                                            </Link>
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '14px', color: colors.textSecondary }}>
                                            <Link href={`/fixer/badges/requests/${request.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                {new Date(request.createdAt).toLocaleDateString()}
                                            </Link>
                                        </td>
                                        <td style={{ padding: '16px', fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
                                            <Link href={`/fixer/badges/requests/${request.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                {formatBadgePrice(request.paymentAmount)}
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </DashboardCard>
            )}
        </DashboardLayoutWithHeader>
    );
}
