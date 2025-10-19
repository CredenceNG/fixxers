'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { colors, borderRadius, spacing } from '@/lib/theme';

export function UpgradeSuccessMessage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (searchParams.get('upgraded') === 'success') {
      setShow(true);
      // Remove the query param from URL
      const newUrl = window.location.pathname;
      router.replace(newUrl);
    }
  }, [searchParams, router]);

  if (!show) return null;

  return (
    <div
      style={{
        backgroundColor: colors.successLight,
        border: `1px solid ${colors.success}`,
        borderRadius: borderRadius.lg,
        padding: spacing.lg,
        marginBottom: spacing.xl,
        display: 'flex',
        alignItems: 'flex-start',
        gap: spacing.md,
      }}
    >
      <div style={{ fontSize: '24px', flexShrink: 0 }}>🎉</div>
      <div style={{ flex: 1 }}>
        <h3
          style={{
            margin: '0 0 8px 0',
            fontSize: '16px',
            fontWeight: '600',
            color: colors.success,
          }}
        >
          Congratulations! You're now a Service Provider!
        </h3>
        <p style={{ margin: 0, fontSize: '14px', color: colors.textPrimary, lineHeight: '1.6' }}>
          You now have access to service provider features. You can create gigs, respond to service requests, and
          start earning on our platform. Visit your{' '}
          <a
            href="/fixer/dashboard"
            style={{
              color: colors.primary,
              fontWeight: '600',
              textDecoration: 'underline',
            }}
          >
            Service Provider Dashboard
          </a>{' '}
          to get started.
        </p>
      </div>
      <button
        onClick={() => setShow(false)}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          fontSize: '20px',
          color: colors.textSecondary,
          padding: '0',
          lineHeight: '1',
        }}
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
}
