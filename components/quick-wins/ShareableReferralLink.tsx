'use client';

import { colors } from '@/lib/theme';

interface ShareableReferralLinkProps {
    referralLink: string;
}

export function ShareableReferralLink({ referralLink }: ShareableReferralLinkProps) {
    const handleCopyLink = () => {
        navigator.clipboard.writeText(referralLink);
        const btn = document.getElementById('copy-link-btn');
        if (btn) {
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => {
                btn.textContent = originalText;
            }, 2000);
        }
    };

    return (
        <div
            style={{
                backgroundColor: colors.bgSecondary,
                borderRadius: '12px',
                border: `1px solid ${colors.border}`,
                padding: '24px',
                marginBottom: '24px',
            }}
        >
            <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px', color: colors.textPrimary }}>
                Share Your Link
            </h2>
            <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '16px' }}>
                Share this link with friends. When they sign up, you'll both get rewarded!
            </p>

            <div
                style={{
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    padding: '12px',
                    backgroundColor: colors.bgPrimary,
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`,
                }}
            >
                <input
                    type="text"
                    readOnly
                    value={referralLink}
                    style={{
                        flex: 1,
                        border: 'none',
                        backgroundColor: 'transparent',
                        fontSize: '14px',
                        color: colors.textPrimary,
                        outline: 'none',
                    }}
                />
                <button
                    id="copy-link-btn"
                    onClick={handleCopyLink}
                    style={{
                        padding: '8px 16px',
                        backgroundColor: colors.primary,
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                    }}
                >
                    Copy Link
                </button>
            </div>
        </div>
    );
}
