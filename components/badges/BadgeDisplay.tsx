import React from 'react';

export interface BadgeData {
    id: string;
    name: string;
    icon: string;
    type: string;
    expiresAt?: Date;
    status?: 'ACTIVE' | 'EXPIRED' | 'EXPIRING_SOON';
}

interface BadgeDisplayProps {
    badge: BadgeData;
    size?: 'small' | 'medium' | 'large';
    showTooltip?: boolean;
    showExpiry?: boolean;
    className?: string;
}

export default function BadgeDisplay({
    badge,
    size = 'medium',
    showTooltip = true,
    showExpiry = false,
    className = '',
}: BadgeDisplayProps) {
    const isExpired = badge.expiresAt && new Date(badge.expiresAt) < new Date();
    const isExpiringSoon = badge.expiresAt && !isExpired &&
        new Date(badge.expiresAt).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000; // 30 days

    const status = isExpired ? 'EXPIRED' : isExpiringSoon ? 'EXPIRING_SOON' : 'ACTIVE';

    const sizeClasses = {
        small: 'w-6 h-6 text-xs',
        medium: 'w-8 h-8 text-sm',
        large: 'w-12 h-12 text-base',
    };

    const tooltipId = `badge-tooltip-${badge.id}`;

    return (
        <div className={`relative inline-block ${className}`}>
            {/* Badge Icon */}
            <div
                className={`${sizeClasses[size]} flex items-center justify-center rounded-full ${isExpired
                        ? 'bg-gray-100 opacity-50'
                        : 'bg-gray-100'
                    } transition-all hover:scale-110`}
                data-tooltip-id={showTooltip ? tooltipId : undefined}
            >
                <span className={`${size === 'small' ? 'text-base' : size === 'medium' ? 'text-xl' : 'text-3xl'}`}>
                    {badge.icon}
                </span>
            </div>

            {/* Status Indicator */}
            {status === 'EXPIRING_SOON' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 border-2 border-white rounded-full"
                    title="Expiring soon" />
            )}
            {status === 'EXPIRED' && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-white rounded-full"
                    title="Expired" />
            )}

            {/* Expiry Text (optional) */}
            {showExpiry && badge.expiresAt && (
                <div className={`text-xs mt-1 text-center ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                    {isExpired ? 'Expired' : `Expires ${new Date(badge.expiresAt).toLocaleDateString()}`}
                </div>
            )}

            {/* Tooltip (CSS-based, simple version) */}
            {showTooltip && (
                <div
                    id={tooltipId}
                    className="hidden group-hover:block absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap"
                >
                    <div className="font-semibold">{badge.name}</div>
                    {badge.expiresAt && (
                        <div className="text-gray-300 mt-1">
                            {isExpired
                                ? 'Expired'
                                : `Valid until ${new Date(badge.expiresAt).toLocaleDateString()}`}
                        </div>
                    )}
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                </div>
            )}
        </div>
    );
}
