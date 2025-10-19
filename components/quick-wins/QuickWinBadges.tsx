'use client';

/**
 * Quick Win Components
 * Ready-to-use components for immediate value features
 * Using inline styles for compatibility
 */

import React from 'react';

// ============================================
// 1. Available Now Badge
// ============================================
interface AvailableNowBadgeProps {
    allowInstantBooking?: boolean;
    className?: string;
}

export function AvailableNowBadge({ allowInstantBooking, className = '' }: AvailableNowBadgeProps) {
    if (!allowInstantBooking) return null;

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            fontSize: '11px',
            fontWeight: '500',
            borderRadius: '9999px',
            backgroundColor: '#D1FAE5',
            color: '#065F46'
        }}>
            <span style={{
                width: '6px',
                height: '6px',
                backgroundColor: '#10B981',
                borderRadius: '50%',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite'
            }}></span>
            Available
        </span>
    );
}

// ============================================
// 2. Years of Service Badge
// ============================================
interface YearsOfServiceProps {
    createdAt: Date | string;
    className?: string;
}

export function YearsOfService({ createdAt, className = '' }: YearsOfServiceProps) {
    const joinYear = new Date(createdAt).getFullYear();
    const currentYear = new Date().getFullYear();
    const years = currentYear - joinYear;

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '11px',
            color: '#6B7280'
        }}>
            {years === 0 ? (
                <>
                    <svg width="14" height="14" fill="#2563EB" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span>New • {joinYear}</span>
                </>
            ) : (
                <span>Member {years} {years === 1 ? 'yr' : 'yrs'}</span>
            )}
        </div>
    );
}

// ============================================
// 3. Review Count Display
// ============================================
interface ReviewCountProps {
    count: number;
    averageRating?: number;
    className?: string;
}

export function ReviewCount({ count, averageRating, className = '' }: ReviewCountProps) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {averageRating !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                    <svg width="14" height="14" fill="#FBBF24" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span style={{ fontSize: '11px', fontWeight: '600' }}>{averageRating.toFixed(1)}</span>
                </div>
            )}
            <span style={{ fontSize: '11px', color: '#6B7280' }}>
                ({count.toLocaleString()})
            </span>
        </div>
    );
}

// ============================================
// 4. Service Area Display
// ============================================
interface ServiceAreaProps {
    neighbourhood: string;
    city: string;
    state?: string;
    className?: string;
}

export function ServiceArea({ neighbourhood, city, state, className = '' }: ServiceAreaProps) {
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#6B7280' }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>
                {neighbourhood}, {city}
            </span>
        </div>
    );
}

// ============================================
// 5. Response Time Badge
// ============================================
interface ResponseTimeProps {
    averageResponseMinutes?: number;
    className?: string;
}

export function ResponseTimeBadge({ averageResponseMinutes, className = '' }: ResponseTimeProps) {
    if (!averageResponseMinutes) return null;

    const hours = Math.round(averageResponseMinutes / 60);

    let bgColor = '#F3F4F6';
    let textColor = '#374151';
    let displayText = '';

    if (averageResponseMinutes < 60) {
        // Less than 1 hour - Fast!
        bgColor = '#D1FAE5';
        textColor = '#065F46';
        displayText = `~${Math.round(averageResponseMinutes)}m`;
    } else if (averageResponseMinutes < 180) {
        // Less than 3 hours - Good
        bgColor = '#DBEAFE';
        textColor = '#1E40AF';
        displayText = `~${hours}h`;
    } else if (averageResponseMinutes < 1440) {
        // Less than 24 hours
        bgColor = '#FEF3C7';
        textColor = '#92400E';
        displayText = `~${hours}h`;
    } else {
        displayText = `~${Math.round(hours / 24)}d`;
    }

    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '3px',
            padding: '2px 8px',
            fontSize: '11px',
            fontWeight: '500',
            borderRadius: '4px',
            backgroundColor: bgColor,
            color: textColor
        }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            {displayText}
        </span>
    );
}

// ============================================
// 6. Referral Code Display
// ============================================
interface ReferralCodeProps {
    code: string;
    className?: string;
}

export function ReferralCodeDisplay({ code, className = '' }: ReferralCodeProps) {
    const [copied, setCopied] = React.useState(false);

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
                borderRadius: '8px'
            }}>
                <span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '18px' }}>{code}</span>
                <button
                    onClick={copyToClipboard}
                    style={{
                        padding: '4px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                    }}
                    title="Copy code"
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#E5E7EB'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                    {copied ? (
                        <svg width="16" height="16" fill="none" stroke="#10B981" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    ) : (
                        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    )}
                </button>
            </div>
            {copied && (
                <span style={{ fontSize: '14px', color: '#10B981' }}>Copied!</span>
            )}
        </div>
    );
}

// ============================================
// 7. Jobs Completed Badge
// ============================================
interface JobsCompletedProps {
    count: number;
    className?: string;
}

export function JobsCompleted({ count, className = '' }: JobsCompletedProps) {
    if (count === 0) return null;

    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#6B7280' }}>
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{count.toLocaleString()} {count === 1 ? 'job' : 'jobs'}</span>
        </div>
    );
}
