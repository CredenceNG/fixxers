'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardButton } from '@/components/DashboardLayout';
import { colors, borderRadius } from '@/lib/theme';

interface DocumentType {
    id: string;
    name: string;
    description: string;
    icon: string;
}

interface BadgeEditFormProps {
    badge: {
        id: string;
        type: string;
        name: string;
        description: string;
        icon: string;
        cost: number;
        isActive: boolean;
        requiredDocuments: string[];
        expiryMonths: number | null;
        isAutomatic: boolean;
        minJobsRequired: number | null;
        minAverageRating: number | null;
        maxCancellationRate: number | null;
        maxComplaintRate: number | null;
        maxResponseMinutes: number | null;
    };
}

export default function BadgeEditForm({ badge }: BadgeEditFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    // Document types
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
    const [loadingDocTypes, setLoadingDocTypes] = useState(true);

    // Form state
    const [name, setName] = useState(badge.name);
    const [description, setDescription] = useState(badge.description);
    const [icon, setIcon] = useState(badge.icon);
    const [cost, setCost] = useState(badge.cost / 100); // Convert from kobo to Naira
    const [isActive, setIsActive] = useState(badge.isActive);
    const [expiryMonths, setExpiryMonths] = useState(badge.expiryMonths?.toString() || '');
    const [selectedDocuments, setSelectedDocuments] = useState<string[]>(badge.requiredDocuments);

    // Automatic badge criteria
    const [minJobsRequired, setMinJobsRequired] = useState(badge.minJobsRequired?.toString() || '');
    const [minAverageRating, setMinAverageRating] = useState(badge.minAverageRating?.toString() || '');
    const [maxCancellationRate, setMaxCancellationRate] = useState(badge.maxCancellationRate ? (badge.maxCancellationRate * 100).toString() : '');
    const [maxComplaintRate, setMaxComplaintRate] = useState(badge.maxComplaintRate ? (badge.maxComplaintRate * 100).toString() : '');
    const [maxResponseMinutes, setMaxResponseMinutes] = useState(badge.maxResponseMinutes?.toString() || '');

    // Fetch document types
    useEffect(() => {
        const fetchDocumentTypes = async () => {
            try {
                const res = await fetch('/api/admin/document-types');
                const data = await res.json();
                setDocumentTypes(data.types || []);
            } catch (err) {
                console.error('Failed to load document types:', err);
            } finally {
                setLoadingDocTypes(false);
            }
        };

        fetchDocumentTypes();
    }, []);

    // Toggle document selection
    const toggleDocument = (docId: string) => {
        setSelectedDocuments(prev =>
            prev.includes(docId)
                ? prev.filter(id => id !== docId)
                : [...prev, docId]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`/api/admin/badges/${badge.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name,
                    description,
                    icon,
                    cost: Math.round(cost * 100), // Convert to kobo
                    isActive,
                    expiryMonths: expiryMonths ? parseInt(expiryMonths) : null,
                    requiredDocuments: selectedDocuments,
                    // Automatic badge criteria
                    minJobsRequired: minJobsRequired ? parseInt(minJobsRequired) : null,
                    minAverageRating: minAverageRating ? parseFloat(minAverageRating) : null,
                    maxCancellationRate: maxCancellationRate ? parseFloat(maxCancellationRate) / 100 : null,
                    maxComplaintRate: maxComplaintRate ? parseFloat(maxComplaintRate) / 100 : null,
                    maxResponseMinutes: maxResponseMinutes ? parseInt(maxResponseMinutes) : null,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setSuccess('Badge updated successfully!');
                setTimeout(() => {
                    router.push('/admin/badges');
                    router.refresh();
                }, 1500);
            } else {
                setError(data.error || 'Failed to update badge');
            }
        } catch (err) {
            console.error('Error updating badge:', err);
            setError('Failed to update badge. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '12px',
        border: `1px solid ${colors.gray300}`,
        borderRadius: borderRadius.md,
        fontSize: '14px',
        fontFamily: 'inherit',
    };

    const labelStyle = {
        display: 'block',
        fontSize: '14px',
        fontWeight: '600' as const,
        color: colors.textPrimary,
        marginBottom: '8px',
    };

    return (
        <form onSubmit={handleSubmit}>
            {error && (
                <div style={{
                    padding: '12px 16px',
                    backgroundColor: colors.errorLight,
                    color: colors.errorDark,
                    borderRadius: borderRadius.md,
                    marginBottom: '24px',
                    fontSize: '14px',
                }}>
                    ❌ {error}
                </div>
            )}

            {success && (
                <div style={{
                    padding: '12px 16px',
                    backgroundColor: colors.successLight,
                    color: colors.successDark,
                    borderRadius: borderRadius.md,
                    marginBottom: '24px',
                    fontSize: '14px',
                }}>
                    ✓ {success}
                </div>
            )}

            {/* Basic Information */}
            <div style={{ marginBottom: '32px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
                    Basic Information
                </h3>

                <div style={{ display: 'grid', gap: '16px' }}>
                    <div>
                        <label style={labelStyle}>Badge Name</label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                            style={inputStyle}
                            placeholder="e.g., Identity Verified"
                        />
                    </div>

                    <div>
                        <label style={labelStyle}>Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            required
                            rows={3}
                            style={{ ...inputStyle, resize: 'vertical' as const }}
                            placeholder="Describe what this badge represents..."
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Icon (Emoji)</label>
                            <input
                                type="text"
                                value={icon}
                                onChange={(e) => setIcon(e.target.value)}
                                required
                                style={inputStyle}
                                placeholder="🆔"
                            />
                        </div>

                        <div>
                            <label style={labelStyle}>Cost (₦)</label>
                            <input
                                type="number"
                                value={cost}
                                onChange={(e) => setCost(parseFloat(e.target.value) || 0)}
                                required
                                min="0"
                                step="0.01"
                                style={inputStyle}
                                placeholder="2000"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Expiry (Months)</label>
                            <input
                                type="number"
                                value={expiryMonths}
                                onChange={(e) => setExpiryMonths(e.target.value)}
                                min="1"
                                style={inputStyle}
                                placeholder="12 (leave empty for no expiry)"
                            />
                            <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '4px' }}>
                                Leave empty for badges that don't expire
                            </p>
                        </div>

                        <div>
                            <label style={labelStyle}>Status</label>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '12px',
                                border: `1px solid ${colors.gray300}`,
                                borderRadius: borderRadius.md,
                                cursor: 'pointer',
                            }}>
                                <input
                                    type="checkbox"
                                    checked={isActive}
                                    onChange={(e) => setIsActive(e.target.checked)}
                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                />
                                <span style={{ fontSize: '14px', color: colors.textPrimary }}>
                                    Badge is active and available
                                </span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Required Documents */}
            {!badge.isAutomatic && (
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
                        Required Documents
                    </h3>
                    
                    {loadingDocTypes ? (
                        <p style={{ fontSize: '14px', color: colors.textSecondary }}>Loading document types...</p>
                    ) : documentTypes.length === 0 ? (
                        <div style={{
                            padding: '16px',
                            backgroundColor: colors.warningLight,
                            border: `1px solid ${colors.warning}`,
                            borderRadius: borderRadius.md,
                        }}>
                            <p style={{ fontSize: '14px', color: colors.textPrimary, marginBottom: '8px' }}>
                                No document types found. Please add document types first.
                            </p>
                            <a
                                href="/admin/document-types"
                                target="_blank"
                                style={{
                                    color: colors.primary,
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    textDecoration: 'none',
                                }}
                            >
                                Manage Document Types →
                            </a>
                        </div>
                    ) : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                            gap: '12px',
                        }}>
                            {documentTypes.map(docType => (
                                <label
                                    key={docType.id}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'flex-start',
                                        gap: '12px',
                                        padding: '12px',
                                        border: `2px solid ${selectedDocuments.includes(docType.id) ? colors.primary : colors.border}`,
                                        borderRadius: borderRadius.md,
                                        cursor: 'pointer',
                                        backgroundColor: selectedDocuments.includes(docType.id) ? colors.primaryLight : colors.white,
                                        transition: 'all 0.2s',
                                    }}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedDocuments.includes(docType.id)}
                                        onChange={() => toggleDocument(docType.id)}
                                        style={{ marginTop: '2px', cursor: 'pointer' }}
                                    />
                                    <div style={{ flex: 1 }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            marginBottom: '4px',
                                        }}>
                                            <span style={{ fontSize: '20px' }}>{docType.icon}</span>
                                            <span style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary }}>
                                                {docType.name}
                                            </span>
                                        </div>
                                        {docType.description && (
                                            <p style={{ fontSize: '12px', color: colors.textSecondary, margin: 0 }}>
                                                {docType.description}
                                            </p>
                                        )}
                                    </div>
                                </label>
                            ))}
                        </div>
                    )}

                    <p style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '12px' }}>
                        Selected: {selectedDocuments.length} document type(s)
                    </p>
                </div>
            )}

            {/* Performance Criteria */}
            {badge.isAutomatic && (
                <div style={{ marginBottom: '32px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
                        Automatic Badge Criteria
                    </h3>
                    <div style={{ display: 'grid', gap: '16px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>Minimum Jobs Required</label>
                                <input
                                    type="number"
                                    value={minJobsRequired}
                                    onChange={(e) => setMinJobsRequired(e.target.value)}
                                    min="0"
                                    style={inputStyle}
                                    placeholder="20"
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Minimum Average Rating</label>
                                <input
                                    type="number"
                                    value={minAverageRating}
                                    onChange={(e) => setMinAverageRating(e.target.value)}
                                    min="0"
                                    max="5"
                                    step="0.1"
                                    style={inputStyle}
                                    placeholder="4.5"
                                />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label style={labelStyle}>Max Cancellation Rate (%)</label>
                                <input
                                    type="number"
                                    value={maxCancellationRate}
                                    onChange={(e) => setMaxCancellationRate(e.target.value)}
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    style={inputStyle}
                                    placeholder="5"
                                />
                            </div>

                            <div>
                                <label style={labelStyle}>Max Complaint Rate (%)</label>
                                <input
                                    type="number"
                                    value={maxComplaintRate}
                                    onChange={(e) => setMaxComplaintRate(e.target.value)}
                                    min="0"
                                    max="100"
                                    step="0.1"
                                    style={inputStyle}
                                    placeholder="2"
                                />
                            </div>
                        </div>

                        <div>
                            <label style={labelStyle}>Max Response Time (Minutes)</label>
                            <input
                                type="number"
                                value={maxResponseMinutes}
                                onChange={(e) => setMaxResponseMinutes(e.target.value)}
                                min="0"
                                style={inputStyle}
                                placeholder="120"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div style={{
                display: 'flex',
                gap: '12px',
                paddingTop: '24px',
                borderTop: `1px solid ${colors.gray200}`
            }}>
                <DashboardButton
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/admin/badges')}
                    disabled={isSubmitting}
                >
                    Cancel
                </DashboardButton>
                <DashboardButton
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                </DashboardButton>
            </div>
        </form>
    );
}
