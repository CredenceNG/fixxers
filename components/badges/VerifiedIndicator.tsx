import React from 'react';

interface VerifiedIndicatorProps {
    isVerified: boolean;
    size?: 'small' | 'medium' | 'large';
    showLabel?: boolean;
    className?: string;
}

export default function VerifiedIndicator({
    isVerified,
    size = 'medium',
    showLabel = false,
    className = '',
}: VerifiedIndicatorProps) {
    if (!isVerified) {
        return null;
    }

    const sizeClasses = {
        small: {
            icon: 'w-4 h-4',
            text: 'text-xs',
        },
        medium: {
            icon: 'w-5 h-5',
            text: 'text-sm',
        },
        large: {
            icon: 'w-6 h-6',
            text: 'text-base',
        },
    };

    const sizes = sizeClasses[size];

    return (
        <div className={`inline-flex items-center gap-1 ${className}`}>
            <svg
                className={`${sizes.icon} text-blue-500 flex-shrink-0`}
                fill="currentColor"
                viewBox="0 0 20 20"
                xmlns="http://www.w3.org/2000/svg"
            >
                <path
                    fillRule="evenodd"
                    d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                />
            </svg>
            {showLabel && (
                <span className={`font-medium text-blue-600 ${sizes.text}`}>
                    Verified
                </span>
            )}
        </div>
    );
}

// Alternative simple checkmark version
export function VerifiedCheckmark({
    size = 'medium',
    className = '',
}: {
    size?: 'small' | 'medium' | 'large';
    className?: string;
}) {
    const sizeClasses = {
        small: 'w-3 h-3',
        medium: 'w-4 h-4',
        large: 'w-5 h-5',
    };

    return (
        <div className={`inline-flex items-center justify-center rounded-full bg-blue-500 p-0.5 ${className}`}>
            <svg
                className={`${sizeClasses[size]} text-white`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={3}
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                />
            </svg>
        </div>
    );
}
