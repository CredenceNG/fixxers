import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';
import { colors, borderRadius, typography } from '@/lib/theme';

export default async function FixerPendingPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== 'FIXER') {
    redirect('/auth/login');
  }

  // If already approved, redirect to dashboard
  if (user.status === 'ACTIVE') {
    redirect('/fixer/dashboard');
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: '48px', maxWidth: '600px', textAlign: 'center', border: `1px solid ${colors.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: '#FEF5E7', borderRadius: '50%', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
          ⏳
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '16px', color: colors.textPrimary }}>
          Application Under Review
        </h1>
        <p style={{ fontSize: '16px', color: colors.textSecondary, lineHeight: '1.6', marginBottom: '24px' }}>
          Thank you for applying to become a service provider on Fixxers! Your application is currently being reviewed by our admin team.
        </p>
        <p style={{ fontSize: '16px', color: colors.textSecondary, lineHeight: '1.6', marginBottom: '32px' }}>
          We'll notify you via {user.email ? 'email' : 'SMS'} once your application has been approved. This typically takes 1-2 business days.
        </p>
        <div style={{ padding: '20px', backgroundColor: colors.bgTertiary, borderRadius: borderRadius.md, marginBottom: '24px', border: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>Application Status</p>
          <p style={{ fontSize: '18px', fontWeight: '700', color: colors.warning }}>PENDING APPROVAL</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/fixer/profile"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: colors.primary,
              border: `1px solid ${colors.primary}`,
              borderRadius: borderRadius.md,
              fontWeight: '600',
              fontSize: '16px',
              textDecoration: 'none'
            }}
          >
            Edit Profile
          </Link>
          <Link
            href="/"
            style={{
              display: 'inline-block',
              padding: '12px 24px',
              backgroundColor: colors.primary,
              color: colors.white,
              borderRadius: borderRadius.md,
              fontWeight: '600',
              fontSize: '16px',
              textDecoration: 'none'
            }}
          >
            Return to Home
          </Link>
        </div>
        <form action="/api/auth/logout" method="POST" style={{ marginTop: '16px' }}>
          <button
            type="submit"
            style={{
              padding: '10px 24px',
              background: 'transparent',
              color: colors.textSecondary,
              border: 'none',
              borderRadius: borderRadius.md,
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </form>
      </div>
    </div>
  );
}
