'use client';

import React from 'react';
import Link from 'next/link';

interface BadgeCardProps {
    badge: {
        id: string;
        name: string;
        icon: string;
        type: string;
        description?: string;
        cost?: number;
        expiryMonths?: number;
        isActive?: boolean;
        expiresAt?: Date;
    };
    variant?: 'available' | 'active' | 'expired';
    showAction?: boolean;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export default function BadgeCard({
    badge,
    variant = 'available',
    showAction = false,
    actionLabel = 'Request Badge',
    onAction,
    className = '',
}: BadgeCardProps) {
    const isExpired = badge.expiresAt && new Date(badge.expiresAt) < new Date();
    const isExpiringSoon = badge.expiresAt && !isExpired &&
        new Date(badge.expiresAt).getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000;

    const variantStyles = {
        available: {
            container: 'border-gray-200 hover:border-blue-400 hover:shadow-lg',
            icon: 'bg-blue-50',
            badge: 'bg-blue-100 text-blue-800',
        },
        active: {
            container: 'border-green-300 bg-green-50',
            icon: 'bg-green-100',
            badge: 'bg-green-100 text-green-800',
        },
        expired: {
            container: 'border-gray-200 bg-gray-50 opacity-75',
            icon: 'bg-gray-100',
            badge: 'bg-red-100 text-red-800',
        },
    };

    const actualVariant = isExpired ? 'expired' : variant;
    const styles = variantStyles[actualVariant];

    return (
        <div
            className={`
        border-2 rounded-xl p-4 transition-all
        ${styles.container}
        ${className}
      `}
        >
            {/* Icon */}
            <div className={`w-16 h-16 rounded-full ${styles.icon} flex items-center justify-center mb-3`}>
                <span className="text-4xl">{badge.icon}</span>
            </div>

            {/* Badge Name */}
            <h3 className="text-lg font-bold text-gray-900 mb-1">
                {badge.name}
            </h3>

            {/* Type Badge */}
            <div className="mb-3">
                <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${styles.badge}`}>
                    {badge.type.replace(/_/g, ' ')}
                </span>
            </div>

            {/* Description */}
            {badge.description && (
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {badge.description}
                </p>
            )}

            {/* Details */}
            <div className="space-y-1 mb-4">
                {badge.cost !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Cost:</span>
                        <span className="font-semibold text-gray-900">
                            {badge.cost === 0 ? 'FREE' : `₦${badge.cost.toLocaleString()}`}
                        </span>
                    </div>
                )}

                {badge.expiryMonths !== undefined && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Valid for:</span>
                        <span className="font-semibold text-gray-900">
                            {badge.expiryMonths} months
                        </span>
                    </div>
                )}

                {badge.expiresAt && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                            {isExpired ? 'Expired:' : 'Expires:'}
                        </span>
                        <span className={`font-semibold ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-yellow-600' : 'text-gray-900'
                            }`}>
                            {new Date(badge.expiresAt).toISOString().split('T')[0]}
                        </span>
                    </div>
                )}
            </div>

            {/* Status Indicator */}
            {variant === 'active' && !isExpired && (
                <div className="mb-4 p-2 bg-green-100 border border-green-200 rounded-lg">
                    <div className="flex items-center text-sm text-green-800">
                        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Active Badge
                    </div>
                </div>
            )}

            {isExpiringSoon && !isExpired && (
                <div className="mb-4 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center text-sm text-yellow-800">
                        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        Expiring Soon
                    </div>
                </div>
            )}

            {isExpired && (
                <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center text-sm text-red-800">
                        <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        Badge Expired
                    </div>
                </div>
            )}

            {/* Action Button */}
            {showAction && onAction && (
                <button
                    onClick={onAction}
                    disabled={isExpired && variant === 'expired'}
                    className={`
            w-full px-4 py-2 rounded-lg font-medium transition-colors
            ${isExpired
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : variant === 'active'
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                        }
          `}
                >
                    {isExpired ? 'Renew Badge' : actionLabel}
                </button>
            )}
        </div>
    );
}

// Compact version for lists
export function BadgeCardCompact({
    badge,
    onClick,
    className = '',
}: {
    badge: {
        id: string;
        name: string;
        icon: string;
        expiresAt?: Date;
    };
    onClick?: () => void;
    className?: string;
}) {
    const isExpired = badge.expiresAt && new Date(badge.expiresAt) < new Date();

    return (
        <div
            onClick={onClick}
            className={`
        flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200
        hover:border-blue-400 hover:shadow-md transition-all cursor-pointer
        ${isExpired ? 'opacity-60' : ''}
        ${className}
      `}
        >
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                <span className="text-2xl">{badge.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-gray-900 truncate">{badge.name}</h4>
                {badge.expiresAt && (
                    <p className={`text-xs ${isExpired ? 'text-red-600' : 'text-gray-600'}`}>
                        {isExpired ? 'Expired' : `Expires ${new Date(badge.expiresAt).toLocaleDateString()}`}
                    </p>
                )}
            </div>
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
        </div>
    );
}
