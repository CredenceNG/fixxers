/**
 * Badge Request Detail Page
 * /fixer/badges/requests/[requestId]
 * 
 * View detailed status of a badge request
 */

import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { formatBadgePrice } from '@/lib/badges/badge-utils';
import { DeleteBadgeRequestButton } from '@/components/badges/DeleteBadgeRequestButton';
import { BadgePaymentButton } from '@/components/badges/BadgePaymentButton';

const prismaAny = prisma as any;

export default async function BadgeRequestDetailPage({ params }: { params: Promise<{ requestId: string }> }) {
    const user = await getCurrentUser();

    if (!user) {
        redirect('/auth/login');
    }

    const { requestId } = await params;

    // Get the badge request
    const badgeRequest = await prismaAny.badgeRequest.findUnique({
        where: { id: requestId },
        include: {
            badge: true,
            reviewer: {
                select: {
                    name: true,
                },
            },
        },
    });

    if (!badgeRequest) {
        redirect('/fixer/badges');
    }

    // Verify ownership
    if (badgeRequest.fixerId !== user.id) {
        redirect('/fixer/badges');
    }

    // Parse documents from JSON
    const documents = badgeRequest.documents as any[] || [];

    type BadgeRequestStatus = 'PENDING' | 'PAYMENT_RECEIVED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXPIRED';

    const statusColors: Record<BadgeRequestStatus, string> = {
        PENDING: 'bg-yellow-100 text-yellow-800',
        PAYMENT_RECEIVED: 'bg-blue-100 text-blue-800',
        UNDER_REVIEW: 'bg-purple-100 text-purple-800',
        APPROVED: 'bg-green-100 text-green-800',
        REJECTED: 'bg-red-100 text-red-800',
        EXPIRED: 'bg-gray-100 text-gray-800',
    };

    const statusIcons: Record<BadgeRequestStatus, string> = {
        PENDING: '⏳',
        PAYMENT_RECEIVED: '💳',
        UNDER_REVIEW: '🔍',
        APPROVED: '✅',
        REJECTED: '❌',
        EXPIRED: '⏰',
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Back Link */}
                <Link
                    href="/fixer/badges"
                    className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6"
                >
                    ← Back to Badges
                </Link>

                {/* Header Card */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <div className="flex items-start gap-4">
                        <span style={{ fontSize: '3rem' }}>{badgeRequest.badge.icon}</span>
                        <div className="flex-1">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{badgeRequest.badge.name}</h1>
                                    <p className="mt-1 text-gray-600">Request submitted on {new Date(badgeRequest.createdAt).toLocaleDateString()}</p>
                                </div>
                                <span className={`px-3 py-1 inline-flex items-center text-sm font-semibold rounded-full ${statusColors[badgeRequest.status as BadgeRequestStatus]}`}>
                                    {statusIcons[badgeRequest.status as BadgeRequestStatus]} {badgeRequest.status.replace('_', ' ')}
                                </span>
                            </div>

                            <div className="mt-4 flex items-center gap-6">
                                <div>
                                    <span className="text-sm text-gray-500">Amount</span>
                                    <p className="text-xl font-bold text-gray-900">{formatBadgePrice(badgeRequest.paymentAmount)}</p>
                                </div>
                                <div>
                                    <span className="text-sm text-gray-500">Payment Status</span>
                                    <p className="text-xl font-bold text-gray-900">
                                        {badgeRequest.paymentStatus === 'PAID' ? '✅ Paid' : '⏳ Pending'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Status Timeline */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Request Timeline</h2>

                    <div className="space-y-4">
                        {/* Submitted */}
                        <div className="flex gap-3">
                            <div className="flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="text-green-600 font-semibold">✓</span>
                                </div>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">Request Submitted</p>
                                <p className="text-sm text-gray-600">{new Date(badgeRequest.createdAt).toLocaleString()}</p>
                            </div>
                        </div>

                        {/* Payment */}
                        {badgeRequest.paidAt && (
                            <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                        <span className="text-green-600 font-semibold">✓</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">Payment Received</p>
                                    <p className="text-sm text-gray-600">{new Date(badgeRequest.paidAt).toLocaleString()}</p>
                                </div>
                            </div>
                        )}

                        {/* Review */}
                        {badgeRequest.reviewedAt && (
                            <div className="flex gap-3">
                                <div className="flex-shrink-0">
                                    <div className={`h-8 w-8 rounded-full flex items-center justify-center ${badgeRequest.status === 'APPROVED' ? 'bg-green-100' : 'bg-red-100'
                                        }`}>
                                        <span className={`font-semibold ${badgeRequest.status === 'APPROVED' ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {badgeRequest.status === 'APPROVED' ? '✓' : '✕'}
                                        </span>
                                    </div>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {badgeRequest.status === 'APPROVED' ? 'Approved' : 'Reviewed'}
                                    </p>
                                    <p className="text-sm text-gray-600">{new Date(badgeRequest.reviewedAt).toLocaleString()}</p>
                                    {badgeRequest.reviewer && (
                                        <p className="text-sm text-gray-600">By {badgeRequest.reviewer.name}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Documents */}
                {documents.length > 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Submitted Documents</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {documents.map((doc: any, index: number) => (
                                <div key={index} className="border border-gray-200 rounded-lg p-3">
                                    <p className="font-medium text-gray-900 mb-2">{doc.type.replace('_', ' ')}</p>
                                    <a
                                        href={doc.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                                    >
                                        📎 {doc.name}
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {badgeRequest.notes && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Notes</h2>
                        <p className="text-gray-700">{badgeRequest.notes}</p>
                    </div>
                )}

                {/* Admin Response */}
                {(badgeRequest.adminNotes || badgeRequest.rejectionReason) && (
                    <div className={`rounded-lg border p-6 mb-6 ${badgeRequest.status === 'APPROVED' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}>
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Admin Response</h2>
                        {badgeRequest.rejectionReason && (
                            <div className="mb-3">
                                <p className="text-sm font-medium text-gray-700 mb-1">Rejection Reason:</p>
                                <p className="text-gray-900">{badgeRequest.rejectionReason}</p>
                            </div>
                        )}
                        {badgeRequest.adminNotes && (
                            <div>
                                <p className="text-sm font-medium text-gray-700 mb-1">Notes:</p>
                                <p className="text-gray-900">{badgeRequest.adminNotes}</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                {badgeRequest.status === 'PENDING' && badgeRequest.paymentStatus === 'PENDING' && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h2>
                        <p className="text-gray-600 mb-4">Complete payment to submit your request for review.</p>
                        <div className="flex gap-3">
                            <BadgePaymentButton
                                requestId={badgeRequest.id}
                                amount={badgeRequest.paymentAmount}
                                badgeName={badgeRequest.badge.name}
                                badgeIcon={badgeRequest.badge.icon}
                            />
                            <DeleteBadgeRequestButton requestId={badgeRequest.id} />
                        </div>
                    </div>
                )}

                {badgeRequest.status === 'PAYMENT_RECEIVED' && (
                    <div className="bg-blue-50 rounded-lg border border-blue-200 p-6">
                        <h2 className="text-lg font-semibold text-blue-900 mb-2">Under Review</h2>
                        <p className="text-blue-700">
                            Your request is being reviewed by our team. This typically takes 24-48 hours. You'll receive an email notification once the review is complete.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
