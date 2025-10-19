'use client';

import Link from 'next/link';
import { colors } from '@/lib/theme';

type BadgeRequestStatus =
    | 'PENDING'
    | 'PAYMENT_RECEIVED'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'MORE_INFO_NEEDED';

interface BadgeRequest {
    id: string;
    badge: { name: string; icon: string };
    fixer: { id: string; name: string | null; email: string; profileImage: string | null };
    paymentAmount: number;
    status: BadgeRequestStatus;
    createdAt: Date;
}

interface StatusColors {
    bg: string;
    text: string;
    border: string;
}

interface BadgeRequestsTableProps {
    requests: BadgeRequest[];
    statusColors: Record<BadgeRequestStatus, StatusColors>;
    statusIcons: Record<BadgeRequestStatus, string>;
}

export function BadgeRequestsTable({ requests, statusColors, statusIcons }: BadgeRequestsTableProps) {
    const formatPrice = (kobo: number): string => {
        const naira = kobo / 100;
        return `₦${naira.toLocaleString('en-NG')}`;
    };

    const formatDate = (date: Date): string => {
        return new Date(date).toLocaleDateString('en-NG', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr style={{ borderBottom: `2px solid ${colors.gray200}` }}>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                            Fixer
                        </th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                            Badge
                        </th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                            Amount
                        </th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                            Status
                        </th>
                        <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                            Date
                        </th>
                        <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {requests.length === 0 ? (
                        <tr>
                            <td colSpan={6} style={{ padding: '48px', textAlign: 'center', color: colors.textTertiary }}>
                                No badge requests found
                            </td>
                        </tr>
                    ) : (
                        requests.map((request) => (
                            <tr
                                key={request.id}
                                style={{
                                    borderBottom: `1px solid ${colors.gray200}`,
                                    transition: 'background-color 0.2s',
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.gray50}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.white}
                            >
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        {request.fixer.profileImage ? (
                                            <img
                                                src={request.fixer.profileImage}
                                                alt={request.fixer.name || 'Fixer'}
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    objectFit: 'cover',
                                                }}
                                            />
                                        ) : (
                                            <div
                                                style={{
                                                    width: '40px',
                                                    height: '40px',
                                                    borderRadius: '50%',
                                                    backgroundColor: colors.gray200,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '16px',
                                                    fontWeight: '600',
                                                    color: colors.textSecondary,
                                                }}
                                            >
                                                {request.fixer.name?.charAt(0).toUpperCase() || '?'}
                                            </div>
                                        )}
                                        <div>
                                            <div style={{ fontWeight: '500', color: colors.textPrimary }}>
                                                {request.fixer.name || 'Unknown'}
                                            </div>
                                            <div style={{ fontSize: '14px', color: colors.textTertiary }}>
                                                {request.fixer.email}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span style={{ fontSize: '24px' }}>{request.badge.icon}</span>
                                        <span style={{ fontWeight: '500', color: colors.textPrimary }}>
                                            {request.badge.name}
                                        </span>
                                    </div>
                                </td>
                                <td style={{ padding: '16px', fontWeight: '600', color: colors.textPrimary }}>
                                    {formatPrice(request.paymentAmount)}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span
                                        style={{
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '6px',
                                            padding: '4px 12px',
                                            borderRadius: '9999px',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            backgroundColor: statusColors[request.status].bg,
                                            color: statusColors[request.status].text,
                                            border: `1px solid ${statusColors[request.status].border}`,
                                        }}
                                    >
                                        <span>{statusIcons[request.status]}</span>
                                        {request.status.replace(/_/g, ' ')}
                                    </span>
                                </td>
                                <td style={{ padding: '16px', color: colors.textSecondary }}>
                                    {formatDate(request.createdAt)}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'center' }}>
                                    <Link
                                        href={`/admin/badges/requests/${request.id}`}
                                        style={{
                                            display: 'inline-block',
                                            padding: '6px 16px',
                                            backgroundColor: colors.primary,
                                            color: colors.white,
                                            borderRadius: '6px',
                                            fontSize: '14px',
                                            fontWeight: '500',
                                            textDecoration: 'none',
                                            transition: 'background-color 0.2s',
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = colors.primaryHover}
                                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = colors.primary}
                                    >
                                        Review
                                    </Link>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
}
