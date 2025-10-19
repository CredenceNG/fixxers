import { Suspense } from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/lib/auth';
import BadgeReviewActions from '@/components/badges/BadgeReviewActions';
import AdminDashboardWrapper from '@/components/layouts/AdminDashboardWrapper';
import { colors, borderRadius, shadows } from '@/lib/theme';

// Badge Request Detail Page
type BadgeRequestStatus =
    | 'PENDING'
    | 'PAYMENT_RECEIVED'
    | 'UNDER_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'MORE_INFO_NEEDED';

const statusColors: Record<BadgeRequestStatus, { bg: string; text: string; border: string }> = {
    PENDING: { bg: colors.warningLight, text: colors.warningDark, border: colors.warning },
    PAYMENT_RECEIVED: { bg: colors.blueLight, text: colors.blue, border: colors.blue },
    UNDER_REVIEW: { bg: '#F3E8FF', text: '#7C3AED', border: '#A78BFA' },
    APPROVED: { bg: colors.successLight, text: colors.successDark, border: colors.success },
    REJECTED: { bg: colors.errorLight, text: colors.errorDark, border: colors.error },
    MORE_INFO_NEEDED: { bg: '#FED7AA', text: '#EA580C', border: '#FB923C' },
};

const statusIcons: Record<BadgeRequestStatus, string> = {
    PENDING: '⏳',
    PAYMENT_RECEIVED: '💳',
    UNDER_REVIEW: '🔍',
    APPROVED: '✅',
    REJECTED: '❌',
    MORE_INFO_NEEDED: '📝',
};

