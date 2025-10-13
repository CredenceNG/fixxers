import Link from 'next/link';
import { getCurrentUser } from '@/lib/auth';
import { colors, borderRadius } from '@/lib/theme';
import LogoutButton from './LogoutButton';
import { NotificationBell } from './NotificationBell';

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <nav
      style={{
        backgroundColor: colors.white,
        borderBottom: `1px solid ${colors.border}`,
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <div
        style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px',
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: '28px',
            fontWeight: '700',
            color: colors.textPrimary,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <span style={{ color: colors.primary }}>fixxers</span>
        </Link>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {user ? (
            <>
              <Link
                href={
                  user.role === 'ADMIN'
                    ? '/admin/dashboard'
                    : user.role === 'FIXER'
                    ? '/fixer/dashboard'
                    : '/client/dashboard'
                }
                style={{
                  padding: '12px 24px',
                  color: colors.textPrimary,
                  fontWeight: '600',
                  fontSize: '16px',
                  textDecoration: 'none',
                }}
              >
                Dashboard
              </Link>
              {user.role !== 'ADMIN' && (
                <Link
                  href="/gigs"
                  style={{
                    padding: '12px 24px',
                    color: colors.textPrimary,
                    fontWeight: '600',
                    fontSize: '16px',
                    textDecoration: 'none',
                  }}
                >
                  Browse Services
                </Link>
              )}
              <NotificationBell />
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                style={{
                  padding: '12px 24px',
                  color: colors.textPrimary,
                  fontWeight: '600',
                  fontSize: '16px',
                  textDecoration: 'none',
                }}
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                style={{
                  padding: '12px 24px',
                  backgroundColor: colors.primary,
                  color: colors.white,
                  borderRadius: borderRadius.md,
                  fontWeight: '600',
                  fontSize: '16px',
                  textDecoration: 'none',
                }}
              >
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
