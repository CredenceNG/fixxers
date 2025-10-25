import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth';
import Link from 'next/link';
import { colors, borderRadius } from '@/lib/theme';

export default async function PendingPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/auth/login');
  }

  // If already approved, redirect based on role
  if (user.status === 'ACTIVE') {
    const roles = user.roles || [];
    if (roles.includes('ADMIN')) {
      redirect('/admin/dashboard');
    } else if (roles.includes('FIXER')) {
      redirect('/fixer/dashboard');
    } else if (roles.includes('CLIENT')) {
      redirect('/client/dashboard');
    } else {
      redirect('/');
    }
  }

  // Check if it's a contact change request
  const isContactChangeRequest = user.emailChangeRequested || user.phoneChangeRequested;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
      <div style={{ backgroundColor: colors.white, borderRadius: borderRadius.lg, padding: '48px', maxWidth: '600px', textAlign: 'center', border: `1px solid ${colors.border}`, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ width: '80px', height: '80px', backgroundColor: '#FEF5E7', borderRadius: '50%', margin: '0 auto 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }}>
          ⏳
        </div>
        <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '16px', color: colors.textPrimary }}>
          {isContactChangeRequest ? 'Contact Change Under Review' : 'Account Under Review'}
        </h1>
        <p style={{ fontSize: '16px', color: colors.textSecondary, lineHeight: '1.6', marginBottom: '24px' }}>
          {isContactChangeRequest
            ? 'Your request to update your contact information is currently being reviewed by our admin team.'
            : 'Thank you for registering! Your account is currently being reviewed by our admin team.'}
        </p>

        {isContactChangeRequest && (
          <div style={{ padding: '16px', backgroundColor: '#F3F4F6', borderRadius: borderRadius.md, marginBottom: '24px', textAlign: 'left' }}>
            <p style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
              Pending Changes:
            </p>
            {user.emailChangeRequested && user.pendingEmail && (
              <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>
                • New Email: {user.pendingEmail}
              </p>
            )}
            {user.phoneChangeRequested && user.pendingPhone && (
              <p style={{ fontSize: '14px', color: colors.textSecondary }}>
                • New Phone: {user.pendingPhone}
              </p>
            )}
          </div>
        )}

        <p style={{ fontSize: '16px', color: colors.textSecondary, lineHeight: '1.6', marginBottom: '32px' }}>
          We'll notify you via {user.email ? 'email' : 'SMS'} once your {isContactChangeRequest ? 'changes have been' : 'account has been'} approved. This typically takes 1-2 business days.
        </p>

        <div style={{ padding: '20px', backgroundColor: colors.bgTertiary, borderRadius: borderRadius.md, marginBottom: '24px', border: `1px solid ${colors.border}` }}>
          <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px' }}>Status</p>
          <p style={{ fontSize: '18px', fontWeight: '700', color: colors.warning }}>PENDING APPROVAL</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
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
