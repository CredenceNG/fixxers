'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { colors, borderRadius, spacing } from '@/lib/theme';

export function VerificationMessage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [isResending, setIsResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [show, setShow] = useState(false);

  const message = searchParams.get('message');
  const email = searchParams.get('email');

  useEffect(() => {
    if (message === 'expired' && email) {
      setShow(true);
    }
  }, [message, email]);

  const handleResend = async () => {
    if (!email) return;

    setIsResending(true);
    setResendStatus('idle');
    setErrorMessage('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email');
      }

      setResendStatus('success');
    } catch (err: any) {
      setResendStatus('error');
      setErrorMessage(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleClose = () => {
    setShow(false);
    // Remove query params from URL
    const newUrl = window.location.pathname;
    router.replace(newUrl);
  };

  if (!show) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: spacing.lg,
      }}
      onClick={handleClose}
    >
      <div
        style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          maxWidth: '500px',
          width: '100%',
          padding: spacing.xl,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: colors.warningLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            marginBottom: spacing.lg,
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke={colors.warning}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: colors.textPrimary,
            textAlign: 'center',
            marginBottom: spacing.md,
          }}
        >
          Verification Link Expired
        </h2>

        {/* Message */}
        <p
          style={{
            fontSize: '15px',
            lineHeight: '1.6',
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: spacing.xl,
          }}
        >
          Your verification link has expired for security reasons. Please request a new verification email to continue.
        </p>

        {/* Email Display */}
        <div
          style={{
            backgroundColor: colors.bgSecondary,
            padding: spacing.md,
            borderRadius: borderRadius.md,
            marginBottom: spacing.lg,
          }}
        >
          <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
            Sending to:
          </p>
          <p style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
            {email}
          </p>
        </div>

        {/* Status Messages */}
        {resendStatus === 'success' && (
          <div
            style={{
              backgroundColor: colors.successLight,
              border: `1px solid ${colors.success}`,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              marginBottom: spacing.lg,
            }}
          >
            <p style={{ fontSize: '14px', color: colors.success, margin: 0 }}>
              ✓ Verification email sent! Please check your inbox.
            </p>
          </div>
        )}

        {resendStatus === 'error' && (
          <div
            style={{
              backgroundColor: colors.errorLight,
              border: `1px solid ${colors.error}`,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              marginBottom: spacing.lg,
            }}
          >
            <p style={{ fontSize: '14px', color: colors.error, margin: 0 }}>
              {errorMessage}
            </p>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: spacing.md, flexDirection: 'column' }}>
          <button
            onClick={handleResend}
            disabled={isResending || resendStatus === 'success'}
            style={{
              padding: `${spacing.md} ${spacing.lg}`,
              backgroundColor:
                isResending || resendStatus === 'success' ? colors.textSecondary : colors.primary,
              color: colors.white,
              fontSize: '16px',
              fontWeight: '600',
              border: 'none',
              borderRadius: borderRadius.md,
              cursor: isResending || resendStatus === 'success' ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              opacity: isResending || resendStatus === 'success' ? 0.6 : 1,
            }}
          >
            {isResending
              ? 'Sending...'
              : resendStatus === 'success'
              ? 'Email Sent ✓'
              : 'Resend Verification Email'}
          </button>

          <button
            onClick={handleClose}
            style={{
              padding: `${spacing.md} ${spacing.lg}`,
              backgroundColor: 'transparent',
              color: colors.textSecondary,
              fontSize: '14px',
              fontWeight: '600',
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            Close
          </button>
        </div>

        {/* Helper Text */}
        {resendStatus !== 'success' && (
          <p
            style={{
              fontSize: '13px',
              color: colors.textSecondary,
              textAlign: 'center',
              marginTop: spacing.md,
              lineHeight: '1.5',
            }}
          >
            Didn't receive the email? Check your spam folder or try again in a few minutes.
          </p>
        )}
      </div>
    </div>
  );
}