async function BadgeRequestReview({ requestId }: { requestId: string }) {
    const user = await getCurrentUser();

    if (!user || !user.roles.includes('ADMIN')) {
        redirect('/');
    }

    const prismaAny = prisma as any;

    const badgeRequest = await prismaAny.badgeRequest.findUnique({
        where: { id: requestId },
        include: {
            badge: true,
            fixer: {
                select: {
                    id: true,
                    name: true,
                    email: true,
                    profileImage: true,
                    createdAt: true,
                    _count: {
                        select: {
                            gigs: true,
                            fixerOrders: true,
                            reviewsReceived: true,
                        },
                    },
                },
            },
            assignment: true,
        },
    });

    if (!badgeRequest) {
        notFound();
    }

    // Parse documents from JSON
    const documents = badgeRequest.documents as Array<{
        url: string;
        name: string;
        type: string;
    }>;

    return (
        <>
            {/* Header Card */}
            <div style={{ backgroundColor: 'white', borderRadius: borderRadius.lg, boxShadow: shadows.md, marginBottom: '24px' }}>
                <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ fontSize: '48px', marginRight: '16px' }}>{badgeRequest.badge.icon}</span>
                            <div>
                                <h1 style={{ fontSize: '24px', fontWeight: '700', color: colors.textPrimary }}>
                                    {badgeRequest.badge.name}
                                </h1>
                                <p style={{ color: colors.textSecondary, marginTop: '4px' }}>
                                    Request #{badgeRequest.id.slice(0, 8)}
                                </p>
                            </div>
                        </div>
                        <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '6px 12px',
                            borderRadius: borderRadius.full,
                            fontSize: '14px',
                            fontWeight: '500',
                            backgroundColor: statusColors[badgeRequest.status as BadgeRequestStatus].bg,
                            color: statusColors[badgeRequest.status as BadgeRequestStatus].text,
                            border: `1px solid ${statusColors[badgeRequest.status as BadgeRequestStatus].border}`
                        }}>
                            <span style={{ marginRight: '4px' }}>{statusIcons[badgeRequest.status as BadgeRequestStatus]}</span>
                            {badgeRequest.status.replace(/_/g, ' ')}
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', paddingTop: '24px', borderTop: `1px solid ${colors.gray200}` }}>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: colors.textSecondary }}>Amount</p>
                            <p style={{ marginTop: '4px', fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>
                                ₦{badgeRequest.paymentAmount.toLocaleString()}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: colors.textSecondary }}>Payment Status</p>
                            <p style={{ marginTop: '4px', fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>
                                {badgeRequest.paymentStatus.replace(/_/g, ' ')}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: colors.textSecondary }}>Submitted</p>
                            <p style={{ marginTop: '4px', fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>
                                {new Date(badgeRequest.createdAt).toLocaleDateString()}
                            </p>
                        </div>
                        <div>
                            <p style={{ fontSize: '14px', fontWeight: '500', color: colors.textSecondary }}>Payment Date</p>
                            <p style={{ marginTop: '4px', fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>
                                {badgeRequest.paidAt
                                    ? new Date(badgeRequest.paidAt).toLocaleDateString()
                                    : 'Not paid'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Responsive grid layout */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', gap: '24px' }}>
                {/* Main Content - Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Fixer Information */}
                    <div style={{ backgroundColor: 'white', borderRadius: borderRadius.lg, boxShadow: shadows.md, padding: '24px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>Fixer Information</h2>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                            {badgeRequest.fixer.profileImage ? (
                                <img
                                    src={badgeRequest.fixer.profileImage}
                                    alt={badgeRequest.fixer.name || 'Fixer'}
                                    style={{ width: '80px', height: '80px', borderRadius: '50%', objectFit: 'cover' }}
                                />
                            ) : (
                                <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: colors.gray300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ color: colors.gray600, fontWeight: '500', fontSize: '24px' }}>
                                        {badgeRequest.fixer.name?.charAt(0) || 'F'}
                                    </span>
                                </div>
                            )}

                            <div style={{ flex: 1 }}>
                                <h3 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary }}>
                                    {badgeRequest.fixer.name || 'Unknown'}
                                </h3>
                                <p style={{ color: colors.textSecondary }}>{badgeRequest.fixer.email}</p>
                                <p style={{ fontSize: '14px', color: colors.textTertiary, marginTop: '4px' }}>
                                    Member since {new Date(badgeRequest.fixer.createdAt).toLocaleDateString()}
                                </p>

                                <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '24px', fontWeight: '700', color: colors.textPrimary }}>
                                            {badgeRequest.fixer._count.gigs}
                                        </p>
                                        <p style={{ fontSize: '12px', color: colors.textSecondary }}>Gigs</p>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '24px', fontWeight: '700', color: colors.textPrimary }}>
                                            {badgeRequest.fixer._count.fixerOrders}
                                        </p>
                                        <p style={{ fontSize: '12px', color: colors.textSecondary }}>Orders</p>
                                    </div>
                                    <div style={{ textAlign: 'center' }}>
                                        <p style={{ fontSize: '24px', fontWeight: '700', color: colors.textPrimary }}>
                                            {badgeRequest.fixer._count.reviewsReceived}
                                        </p>
                                        <p style={{ fontSize: '12px', color: colors.textSecondary }}>Reviews</p>
                                    </div>
                                </div>

                                <Link
                                    href={`/admin/users/${badgeRequest.fixer.id}`}
                                    style={{ display: 'inline-block', marginTop: '12px', color: colors.primary, fontSize: '14px', fontWeight: '500', textDecoration: 'none' }}
                                >
                                    View Full Profile →
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Documents Section */}
                    <div style={{ backgroundColor: 'white', borderRadius: borderRadius.lg, boxShadow: shadows.md, padding: '24px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
                            Submitted Documents
                        </h2>

                        {documents && documents.length > 0 ? (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                                {documents.map((doc, index) => (
                                    <div
                                        key={index}
                                        style={{ border: `1px solid ${colors.gray200}`, borderRadius: borderRadius.lg, padding: '16px' }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                                {doc.type.startsWith('image/') ? (
                                                    <img
                                                        src={doc.url}
                                                        alt={doc.name}
                                                        style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: borderRadius.md }}
                                                    />
                                                ) : (
                                                    <div style={{ width: '64px', height: '64px', backgroundColor: colors.errorLight, borderRadius: borderRadius.md, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                        <span style={{ fontSize: '30px' }}>📄</span>
                                                    </div>
                                                )}
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ fontSize: '14px', fontWeight: '500', color: colors.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {doc.name}
                                                    </p>
                                                    <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                                                        {doc.type}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <a
                                            href={doc.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ marginTop: '12px', display: 'block', width: '100%', textAlign: 'center', padding: '8px 16px', backgroundColor: colors.blueLight, color: colors.primary, borderRadius: borderRadius.md, fontSize: '14px', fontWeight: '500', textDecoration: 'none' }}
                                        >
                                            View Document →
                                        </a>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '32px 0', color: colors.textSecondary }}>
                                <span style={{ fontSize: '48px' }}>📭</span>
                                <p style={{ marginTop: '8px' }}>No documents submitted</p>
                            </div>
                        )}
                    </div>

                    {/* Fixer Notes */}
                    {badgeRequest.notes && (
                        <div style={{ backgroundColor: 'white', borderRadius: borderRadius.lg, boxShadow: shadows.md, padding: '24px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
                                Fixer Notes
                            </h2>
                            <div style={{ backgroundColor: colors.gray50, borderRadius: borderRadius.lg, padding: '16px' }}>
                                <p style={{ color: colors.textPrimary, whiteSpace: 'pre-wrap' }}>
                                    {badgeRequest.notes}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Admin Notes */}
                    {badgeRequest.adminNotes && (
                        <div style={{ backgroundColor: 'white', borderRadius: borderRadius.lg, boxShadow: shadows.md, padding: '24px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
                                Admin Notes
                            </h2>
                            <div style={{ backgroundColor: colors.warningLight, border: `1px solid ${colors.warning}`, borderRadius: borderRadius.lg, padding: '16px' }}>
                                <p style={{ color: colors.textPrimary, whiteSpace: 'pre-wrap' }}>
                                    {badgeRequest.adminNotes}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Rejection Reason */}
                    {badgeRequest.status === 'REJECTED' && badgeRequest.rejectionReason && (
                        <div style={{ backgroundColor: 'white', borderRadius: borderRadius.lg, boxShadow: shadows.md, padding: '24px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
                                Rejection Reason
                            </h2>
                            <div style={{ backgroundColor: colors.errorLight, border: `1px solid ${colors.error}`, borderRadius: borderRadius.lg, padding: '16px' }}>
                                <p style={{ color: colors.textPrimary, whiteSpace: 'pre-wrap' }}>
                                    {badgeRequest.rejectionReason}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Sidebar */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Badge Details */}
                    <div style={{ backgroundColor: 'white', borderRadius: borderRadius.lg, boxShadow: shadows.md, padding: '24px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
                            Badge Details
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div>
                                <p style={{ fontSize: '14px', fontWeight: '500', color: colors.textSecondary }}>Type</p>
                                <p style={{ color: colors.textPrimary }}>{badgeRequest.badge.type.replace(/_/g, ' ')}</p>
                            </div>

                            <div>
                                <p style={{ fontSize: '14px', fontWeight: '500', color: colors.textSecondary }}>Cost</p>
                                <p style={{ color: colors.textPrimary }}>₦{badgeRequest.badge.cost.toLocaleString()}</p>
                            </div>

                            <div>
                                <p style={{ fontSize: '14px', fontWeight: '500', color: colors.textSecondary }}>Valid For</p>
                                <p style={{ color: colors.textPrimary }}>
                                    {badgeRequest.badge.expiryMonths} months
                                </p>
                            </div>

                            <div>
                                <p style={{ fontSize: '14px', fontWeight: '500', color: colors.textSecondary }}>Required Documents</p>
                                <ul style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                    {(badgeRequest.badge.requiredDocuments as string[]).map((doc, index) => (
                                        <li key={index} style={{ fontSize: '14px', color: colors.textPrimary }}>
                                            • {doc.replace(/_/g, ' ')}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Verification Checklist */}
                    <div style={{ backgroundColor: 'white', borderRadius: borderRadius.lg, boxShadow: shadows.md, padding: '24px' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
                            Verification Checklist
                        </h2>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <ChecklistItem
                                label="Payment Confirmed"
                                checked={badgeRequest.paymentStatus === 'PAID'}
                            />
                            <ChecklistItem
                                label="All Documents Submitted"
                                checked={documents && documents.length > 0}
                            />
                            <ChecklistItem
                                label="Documents Readable"
                                checked={false}
                                note="Manual verification required"
                            />
                            <ChecklistItem
                                label="Information Matches"
                                checked={false}
                                note="Manual verification required"
                            />
                            <ChecklistItem
                                label="No Duplicates"
                                checked={false}
                                note="Manual verification required"
                            />
                        </div>
                    </div>

                    {/* Review Actions */}
                    <BadgeReviewActions badgeRequest={badgeRequest} />
                </div>
            </div>
        </>
    );
}

function ChecklistItem({
    label,
    checked,
    note
}: {
    label: string;
    checked: boolean;
    note?: string;
}) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
            <div style={{
                flexShrink: 0,
                width: '20px',
                height: '20px',
                borderRadius: borderRadius.sm,
                border: `2px solid ${checked ? colors.success : colors.gray300}`,
                backgroundColor: checked ? colors.success : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
            }}>
                {checked && (
                    <svg style={{ width: '12px', height: '12px', color: 'white' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                )}
            </div>
            <div style={{ marginLeft: '12px', flex: 1 }}>
                <p style={{ fontSize: '14px', fontWeight: '500', color: checked ? colors.textPrimary : colors.textSecondary }}>
                    {label}
                </p>
                {note && (
                    <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>{note}</p>
                )}
            </div>
        </div>
    );
}

export default async function AdminBadgeRequestDetailPage({
    params,
}: {
    params: Promise<{ requestId: string }>;
}) {
    const { requestId } = await params;

    const currentUser = await getCurrentUser();
    if (!currentUser || !currentUser.roles.includes('ADMIN')) {
        redirect('/');
    }

    // Fetch pending counts for AdminDashboardWrapper
    const prismaAny = prisma as any;

    const [pendingBadgeRequests, pendingAgentApplications, pendingReports] = await Promise.all([
        prismaAny.badgeRequest?.count({
            where: {
                status: {
                    in: ['PENDING', 'PAYMENT_RECEIVED', 'UNDER_REVIEW'],
                },
            },
        }) ?? 0,
        prismaAny.agent?.count({
            where: {
                status: 'PENDING',
            },
        }) ?? 0,
        prismaAny.reviewReport?.count({
            where: {
                status: {
                    in: ['PENDING', 'REVIEWING'],
                },
            },
        }) ?? 0,
    ]);

    return (
        <AdminDashboardWrapper
            userName={currentUser.name || undefined}
            userAvatar={currentUser.profileImage || undefined}
            pendingBadgeRequests={pendingBadgeRequests}
            pendingAgentApplications={pendingAgentApplications}
            pendingReports={pendingReports}
        >
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
                    Badge Request Review
                </h1>
                <p style={{ fontSize: '14px', color: colors.textSecondary }}>
                    Review and approve fixer badge verification
                </p>
            </div>

            {/* Back Button */}
            <Link
                href="/admin/badges/requests"
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    color: colors.primary,
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '24px',
                    textDecoration: 'none'
                }}
            >
                <svg style={{ width: '20px', height: '20px', marginRight: '4px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Back to Queue
            </Link>

            <Suspense fallback={<LoadingSkeleton />}>
                <BadgeRequestReview requestId={requestId} />
            </Suspense>
        </AdminDashboardWrapper>
    );
}

function LoadingSkeleton() {
    return (
        <>
            <div style={{ backgroundColor: 'white', borderRadius: borderRadius.lg, boxShadow: shadows.md, marginBottom: '24px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ width: '64px', height: '64px', backgroundColor: colors.gray200, borderRadius: borderRadius.md, marginRight: '16px' }}></div>
                            <div>
                                <div style={{ height: '32px', width: '256px', backgroundColor: colors.gray200, borderRadius: borderRadius.md, marginBottom: '8px' }}></div>
                                <div style={{ height: '16px', width: '128px', backgroundColor: colors.gray200, borderRadius: borderRadius.md }}></div>
                            </div>
                        </div>
                        <div style={{ height: '32px', width: '128px', backgroundColor: colors.gray200, borderRadius: borderRadius.md }}></div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
                <div style={{ backgroundColor: 'white', borderRadius: borderRadius.lg, boxShadow: shadows.md, height: '256px', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
                    <div style={{ height: '100%', backgroundColor: colors.gray200, borderRadius: borderRadius.md }}></div>
                </div>
            </div>
        </>
    );
}
