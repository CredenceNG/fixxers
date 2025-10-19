'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BadgeDocumentUpload } from '@/components/badges/BadgeDocumentUpload';
import { colors, borderRadius } from '@/lib/theme';
import { DashboardButton, DashboardCard } from '@/components/DashboardLayout';

// Define document type interface
interface DocumentType {
    id: string;
    name: string;
    description: string;
    icon: string;
}

// Define badge type
interface Badge {
    id: string;
    name: string;
    description: string;
    icon: string;
    cost: number;
    requiredDocuments: string[];
    expiryMonths: number | null;
}

export default function BadgeRequestClient({ badge }: { badge: Badge }) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [notes, setNotes] = useState('');
    const [documents, setDocuments] = useState<Record<string, { url: string; name: string; type: string }>>({});
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
    const [loadingDocTypes, setLoadingDocTypes] = useState(true);

    // Fetch document types on mount
    useEffect(() => {
        async function fetchDocumentTypes() {
            try {
                const res = await fetch('/api/document-types');
                const data = await res.json();
                setDocumentTypes(data.types || []);
            } catch (err) {
                console.error('Failed to load document types:', err);
            } finally {
                setLoadingDocTypes(false);
            }
        }
        fetchDocumentTypes();
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        // Validate all required documents are uploaded
        if (badge?.requiredDocuments) {
            console.log('Required:', badge.requiredDocuments);
            console.log('Uploaded:', Object.keys(documents));
            const missingDocs = badge.requiredDocuments.filter(
                (docType) => !documents[docType]
            );

            if (missingDocs.length > 0) {
                setError(`Please upload all required documents: ${missingDocs.map(getDocumentLabel).join(', ')}`);
                setSubmitting(false);
                return;
            }
        }

        try {
            // Convert documents object to array format for API
            const documentsArray = Object.entries(documents).map(([type, file]) => ({
                type,
                url: file.url,
                name: file.name,
            }));

            const requestBody = {
                badgeId: badge.id,
                documents: documentsArray,
                notes,
            };

            console.log('[BadgeRequestClient] Submitting request:', requestBody);

            const response = await fetch('/api/badge-requests', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
            });

            console.log('[BadgeRequestClient] Response status:', response.status);
            const data = await response.json();
            console.log('[BadgeRequestClient] Response data:', data);

            if (data.success) {
                // Redirect to payment page
                router.push(`/fixer/badges/payment/${data.request.id}`);
            } else {
                console.error('[BadgeRequestClient] Error from API:', data.error);
                setError(data.error || 'Failed to create request');
            }
        } catch (err) {
            console.error('[BadgeRequestClient] Exception during submission:', err);
            setError('Failed to submit request');
        } finally {
            setSubmitting(false);
        }
    }

    function handleDocumentUpload(docType: string, file: { url: string; name: string; type: string }) {
        console.log('[BadgeRequestClient] handleDocumentUpload', docType, file);
        setDocuments(prev => ({
            ...prev,
            [docType]: file,
        }));
    }

    function handleDocumentRemove(docType: string) {
        setDocuments(prev => {
            const newDocs = { ...prev };
            delete newDocs[docType];
            return newDocs;
        });
    }

    function formatPrice(kobo: number): string {
        const naira = kobo / 100;
        return `₦${naira.toLocaleString('en-NG')}`;
    }

    function getDocumentLabel(docType: string): string {
        // Use the document types from the centralized system
        const docTypeInfo = documentTypes.find(dt => dt.id === docType);
        return docTypeInfo ? `${docTypeInfo.icon} ${docTypeInfo.name}` : docType.replace(/_/g, ' ');
    }

    function getDocumentDescription(docType: string): string {
        const docTypeInfo = documentTypes.find(dt => dt.id === docType);
        return docTypeInfo ? docTypeInfo.description : '';
    }

    return (
        <>
            {/* Badge Info Card */}
            <DashboardCard style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '4rem', lineHeight: '1' }}>{badge.icon}</span>
                    <div style={{ flex: '1', minWidth: '250px' }}>
                        <h2 style={{
                            fontSize: '24px',
                            fontWeight: '600',
                            color: colors.textPrimary,
                            marginBottom: '8px'
                        }}>
                            {badge.name}
                        </h2>
                        <p style={{
                            fontSize: '15px',
                            color: colors.textSecondary,
                            lineHeight: '1.6',
                            marginBottom: '16px'
                        }}>
                            {badge.description}
                        </p>

                        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                            <div>
                                <span style={{
                                    fontSize: '13px',
                                    color: colors.textTertiary,
                                    display: 'block',
                                    marginBottom: '4px'
                                }}>
                                    Cost
                                </span>
                                <p style={{
                                    fontSize: '20px',
                                    fontWeight: '700',
                                    color: colors.primary
                                }}>
                                    {formatPrice(badge.cost)}
                                </p>
                            </div>
                            {badge.expiryMonths && (
                                <div>
                                    <span style={{
                                        fontSize: '13px',
                                        color: colors.textTertiary,
                                        display: 'block',
                                        marginBottom: '4px'
                                    }}>
                                        Validity
                                    </span>
                                    <p style={{
                                        fontSize: '20px',
                                        fontWeight: '700',
                                        color: colors.textPrimary
                                    }}>
                                        {badge.expiryMonths} months
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </DashboardCard>

            {/* Request Form */}
            <DashboardCard>
                <form onSubmit={handleSubmit}>
                    <h2 style={{
                        fontSize: '18px',
                        fontWeight: '600',
                        color: colors.textPrimary,
                        marginBottom: '20px'
                    }}>
                        Badge Request
                    </h2>

                    {error && (
                        <div style={{
                            backgroundColor: colors.errorLight,
                            borderLeft: `4px solid ${colors.error}`,
                            padding: '16px',
                            marginBottom: '24px',
                            borderRadius: borderRadius.md
                        }}>
                            <p style={{ fontSize: '14px', color: colors.errorDark }}>{error}</p>
                        </div>
                    )}

                    {/* Required Documents */}
                    <div style={{ marginBottom: '24px' }}>
                        <h3 style={{
                            fontSize: '15px',
                            fontWeight: '600',
                            color: colors.textPrimary,
                            marginBottom: '16px'
                        }}>
                            Required Documents
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {badge.requiredDocuments.map((docType) => (
                                <BadgeDocumentUpload
                                    key={docType}
                                    documentType={docType}
                                    label={getDocumentLabel(docType)}
                                    onUpload={(file) => handleDocumentUpload(docType, file)}
                                    currentFile={documents[docType] || null}
                                    onRemove={() => handleDocumentRemove(docType)}
                                />
                            ))}
                        </div>

                        <p style={{
                            marginTop: '12px',
                            fontSize: '14px',
                            color: colors.textSecondary,
                            lineHeight: '1.6'
                        }}>
                            💡 <strong>Tip:</strong> Make sure all documents are clear and readable. Blurry or
                            incomplete documents may result in rejection.
                        </p>
                    </div>

                    {/* Additional Notes */}
                    <div style={{ marginBottom: '24px' }}>
                        <label
                            htmlFor="notes"
                            style={{
                                display: 'block',
                                fontSize: '15px',
                                fontWeight: '600',
                                color: colors.textPrimary,
                                marginBottom: '8px'
                            }}
                        >
                            Additional Notes (Optional)
                        </label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={4}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderWidth: '1px',
                                borderStyle: 'solid',
                                borderColor: colors.border,
                                borderRadius: borderRadius.md,
                                fontSize: '14px',
                                color: colors.textPrimary,
                                fontFamily: 'inherit',
                                resize: 'vertical'
                            }}
                            placeholder="Add any additional information that might help with the review..."
                        />
                    </div>

                    {/* Important Information */}
                    <div style={{
                        backgroundColor: '#EBF5FF',
                        borderLeft: `4px solid ${colors.info}`,
                        padding: '16px',
                        marginBottom: '24px',
                        borderRadius: borderRadius.md
                    }}>
                        <h4 style={{
                            fontSize: '15px',
                            fontWeight: '600',
                            color: colors.info,
                            marginBottom: '12px'
                        }}>
                            Important Information
                        </h4>
                        <ul style={{
                            fontSize: '14px',
                            color: colors.info,
                            lineHeight: '1.8',
                            paddingLeft: '0',
                            listStyle: 'none'
                        }}>
                            <li>• Review time: 24-48 hours after payment</li>
                            <li>• You will be notified via email when your request is reviewed</li>
                            <li>• Payment is required before admin review begins</li>
                            <li>• Refunds are processed if request is rejected</li>
                            {badge.expiryMonths && (
                                <li>• Badge expires after {badge.expiryMonths} months and must be renewed</li>
                            )}
                        </ul>
                    </div>

                    {/* Action Buttons */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '16px',
                        flexWrap: 'wrap'
                    }}>
                        <DashboardButton variant="outline" href="/fixer/badges">
                            Cancel
                        </DashboardButton>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="badge-submit-button"
                            style={{
                                backgroundColor: submitting ? colors.gray400 : colors.primary,
                                color: colors.white,
                                padding: '12px 32px',
                                fontSize: '15px',
                                fontWeight: '600',
                                borderRadius: borderRadius.lg,
                                border: 'none',
                                cursor: submitting ? 'not-allowed' : 'pointer',
                                opacity: submitting ? 0.5 : 1,
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {submitting ? 'Submitting...' : `Submit & Pay ${formatPrice(badge.cost)}`}
                        </button>
                    </div>
                </form>
            </DashboardCard>

            {/* Help Section */}
            <DashboardCard style={{ marginTop: '24px' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '12px'
                }}>
                    <span style={{ fontSize: '24px' }}>💡</span>
                    <div>
                        <h3 style={{
                            fontSize: '16px',
                            fontWeight: '600',
                            color: colors.textPrimary,
                            marginBottom: '8px'
                        }}>
                            Need Help?
                        </h3>
                        <p style={{
                            fontSize: '14px',
                            color: colors.textSecondary,
                            lineHeight: '1.6'
                        }}>
                            If you have questions about the verification process or required documents,{' '}
                            <a
                                href="/support"
                                style={{
                                    color: colors.primary,
                                    fontWeight: '600',
                                    textDecoration: 'none'
                                }}
                                className="hover:opacity-80"
                            >
                                contact our support team
                            </a>
                            .
                        </p>
                    </div>
                </div>
            </DashboardCard>
        </>
    );
}