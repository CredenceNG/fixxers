'use client';

import Link from 'next/link';
import { colors } from '@/lib/theme';

interface FilterTabProps {
    label: string;
    filter: string;
    isActive: boolean;
}

export function FilterTab({ label, filter, isActive }: FilterTabProps) {
    return (
        <Link
            href={`/admin/badges/requests?filter=${filter}`}
            style={{
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                textDecoration: 'none',
                backgroundColor: isActive ? colors.primary : 'transparent',
                color: isActive ? colors.white : colors.textSecondary,
                transition: 'all 0.2s',
                display: 'inline-block',
            }}
            onMouseEnter={(e) => {
                if (!isActive) {
                    e.currentTarget.style.backgroundColor = colors.gray100;
                }
            }}
            onMouseLeave={(e) => {
                if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                }
            }}
        >
            {label}
        </Link>
    );
}
