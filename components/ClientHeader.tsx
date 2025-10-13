'use client';

import Link from 'next/link';
import { colors } from '@/lib/theme';
import LogoutButton from './LogoutButton';
import { NotificationBell } from './NotificationBell';
import { useEffect, useState } from 'react';

interface User {
  id: string;
  role: 'CLIENT' | 'FIXER' | 'ADMIN';
  name?: string;
  email?: string;
  phone?: string;
}

export default function ClientHeader() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Fetch current user from API
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user);
        }
      })
      .catch(() => {
        // Ignore errors
      });
  }, []);

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
                  fontSize: '15px',
                  fontWeight: '500',
                  color: colors.textPrimary,
                  textDecoration: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s',
                }}
              >
                Dashboard
              </Link>
              <NotificationBell />
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: colors.primary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.white,
                  fontWeight: '600',
                  fontSize: '16px',
                }}
              >
                {(user.name || user.email || user.phone || 'U').charAt(0).toUpperCase()}
              </div>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/auth/login"
                style={{
                  fontSize: '15px',
                  fontWeight: '500',
                  color: colors.textPrimary,
                  textDecoration: 'none',
                  padding: '10px 20px',
                }}
              >
                Log In
              </Link>
              <Link
                href="/auth/register"
                style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: colors.white,
                  backgroundColor: colors.primary,
                  textDecoration: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  transition: 'background-color 0.2s',
                }}
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
