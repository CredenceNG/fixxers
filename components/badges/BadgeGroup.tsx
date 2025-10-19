import React from 'react';
import BadgeDisplay, { BadgeData } from './BadgeDisplay';

interface BadgeGroupProps {
    badges: BadgeData[];
    maxVisible?: number;
    size?: 'small' | 'medium' | 'large';
    showTooltip?: boolean;
    layout?: 'horizontal' | 'grid';
    className?: string;
}

export default function BadgeGroup({
    badges,
    maxVisible = 5,
    size = 'medium',
    showTooltip = true,
    layout = 'horizontal',
    className = '',
}: BadgeGroupProps) {
    const activeBadges = badges.filter(badge => {
        if (!badge.expiresAt) return true;
        return new Date(badge.expiresAt) >= new Date();
    });

    const visibleBadges = activeBadges.slice(0, maxVisible);
    const remainingCount = activeBadges.length - maxVisible;

    if (activeBadges.length === 0) {
        return null;
    }

    return (
        <div className={`${className}`}>
            <div className={`
        flex items-center gap-2
        ${layout === 'grid' ? 'flex-wrap' : 'flex-nowrap overflow-x-auto'}
      `}>
                {visibleBadges.map((badge) => (
                    <div key={badge.id} className="group">
                        <BadgeDisplay
                            badge={badge}
                            size={size}
                            showTooltip={showTooltip}
                        />
                    </div>
                ))}

                {/* Show "+X more" indicator */}
                {remainingCount > 0 && (
                    <div
                        className={`
              ${size === 'small' ? 'w-6 h-6 text-xs' : size === 'medium' ? 'w-8 h-8 text-sm' : 'w-12 h-12 text-base'}
              flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-semibold
              border-2 border-gray-300
            `}
                        title={`+${remainingCount} more ${remainingCount === 1 ? 'badge' : 'badges'}`}
                    >
                        +{remainingCount}
                    </div>
                )}
            </div>
        </div>
    );
}
