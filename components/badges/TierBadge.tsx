import React from 'react';

export type BadgeTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | null;

interface TierBadgeProps {
  tier: BadgeTier;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  className?: string;
}

const tierConfig = {
  BRONZE: {
    emoji: '🥉',
    color: 'bg-gradient-to-br from-amber-600 to-amber-800',
    textColor: 'text-amber-600',
    borderColor: 'border-amber-600',
    label: 'Bronze',
    description: '1-2 verified badges',
  },
  SILVER: {
    emoji: '🥈',
    color: 'bg-gradient-to-br from-gray-400 to-gray-600',
    textColor: 'text-gray-600',
    borderColor: 'border-gray-600',
    label: 'Silver',
    description: '3-4 verified badges',
  },
  GOLD: {
    emoji: '🥇',
    color: 'bg-gradient-to-br from-yellow-400 to-yellow-600',
    textColor: 'text-yellow-600',
    borderColor: 'border-yellow-600',
    label: 'Gold',
    description: '5+ verified badges',
  },
  PLATINUM: {
    emoji: '💎',
    color: 'bg-gradient-to-br from-purple-500 to-indigo-600',
    textColor: 'text-purple-600',
    borderColor: 'border-purple-600',
    label: 'Platinum',
    description: '5+ badges + Top 5% performer',
  },
};

export default function TierBadge({
  tier,
  size = 'medium',
  showLabel = true,
  className = '',
}: TierBadgeProps) {
  if (!tier) {
    return null;
  }

  const config = tierConfig[tier];

  const sizeClasses = {
    small: {
      container: 'px-2 py-1',
      emoji: 'text-sm',
      text: 'text-xs',
    },
    medium: {
      container: 'px-3 py-1.5',
      emoji: 'text-base',
      text: 'text-sm',
    },
    large: {
      container: 'px-4 py-2',
      emoji: 'text-xl',
      text: 'text-base',
    },
  };

  const sizes = sizeClasses[size];

  return (
    <div
      className={`
        inline-flex items-center gap-1.5 rounded-full
        bg-gray-100
        ${sizes.container}
        ${className}
      `}
      title={config.description}
    >
      <span className={sizes.emoji}>{config.emoji}</span>
      {showLabel && (
        <span className={`font-semibold ${config.textColor} ${sizes.text}`}>
          {config.label}
        </span>
      )}
    </div>
  );
}

// Helper component for tier progression display
export function TierProgress({
  currentTier,
  badgeCount,
  className = '',
}: {
  currentTier: BadgeTier;
  badgeCount: number;
  className?: string;
}) {
  const getNextTier = (tier: BadgeTier): { tier: BadgeTier; required: number } | null => {
    if (!tier) return { tier: 'BRONZE', required: 1 };
    if (tier === 'BRONZE') return { tier: 'SILVER', required: 3 };
    if (tier === 'SILVER') return { tier: 'GOLD', required: 5 };
    if (tier === 'GOLD') return { tier: 'PLATINUM', required: 5 }; // Requires performance too
    return null; // Already at max
  };

  const nextTier = getNextTier(currentTier);

  if (!nextTier) {
    return (
      <div className={`text-sm text-gray-600 ${className}`}>
        🎉 You've reached the highest tier!
      </div>
    );
  }

  const remaining = nextTier.required - badgeCount;

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-2">
        <TierBadge tier={currentTier || 'BRONZE'} size="small" />
        <span className="text-xs text-gray-500">→</span>
        <TierBadge tier={nextTier.tier} size="small" />
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            tierConfig[nextTier.tier].color
          }`}
          style={{ width: `${Math.min((badgeCount / nextTier.required) * 100, 100)}%` }}
        />
      </div>
      
      <p className="text-xs text-gray-600 mt-1">
        {remaining > 0 ? (
          <>
            {remaining} more {remaining === 1 ? 'badge' : 'badges'} to reach{' '}
            <span className={tierConfig[nextTier.tier].textColor}>
              {tierConfig[nextTier.tier].label}
            </span>
          </>
        ) : nextTier.tier === 'PLATINUM' ? (
          <>Keep up the great work to qualify for Platinum!</>
        ) : (
          <>You've qualified for {tierConfig[nextTier.tier].label}!</>
        )}
      </p>
    </div>
  );
}
