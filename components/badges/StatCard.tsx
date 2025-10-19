'use client';

import Link from 'next/link';
import { colors } from '@/lib/theme';

interface StatCardProps {
    label: string;
    count: number;
    icon: string;
    filter: string;
    colorStyles: {
        bg: string;
        text: string;
        hover: string;
    };
    isActive: boolean;
}

export function StatCard({ label, count, icon, filter, colorStyles, isActive }: StatCardProps) {
    return (
        <Link
            href={`/admin/badges/requests?filter=${filter}`}
            style={{ textDecoration: 'none', display: 'block' }}
        >
            <div
                style={{
                    padding: '20px',
                    backgroundColor: colors.white,
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                    border: isActive ? `2px solid ${colors.primary}` : `1px solid ${colors.gray200}`,
                    transition: 'all 0.2s',
                    cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '24px' }}>{icon}</span>
                    <span
                        style={{
                            fontSize: '14px',
                            fontWeight: '500',
                            color: colors.textSecondary,
                        }}
                    >
                        {label}
                    </span>
                </div>
                <div
                    style={{
                        fontSize: '28px',
                        fontWeight: '700',
                        color: colorStyles.text,
                    }}
                >
                    {count}
                </div>
            </div>
        </Link>
    );
}
