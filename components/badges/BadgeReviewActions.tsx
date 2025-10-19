'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface BadgeRequest {
    id: string;
    status: string;
    paymentStatus: string;
}

export default function BadgeReviewActions({
    badgeRequest
}: {
    badgeRequest: BadgeRequest;
}) {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

    const canApprove = badgeRequest.status === 'PAYMENT_RECEIVED' ||
        badgeRequest.status === 'UNDER_REVIEW' ||
        badgeRequest.status === 'MORE_INFO_NEEDED';

    const canReject = badgeRequest.status === 'PAYMENT_RECEIVED' ||
        badgeRequest.status === 'UNDER_REVIEW' ||
        badgeRequest.status === 'MORE_INFO_NEEDED';

    const canRequestInfo = badgeRequest.status === 'PAYMENT_RECEIVED' ||
        badgeRequest.status === 'UNDER_REVIEW';

    const handleApprove = async () => {
        if (!confirm('✅ Approve this badge request?\n\nThe fixer will receive their badge and be notified via email.')) {
            return;
        }

        setIsProcessing(true);

        try {
            const response = await fetch(`/api/admin/badge-requests/${badgeRequest.id}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ adminNotes: '' }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to approve request');
            }

            alert('✅ Badge request approved successfully!');
            router.push('/admin/badges/requests?filter=approved&success=approved');
            router.refresh();
        } catch (err) {
            alert('❌ Error: ' + (err instanceof Error ? err.message : 'An error occurred'));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        const reason = prompt('❌ Why are you rejecting this badge request?\n\nThe fixer will see this reason:');

        if (!reason || !reason.trim()) {
            if (reason !== null) { // User clicked OK with empty input
                alert('⚠️ Rejection reason is required');
            }
            return;
        }

        if (!confirm(`Reject this badge request?\n\nReason: "${reason}"\n\nThe fixer will be notified via email.`)) {
            return;
        }

        setIsProcessing(true);

        try {
            const response = await fetch(`/api/admin/badge-requests/${badgeRequest.id}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ rejectionReason: reason }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to reject request');
            }

            alert('✅ Badge request rejected successfully');
            router.push('/admin/badges/requests?filter=rejected&success=rejected');
            router.refresh();
        } catch (err) {
            alert('❌ Error: ' + (err instanceof Error ? err.message : 'An error occurred'));
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRequestMoreInfo = async () => {
        const info = prompt('📝 What additional information do you need from the fixer?\n\nYour message:');

        if (!info || !info.trim()) {
            if (info !== null) { // User clicked OK with empty input
                alert('⚠️ Please specify what information is needed');
            }
            return;
        }

        if (!confirm(`Request more information?\n\nMessage: "${info}"\n\nThe fixer will be notified via email.`)) {
            return;
        }

        setIsProcessing(true);

        try {
            const response = await fetch(`/api/admin/badge-requests/${badgeRequest.id}/request-info`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ adminNotes: info }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to request more information');
            }

            alert('✅ Information request sent successfully');
            router.push('/admin/badges/requests?filter=more-info&success=info-requested');
            router.refresh();
        } catch (err) {
            alert('❌ Error: ' + (err instanceof Error ? err.message : 'An error occurred'));
        } finally {
            setIsProcessing(false);
        }
    };

    if (badgeRequest.status === 'APPROVED') {
        return (
            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="text-center py-4">
                    <span className="text-3xl">✅</span>
                    <p className="mt-3 text-lg font-semibold text-gray-900">
                        Request Approved
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                        Badge has been assigned to the fixer
                    </p>
                </div>
            </div>
        );
    }

    if (badgeRequest.status === 'REJECTED') {
        return (
            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="text-center py-4">
                    <span className="text-3xl">❌</span>
                    <p className="mt-3 text-lg font-semibold text-gray-900">
                        Request Rejected
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                        This request has been declined
                    </p>
                </div>
            </div>
        );
    }

    if (badgeRequest.paymentStatus !== 'PAID') {
        return (
            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-sm text-yellow-800">
                        ⏳ Awaiting payment confirmation before review
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white shadow-md rounded-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Review Actions
            </h2>

            <div className="space-y-3">
                {canApprove && (
                    <button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        style={{
                            width: '100%',
                            padding: '14px 20px',
                            backgroundColor: isProcessing ? '#e5e7eb' : '#374151',
                            color: isProcessing ? '#6b7280' : 'white',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '15px',
                            border: 'none',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'all 0.2s',
                            boxShadow: isProcessing ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.05)',
                        }}
                        onMouseEnter={(e) => {
                            if (!isProcessing) {
                                e.currentTarget.style.backgroundColor = '#1f2937';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isProcessing) {
                                e.currentTarget.style.backgroundColor = '#374151';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                            }
                        }}
                    >
                        <svg style={{ width: '20px', height: '20px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{isProcessing ? 'Approving Badge...' : 'Approve Badge'}</span>
                    </button>
                )}

                {canRequestInfo && (
                    <button
                        onClick={handleRequestMoreInfo}
                        disabled={isProcessing}
                        style={{
                            width: '100%',
                            padding: '14px 20px',
                            backgroundColor: isProcessing ? '#e5e7eb' : '#6b7280',
                            color: isProcessing ? '#6b7280' : 'white',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '15px',
                            border: 'none',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'all 0.2s',
                            boxShadow: isProcessing ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.05)',
                        }}
                        onMouseEnter={(e) => {
                            if (!isProcessing) {
                                e.currentTarget.style.backgroundColor = '#4b5563';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isProcessing) {
                                e.currentTarget.style.backgroundColor = '#6b7280';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                            }
                        }}
                    >
                        <svg style={{ width: '20px', height: '20px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{isProcessing ? 'Sending Request...' : 'Request More Info'}</span>
                    </button>
                )}

                {canReject && (
                    <button
                        onClick={handleReject}
                        disabled={isProcessing}
                        style={{
                            width: '100%',
                            padding: '14px 20px',
                            backgroundColor: isProcessing ? '#e5e7eb' : '#9ca3af',
                            color: isProcessing ? '#6b7280' : 'white',
                            borderRadius: '8px',
                            fontWeight: '600',
                            fontSize: '15px',
                            border: 'none',
                            cursor: isProcessing ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'all 0.2s',
                            boxShadow: isProcessing ? 'none' : '0 1px 2px rgba(0, 0, 0, 0.05)',
                        }}
                        onMouseEnter={(e) => {
                            if (!isProcessing) {
                                e.currentTarget.style.backgroundColor = '#6b7280';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
                            }
                        }}
                        onMouseLeave={(e) => {
                            if (!isProcessing) {
                                e.currentTarget.style.backgroundColor = '#9ca3af';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.05)';
                            }
                        }}
                    >
                        <svg style={{ width: '20px', height: '20px', flexShrink: 0 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{isProcessing ? 'Rejecting Request...' : 'Reject Request'}</span>
                    </button>
                )}
            </div>

            <div className="mt-5 pt-4 border-t border-gray-200">
                <div style={{
                    backgroundColor: '#eff6ff',
                    borderRadius: '6px',
                    padding: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                }}>
                    <svg style={{ width: '16px', height: '16px', color: '#3b82f6', flexShrink: 0 }} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <p className="text-xs text-blue-700" style={{ margin: 0, lineHeight: '1.4' }}>
                        All actions automatically send email notifications to the fixer
                    </p>
                </div>
            </div>
        </div>
    );
}
