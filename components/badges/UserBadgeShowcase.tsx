import React from 'react';
import BadgeGroup from './BadgeGroup';
import { BadgeData } from './BadgeDisplay';
import TierBadge, { BadgeTier } from './TierBadge';
import VerifiedIndicator from './VerifiedIndicator';

interface UserBadgeShowcaseProps {
    userName: string;
    tier: BadgeTier;
    badges: BadgeData[];
    badgeCount: number;
    variant?: 'full' | 'compact' | 'minimal';
    showTier?: boolean;
    showVerified?: boolean;
    maxVisibleBadges?: number;
    className?: string;
}

export default function UserBadgeShowcase({
    userName,
    tier,
    badges,
    badgeCount,
    variant = 'full',
    showTier = true,
    showVerified = true,
    maxVisibleBadges = 5,
    className = '',
}: UserBadgeShowcaseProps) {
    const hasActiveBadges = badges.length > 0;

    if (variant === 'minimal') {
        return (
            <div className={`inline-flex items-center gap-2 ${className}`}>
                {hasActiveBadges && showVerified && (
                    <VerifiedIndicator isVerified={true} size="small" />
                )}
                {showTier && tier && (
                    <TierBadge tier={tier} size="small" showLabel={false} />
                )}
            </div>
        );
    }

    if (variant === 'compact') {
        return (
            <div className={`flex items-center gap-3 ${className}`}>
                {/* User Name with Verified */}
                <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-gray-900">{userName}</span>
                    {hasActiveBadges && showVerified && (
                        <VerifiedIndicator isVerified={true} size="small" />
                    )}
                </div>

                {/* Tier Badge */}
                {showTier && tier && (
                    <TierBadge tier={tier} size="small" />
                )}

                {/* Badge Count */}
                {hasActiveBadges && (
                    <span className="text-sm text-gray-600">
                        {badgeCount} {badgeCount === 1 ? 'badge' : 'badges'}
                    </span>
                )}
            </div>
        );
    }

    // Full variant
    return (
        <div className={`${className}`}>
            {/* Header: Name + Verified + Tier */}
            <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-bold text-gray-900">{userName}</h3>
                {hasActiveBadges && showVerified && (
                    <VerifiedIndicator isVerified={true} size="medium" />
                )}
                {showTier && tier && (
                    <TierBadge tier={tier} size="medium" />
                )}
            </div>

            {/* Badges Display */}
            {hasActiveBadges ? (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-700">
                            Verified Badges ({badgeCount})
                        </p>
                    </div>
                    <BadgeGroup
                        badges={badges}
                        maxVisible={maxVisibleBadges}
                        size="medium"
                        showTooltip={true}
                    />
                </div>
            ) : (
                <p className="text-sm text-gray-500">No verified badges yet</p>
            )}
        </div>
    );
}

// Profile header variant with large display
export function ProfileBadgeHeader({
    userName,
    tier,
    badges,
    badgeCount,
    className = '',
}: {
    userName: string;
    tier: BadgeTier;
    badges: BadgeData[];
    badgeCount: number;
    className?: string;
}) {
    const hasActiveBadges = badges.length > 0;

    return (
        <div className={`${className}`}>
            <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{userName}</h1>
                {hasActiveBadges && (
                    <VerifiedIndicator isVerified={true} size="large" showLabel={true} />
                )}
            </div>

            <div className="flex items-center gap-4">
                {tier && (
                    <TierBadge tier={tier} size="large" showLabel={true} />
                )}

                {hasActiveBadges && (
                    <div className="flex items-center gap-2">
                        <BadgeGroup
                            badges={badges}
                            maxVisible={8}
                            size="large"
                            showTooltip={true}
                            layout="horizontal"
                        />
                    </div>
                )}
            </div>

            {hasActiveBadges && (
                <p className="text-sm text-gray-600 mt-3">
                    {badgeCount} verified {badgeCount === 1 ? 'badge' : 'badges'}
                </p>
            )}
        </div>
    );
}

// Card variant for search results and listings
export function SearchResultBadgeDisplay({
    tier,
    badges,
    className = '',
}: {
    tier: BadgeTier;
    badges: BadgeData[];
    className?: string;
}) {
    const hasActiveBadges = badges.length > 0;

    if (!hasActiveBadges && !tier) {
        return null;
    }

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {tier && <TierBadge tier={tier} size="small" showLabel={false} />}
            {hasActiveBadges && (
                <BadgeGroup
                    badges={badges}
                    maxVisible={3}
                    size="small"
                    showTooltip={true}
                />
            )}
        </div>
    );
}
