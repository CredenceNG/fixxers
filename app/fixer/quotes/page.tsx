import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard, DashboardButton, DashboardStat } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';

export default async function FixerQuotesPage() {
    const user = await getCurrentUser();
    const roles = user?.roles || [];

    if (!user || !roles.includes('FIXER')) {
        redirect('/auth/login');
    }

    // Fetch all quotes for this fixer
    const quotes = await prisma.quote.findMany({
        where: {
            fixerId: user.id,
        },
        include: {
            request: {
                include: {
                    client: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            profileImage: true,
                        },
                    },
                    subcategory: {
                        include: {
                            category: true,
                        },
                    },
                    neighborhood: true,
                },
            },
            order: true,
        },
        orderBy: { createdAt: 'desc' },
    });

    const stats = {
        total: quotes.length,
        pending: quotes.filter((q) => !q.isAccepted).length,
        accepted: quotes.filter((q) => q.isAccepted).length,
    };

    const getStatusBadge = (quote: any) => {
        let status = 'PENDING';
        let style = { bg: colors.warningLight, color: colors.warning };

        if (quote.isAccepted) {
            status = 'ACCEPTED';
            style = { bg: colors.successLight, color: colors.success };
        }

        return (
            <span
                style={{
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    borderRadius: borderRadius.full,
                    backgroundColor: style.bg,
                    color: style.color,
                }}
            >
                {status}
            </span>
        );
    };

    const formatPrice = (amount: number | null | undefined) => {
        if (!amount || isNaN(amount)) return '₦0';
        const naira = amount / 100;
        return `₦${naira.toLocaleString('en-NG')}`;
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <DashboardLayoutWithHeader
            title="My Quotes"
            subtitle="Manage your submitted quotes and track their status"
        >
            {/* Stats */}
            <div
                className="fixer-quotes-stats-grid"
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: '24px',
                    marginBottom: '32px',
                }}
            >
                <DashboardStat className="fixer-quotes-stat-card fixer-quotes-stat-label fixer-quotes-stat-value" label="Total Quotes" value={stats.total} icon="📝" />
                <DashboardStat
                    className="fixer-quotes-stat-card fixer-quotes-stat-label fixer-quotes-stat-value"
                    label="Pending"
                    value={stats.pending}
                    icon="⏳"
                    color={colors.warning}
                />
                <DashboardStat
                    className="fixer-quotes-stat-card fixer-quotes-stat-label fixer-quotes-stat-value"
                    label="Accepted"
                    value={stats.accepted}
                    icon="✅"
                    color={colors.success}
                />
            </div>

            {/* Quotes List */}
            <DashboardCard title="Recent Quotes">
                {quotes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                        <p style={{ color: colors.textSecondary, fontSize: '16px' }}>
                            No quotes submitted yet.
                        </p>
                        <p style={{ color: colors.textTertiary, fontSize: '14px' }}>
                            Start responding to service requests to create your first quote.
                        </p>
                        <DashboardButton variant="primary" href="/fixer/dashboard" style={{ marginTop: '16px' }}>
                            View Service Requests
                        </DashboardButton>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                                    <th style={{ textAlign: 'left', padding: '16px 8px', fontSize: '14px', fontWeight: '600', color: colors.textSecondary }}>
                                        Service Request
                                    </th>
                                    <th style={{ textAlign: 'left', padding: '16px 8px', fontSize: '14px', fontWeight: '600', color: colors.textSecondary }}>
                                        Client
                                    </th>
                                    <th style={{ textAlign: 'left', padding: '16px 8px', fontSize: '14px', fontWeight: '600', color: colors.textSecondary }}>
                                        Quote Amount
                                    </th>
                                    <th style={{ textAlign: 'left', padding: '16px 8px', fontSize: '14px', fontWeight: '600', color: colors.textSecondary }}>
                                        Status
                                    </th>
                                    <th style={{ textAlign: 'left', padding: '16px 8px', fontSize: '14px', fontWeight: '600', color: colors.textSecondary }}>
                                        Submitted
                                    </th>
                                    <th style={{ textAlign: 'right', padding: '16px 8px', fontSize: '14px', fontWeight: '600', color: colors.textSecondary }}>
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {quotes.map((quote) => (
                                    <tr
                                        key={quote.id}
                                        className="table-row-hover"
                                        style={{ borderBottom: `1px solid ${colors.border}` }}
                                    >
                                        <td style={{ padding: '16px 8px' }}>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
                                                    {quote.request.title}
                                                </h4>
                                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.textSecondary }}>
                                                    {quote.request.subcategory.category.name} • {quote.request.subcategory.name}
                                                </p>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 8px' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {quote.request.client.profileImage && (
                                                    <img
                                                        src={quote.request.client.profileImage}
                                                        alt={quote.request.client.name || 'Client'}
                                                        style={{
                                                            width: '32px',
                                                            height: '32px',
                                                            borderRadius: '50%',
                                                            objectFit: 'cover',
                                                        }}
                                                    />
                                                )}
                                                <div>
                                                    <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: colors.textPrimary }}>
                                                        {quote.request.client.name || 'Anonymous'}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '16px 8px' }}>
                                            <span style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
                                                {formatPrice(quote.totalAmount)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 8px' }}>
                                            {getStatusBadge(quote)}
                                        </td>
                                        <td style={{ padding: '16px 8px' }}>
                                            <span style={{ fontSize: '14px', color: colors.textSecondary }}>
                                                {formatDate(quote.createdAt)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 8px', textAlign: 'right' }}>
                                            <DashboardButton
                                                variant="outline"
                                                href={`/fixer/quotes/${quote.id}`}
                                                style={{ fontSize: '13px', padding: '6px 12px' }}
                                            >
                                                View Details
                                            </DashboardButton>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </DashboardCard>
        </DashboardLayoutWithHeader>
    );
}