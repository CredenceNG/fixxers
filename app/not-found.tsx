import Link from 'next/link';
import { colors, borderRadius } from '@/lib/theme';

export default function NotFound() {
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
        {/* 404 Icon */}
        <div
          style={{
            fontSize: '64px',
            marginBottom: '24px',
          }}
        >
          🔍
        </div>

        {/* 404 Code */}
        <div
          style={{
            fontSize: '72px',
            fontWeight: '700',
            color: colors.primary,
            marginBottom: '16px',
            lineHeight: '1',
          }}
        >
          404
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
          Page Not Found
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
          Sorry, we couldn't find the page you're looking for. It might have been moved or
          deleted.
        </p>

        {/* Action Buttons */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 32px',
              backgroundColor: colors.primary,
              color: colors.white,
              border: 'none',
              borderRadius: borderRadius.md,
              fontSize: '16px',
              fontWeight: '600',
              textDecoration: 'none',
              transition: 'opacity 0.2s',
            }}
          >
            Go to Homepage
          </Link>

          <Link
            href="/gigs"
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
          >
            Browse Services
          </Link>
        </div>

        {/* Popular Links */}
        <div
          style={{
            marginTop: '48px',
            paddingTop: '32px',
            borderTop: `1px solid ${colors.border}`,
          }}
        >
          <p
            style={{
              fontSize: '14px',
              fontWeight: '600',
              color: colors.textPrimary,
              marginBottom: '16px',
            }}
          >
            Popular Pages
          </p>
          <div
            style={{
              display: 'flex',
              gap: '16px',
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <Link
              href="/how-it-works"
              style={{
                fontSize: '14px',
                color: colors.primary,
                textDecoration: 'none',
                fontWeight: '500',
              }}
            >
              How It Works
            </Link>
            <span style={{ color: colors.border }}>•</span>
            <Link
              href="/faq"
              style={{
                fontSize: '14px',
                color: colors.primary,
                textDecoration: 'none',
                fontWeight: '500',
              }}
            >
              FAQ
            </Link>
            <span style={{ color: colors.border }}>•</span>
            <Link
              href="/about"
              style={{
                fontSize: '14px',
                color: colors.primary,
                textDecoration: 'none',
                fontWeight: '500',
              }}
            >
              About Us
            </Link>
            <span style={{ color: colors.border }}>•</span>
            <Link
              href="/auth/login"
              style={{
                fontSize: '14px',
                color: colors.primary,
                textDecoration: 'none',
                fontWeight: '500',
              }}
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
