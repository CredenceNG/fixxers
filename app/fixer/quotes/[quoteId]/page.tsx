import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import DashboardLayoutWithHeader from '@/components/DashboardLayoutWithHeader';
import { DashboardCard } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';

interface PageProps {
    params: Promise<{
        quoteId: string;
    }>;
}

export default async function QuoteDetailPage({ params }: PageProps) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/auth/login');
    }

    const resolvedParams = await params;
    const { quoteId } = resolvedParams;

    // Fetch quote with all related data
    const quote = await prisma.quote.findUnique({
        where: { id: quoteId },
        include: {
            fixer: {
                include: {
                    fixerProfile: true,
                },
            },
            request: {
                include: {
                    client: true,
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
    });

    if (!quote) {
        redirect('/fixer/dashboard');
    }

    // Verify this quote belongs to the current fixer
    if (quote.fixerId !== user.id) {
        redirect('/fixer/dashboard');
    }

    // Calculate totals from quote fields
    const laborCost = quote.laborCost || 0;
    const materialCost = quote.materialCost || 0;
    const otherCosts = quote.otherCosts || 0;
    const subtotal = laborCost + materialCost + otherCosts;
    const inspectionFee = quote.inspectionFee || 0;
    const total = quote.totalAmount;

    return (
        <DashboardLayoutWithHeader
            title="Quote Details"
            subtitle={`Quote #${quote.id.slice(-8)}`}
        >
            {/* Back Button */}
            <div style={{ marginBottom: '24px' }}>
                <Link
                    href="/fixer/quotes"
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        backgroundColor: colors.bgSecondary,
                        border: `1px solid ${colors.border}`,
                        borderRadius: borderRadius.md,
                        padding: '8px 16px',
                        fontSize: '14px',
                        fontWeight: '600',
                        color: colors.textSecondary,
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                    }}
                >
                    ← Back to My Quotes
                </Link>
            </div>

            {/* Quote Status Banner */}
            <div style={{
                padding: '16px 24px',
                marginBottom: '24px',
                borderRadius: borderRadius.lg,
                backgroundColor: quote.isAccepted ? colors.successLight : colors.warningLight,
                border: `1px solid ${quote.isAccepted ? colors.success : colors.warning}`,
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: quote.isAccepted ? colors.success : colors.warning }}>
                            {quote.isAccepted ? '✓ Quote Accepted' : '⏳ Awaiting Client Response'}
                        </h3>
                        <p style={{ margin: '4px 0 0', fontSize: '14px', color: colors.textSecondary }}>
                            {quote.isAccepted
                                ? 'Client has accepted your quote. You can proceed with the work.'
                                : 'Your quote has been submitted. Wait for the client to accept.'}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {quote.type === 'INSPECTION_REQUIRED' && !quote.isRevised && (
                            <span style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                borderRadius: borderRadius.full,
                                backgroundColor: colors.blueLight,
                                color: colors.info,
                            }}>
                                Initial Quote
                            </span>
                        )}
                        {quote.isRevised && (
                            <span style={{
                                padding: '6px 12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                borderRadius: borderRadius.full,
                                backgroundColor: colors.primaryLight,
                                color: colors.primary,
                            }}>
                                Final Quote
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Order Link Section - Show if order exists */}
            {quote.order && (
                <div style={{
                    padding: '16px 24px',
                    marginBottom: '24px',
                    borderRadius: borderRadius.lg,
                    backgroundColor: colors.primaryLight,
                    border: `1px solid ${colors.primary}`,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: colors.primary }}>
                                📋 Order Created
                            </h3>
                            <p style={{ margin: '4px 0 0', fontSize: '14px', color: colors.textSecondary }}>
                                This quote has been converted to an active order. View order details to track progress.
                            </p>
                        </div>
                        <Link
                            href={`/orders/${quote.order.id}`}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                backgroundColor: colors.primary,
                                color: 'white',
                                padding: '10px 20px',
                                borderRadius: borderRadius.md,
                                fontSize: '14px',
                                fontWeight: '600',
                                textDecoration: 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            View Order →
                        </Link>
                    </div>
                </div>
            )}

            <div className="quote-details-grid">
                {/* Main Content */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Request Information */}
                    <DashboardCard title="Service Request">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>
                                    {quote.request.title}
                                </h4>
                                <p style={{ margin: '4px 0 0', fontSize: '14px', color: colors.textSecondary }}>
                                    {quote.request.subcategory.category.name} → {quote.request.subcategory.name}
                                </p>
                            </div>

                            {quote.request.description && (
                                <div>
                                    <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                                        Description
                                    </p>
                                    <p style={{ margin: 0, fontSize: '14px', color: colors.textPrimary, lineHeight: '1.6' }}>
                                        {quote.request.description}
                                    </p>
                                </div>
                            )}

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
                                <div>
                                    <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                                        Location
                                    </p>
                                    <p style={{ margin: 0, fontSize: '14px', color: colors.textPrimary }}>
                                        {quote.request.neighborhood?.name || quote.request.address || 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                                        Requested On
                                    </p>
                                    <p style={{ margin: 0, fontSize: '14px', color: colors.textPrimary }}>
                                        {new Date(quote.request.createdAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </DashboardCard>

                    {/* Quote Breakdown */}
                    <DashboardCard title="Quote Breakdown">
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead>
                                    <tr style={{ borderBottom: `2px solid ${colors.border}` }}>
                                        <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                                            Cost Item
                                        </th>
                                        <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                                            Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {laborCost > 0 && (
                                        <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                                            <td style={{ padding: '16px' }}>
                                                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                                                    Labor Cost
                                                </p>
                                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.textSecondary }}>
                                                    Professional service and workmanship
                                                </p>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                                                ₦{laborCost.toLocaleString()}
                                            </td>
                                        </tr>
                                    )}
                                    {materialCost > 0 && (
                                        <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                                            <td style={{ padding: '16px' }}>
                                                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                                                    Material Cost
                                                </p>
                                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.textSecondary }}>
                                                    Parts, materials, and supplies
                                                </p>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                                                ₦{materialCost.toLocaleString()}
                                            </td>
                                        </tr>
                                    )}
                                    {otherCosts > 0 && (
                                        <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
                                            <td style={{ padding: '16px' }}>
                                                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                                                    Other Costs
                                                </p>
                                                <p style={{ margin: '4px 0 0', fontSize: '13px', color: colors.textSecondary }}>
                                                    Additional expenses
                                                </p>
                                            </td>
                                            <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                                                ₦{otherCosts.toLocaleString()}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                                <tfoot>
                                    <tr style={{ borderTop: `2px solid ${colors.border}` }}>
                                        <td style={{ padding: '16px', textAlign: 'right', fontSize: '14px', fontWeight: '600', color: colors.textSecondary }}>
                                            Subtotal:
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right', fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                                            ₦{subtotal.toLocaleString()}
                                        </td>
                                    </tr>
                                    {inspectionFee > 0 && (
                                        <tr>
                                            <td style={{ padding: '8px 16px', textAlign: 'right', fontSize: '14px', color: colors.textSecondary }}>
                                                Inspection Fee:
                                            </td>
                                            <td style={{ padding: '8px 16px', textAlign: 'right', fontSize: '14px', color: colors.textPrimary }}>
                                                ₦{inspectionFee.toLocaleString()}
                                            </td>
                                        </tr>
                                    )}
                                    <tr style={{ borderTop: `1px solid ${colors.border}`, backgroundColor: colors.bgSecondary }}>
                                        <td style={{ padding: '16px', textAlign: 'right', fontSize: '16px', fontWeight: '700', color: colors.textPrimary }}>
                                            Total Amount:
                                        </td>
                                        <td style={{ padding: '16px', textAlign: 'right', fontSize: '20px', fontWeight: '700', color: colors.primary }}>
                                            ₦{total.toLocaleString()}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {quote.description && (
                            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: colors.bgSecondary, borderRadius: borderRadius.md }}>
                                <p style={{ margin: '0 0 8px', fontSize: '13px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                                    Additional Notes
                                </p>
                                <p style={{ margin: 0, fontSize: '14px', color: colors.textPrimary, lineHeight: '1.6' }}>
                                    {quote.description}
                                </p>
                            </div>
                        )}
                    </DashboardCard>
                </div>

                {/* Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Client Information */}
                    <DashboardCard title="Client">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                                    Name
                                </p>
                                <p style={{ margin: 0, fontSize: '14px', color: colors.textPrimary }}>
                                    {quote.request.client.name || 'Not provided'}
                                </p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                                    Email
                                </p>
                                <p style={{ margin: 0, fontSize: '14px', color: colors.textPrimary }}>
                                    {quote.request.client.email || 'Not provided'}
                                </p>
                            </div>
                            <div>
                                <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                                    Phone
                                </p>
                                <p style={{ margin: 0, fontSize: '14px', color: colors.textPrimary }}>
                                    {quote.request.client.phone || 'Not provided'}
                                </p>
                            </div>
                        </div>
                    </DashboardCard>

                    {/* Quote Timeline */}
                    <DashboardCard title="Timeline">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                                    Quote Submitted
                                </p>
                                <p style={{ margin: 0, fontSize: '14px', color: colors.textPrimary }}>
                                    {new Date(quote.createdAt).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                            {quote.updatedAt && quote.updatedAt.toString() !== quote.createdAt.toString() && (
                                <div>
                                    <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                                        Last Updated
                                    </p>
                                    <p style={{ margin: 0, fontSize: '14px', color: colors.textPrimary }}>
                                        {new Date(quote.updatedAt).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </p>
                                </div>
                            )}
                            {quote.estimatedDuration && (
                                <div>
                                    <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                                        Estimated Duration
                                    </p>
                                    <p style={{ margin: 0, fontSize: '14px', color: colors.textPrimary }}>
                                        {quote.estimatedDuration}
                                    </p>
                                </div>
                            )}
                            {quote.startDate && (
                                <div>
                                    <p style={{ margin: '0 0 4px', fontSize: '12px', fontWeight: '600', color: colors.textSecondary, textTransform: 'uppercase' }}>
                                        Proposed Start Date
                                    </p>
                                    <p style={{ margin: 0, fontSize: '14px', color: colors.textPrimary }}>
                                        {new Date(quote.startDate).toLocaleDateString('en-US', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </DashboardCard>

                    {/* Actions */}
                    {!quote.isAccepted && (
                        <DashboardCard title="Actions">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <p style={{ margin: 0, fontSize: '14px', color: colors.textSecondary, lineHeight: '1.6' }}>
                                    Your quote is awaiting client response. You'll be notified when the client accepts or requests changes.
                                </p>
                                <Link
                                    href="/fixer/dashboard"
                                    style={{
                                        display: 'block',
                                        padding: '12px 24px',
                                        textAlign: 'center',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: colors.primary,
                                        backgroundColor: colors.primaryLight,
                                        borderRadius: borderRadius.md,
                                        textDecoration: 'none',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    Back to Dashboard
                                </Link>
                            </div>
                        </DashboardCard>
                    )}

                    {quote.isAccepted && (
                        <DashboardCard title="Next Steps">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <p style={{ margin: 0, fontSize: '14px', color: colors.textSecondary, lineHeight: '1.6' }}>
                                    The client has accepted your quote! Check your orders to proceed with the work.
                                </p>
                                <Link
                                    href="/fixer/quotes"
                                    style={{
                                        display: 'block',
                                        padding: '12px 24px',
                                        textAlign: 'center',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        color: '#FFFFFF',
                                        backgroundColor: colors.success,
                                        borderRadius: borderRadius.md,
                                        textDecoration: 'none',
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    View Quotes
                                </Link>
                            </div>
                        </DashboardCard>
                    )}
                </div>
            </div>
        </DashboardLayoutWithHeader>
    );
}
