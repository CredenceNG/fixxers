'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { colors, borderRadius } from '@/lib/theme';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.bgSecondary,
        padding: '20px',
      }}
    >
      <div
        style={{
          maxWidth: '600px',
          width: '100%',
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }}
      >
        {/* Error Icon */}
        <div
          style={{
            fontSize: '64px',
            marginBottom: '24px',
          }}
        >
          ⚠️
        </div>

        {/* Error Title */}
        <h1
          style={{
            fontSize: '32px',
            fontWeight: '700',
            color: colors.textPrimary,
            marginBottom: '16px',
          }}
        >
          Something went wrong!
        </h1>

        {/* Error Description */}
        <p
          style={{
            fontSize: '16px',
            color: colors.textSecondary,
            marginBottom: '32px',
            lineHeight: '1.6',
          }}
        >
          We're sorry, but something unexpected happened. Our team has been notified and we're
          working to fix the issue.
        </p>

        {/* Error Details (for development) */}
        {process.env.NODE_ENV === 'development' && (
          <div
            style={{
              backgroundColor: '#FEF5E7',
              border: `1px solid #F39C12`,
              borderRadius: borderRadius.md,
              padding: '16px',
              marginBottom: '24px',
              textAlign: 'left',
            }}
          >
            <div
              style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#D68910',
                marginBottom: '8px',
              }}
            >
              Error Details (Development Only):
            </div>
            <pre
              style={{
                fontSize: '11px',
                color: '#95620D',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0,
              }}
            >
              {error.message}
            </pre>
            {error.digest && (
              <div style={{ fontSize: '11px', color: '#95620D', marginTop: '8px' }}>
                Error ID: {error.digest}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <button
            onClick={() => reset()}
            style={{
              padding: '12px 32px',
              backgroundColor: colors.primary,
              color: colors.white,
              border: 'none',
              borderRadius: borderRadius.md,
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.opacity = '0.9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
          >
            Try again
          </button>

          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              backgroundColor: colors.white,
              color: colors.primary,
              border: `1px solid ${colors.primary}`,
              borderRadius: borderRadius.md,
              fontSize: '16px',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'background-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = colors.bgSecondary;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = colors.white;
            }}
          >
            Go home
          </Link>
        </div>

        {/* Support Link */}
        <p
          style={{
            fontSize: '14px',
            color: colors.textSecondary,
            marginTop: '32px',
          }}
        >
          Need help?{' '}
          <Link
            href="/faq"
            style={{
              color: colors.primary,
              textDecoration: 'none',
              fontWeight: '500',
            }}
          >
            Visit our FAQ
          </Link>
        </p>
      </div>
    </div>
  );
}
