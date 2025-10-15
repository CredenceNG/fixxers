import Link from 'next/link';
import { colors } from '@/lib/theme';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      backgroundColor: colors.background,
    }}>
      <div style={{
        textAlign: 'center',
        maxWidth: '600px',
      }}>
        {/* 404 Icon */}
        <div style={{
          fontSize: '120px',
          fontWeight: 'bold',
          color: colors.primary,
          marginBottom: '20px',
        }}>
          404
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: 'bold',
          color: colors.text,
          marginBottom: '16px',
        }}>
          Page Not Found
        </h1>

        {/* Description */}
        <p style={{
          fontSize: '18px',
          color: colors.textSecondary,
          marginBottom: '32px',
          lineHeight: '1.6',
        }}>
          Sorry, we couldn't find the page you're looking for. The page may have been moved, deleted, or the URL might be incorrect.
        </p>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '16px',
          justifyContent: 'center',
          flexWrap: 'wrap',
        }}>
          <Link
            href="/"
            style={{
              padding: '12px 32px',
              backgroundColor: colors.primary,
              color: 'white',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px',
              transition: 'background-color 0.2s',
            }}
          >
            Go Home
          </Link>

          <Link
            href="/dashboard"
            style={{
              padding: '12px 32px',
              backgroundColor: 'white',
              color: colors.primary,
              border: `2px solid ${colors.primary}`,
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '600',
              fontSize: '16px',
              transition: 'background-color 0.2s',
            }}
          >
            Go to Dashboard
          </Link>
        </div>

        {/* Help Text */}
        <p style={{
          marginTop: '48px',
          fontSize: '14px',
          color: colors.textSecondary,
        }}>
          Need help? Contact support at{' '}
          <a
            href="mailto:support@fixxers.com"
            style={{
              color: colors.primary,
              textDecoration: 'none',
            }}
          >
            support@fixxers.com
          </a>
        </p>
      </div>
    </div>
  );
}
