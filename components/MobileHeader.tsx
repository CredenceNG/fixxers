'use client';

import Link from 'next/link';
import { useState } from 'react';
import { colors, borderRadius } from '@/lib/theme';
import LogoutButton from './LogoutButton';
import { NotificationBell } from './NotificationBell';

interface MobileHeaderProps {
  user: {
    id: string;
    email: string | null;
    phone: string | null;
    name: string | null;
    roles: string[];
    status: string;
    profileImage: string | null;
    bio: string | null;
    createdAt: Date;
  } | null;
}

export default function MobileHeader({ user, isAgent = false, agentStatus = null }: MobileHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

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
          padding: '0 16px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          style={{
            fontSize: '48px',
            fontWeight: '700',
            color: colors.primary,
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            lineHeight: '1.2',
          }}
          onClick={closeMenu}
        >
          fixers
        </Link>

        {/* Desktop Navigation */}
        <div
          className="desktop-nav"
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          {user ? (
            <>
              {user.roles && user.roles.length > 1 ? (
                // Dual-role user: show unified dashboard
                <Link
                  href="/dashboard"
                  style={{
                    padding: '10px 20px',
                    color: colors.textPrimary,
                    fontWeight: '600',
                    fontSize: '15px',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Dashboard
                </Link>
              ) : (
                // Single-role user: show role-specific dashboard link
                <Link
                  href={
                    user.roles?.includes('ADMIN')
                      ? '/admin/dashboard'
                      : user.roles?.includes('FIXER')
                      ? '/fixer/dashboard'
                      : '/client/dashboard'
                  }
                  style={{
                    padding: '10px 20px',
                    color: colors.textPrimary,
                    fontWeight: '600',
                    fontSize: '15px',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Dashboard
                </Link>
              )}
              {!user.roles?.includes('ADMIN') && (
                <Link
                  href="/gigs"
                  style={{
                    padding: '10px 20px',
                    color: colors.textPrimary,
                    fontWeight: '600',
                    fontSize: '15px',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Browse Services
                </Link>
              )}
              {isAgent ? (
                <Link
                  href="/agent/dashboard"
                  style={{
                    padding: '10px 20px',
                    color: colors.primary,
                    fontWeight: '600',
                    fontSize: '15px',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Agent Portal
                </Link>
              ) : !user?.roles?.includes('ADMIN') && (
                <Link
                  href="/agent/application"
                  style={{
                    padding: '10px 20px',
                    color: colors.textPrimary,
                    fontWeight: '600',
                    fontSize: '15px',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Become an Agent
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
                  padding: '10px 20px',
                  color: colors.textPrimary,
                  fontWeight: '600',
                  fontSize: '15px',
                  textDecoration: 'none',
                }}
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                style={{
                  padding: '10px 20px',
                  backgroundColor: colors.primary,
                  color: colors.white,
                  borderRadius: borderRadius.md,
                  fontWeight: '600',
                  fontSize: '15px',
                  textDecoration: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                Join
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={toggleMenu}
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '8px',
          }}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? (
            // Close icon
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={colors.textPrimary}
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            // Hamburger icon
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke={colors.textPrimary}
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMenuOpen && (
        <div
          className="mobile-menu"
          style={{
            display: 'none',
            backgroundColor: colors.white,
            borderTop: `1px solid ${colors.border}`,
            padding: '16px',
          }}
        >
          {user ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link
                href={
                  user.roles && user.roles.length > 1
                    ? '/dashboard'
                    : user.roles?.includes('ADMIN')
                    ? '/admin/dashboard'
                    : user.roles?.includes('FIXER')
                    ? '/fixer/dashboard'
                    : '/client/dashboard'
                }
                style={{
                  padding: '12px 16px',
                  color: colors.textPrimary,
                  fontWeight: '600',
                  fontSize: '16px',
                  textDecoration: 'none',
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.bgSecondary,
                }}
                onClick={closeMenu}
              >
                Dashboard
              </Link>
              {!user.roles?.includes('ADMIN') && (
                <Link
                  href="/gigs"
                  style={{
                    padding: '12px 16px',
                    color: colors.textPrimary,
                    fontWeight: '600',
                    fontSize: '16px',
                    textDecoration: 'none',
                    borderRadius: borderRadius.md,
                    backgroundColor: colors.bgSecondary,
                  }}
                  onClick={closeMenu}
                >
                  Browse Services
                </Link>
              )}
              {isAgent ? (
                <Link
                  href="/agent/dashboard"
                  style={{
                    padding: '12px 16px',
                    color: colors.white,
                    fontWeight: '600',
                    fontSize: '16px',
                    textDecoration: 'none',
                    borderRadius: borderRadius.md,
                    backgroundColor: colors.primary,
                  }}
                  onClick={closeMenu}
                >
                  Agent Portal
                </Link>
              ) : !user?.roles?.includes('ADMIN') && (
                <Link
                  href="/agent/application"
                  style={{
                    padding: '12px 16px',
                    color: colors.textPrimary,
                    fontWeight: '600',
                    fontSize: '16px',
                    textDecoration: 'none',
                    borderRadius: borderRadius.md,
                    backgroundColor: colors.bgSecondary,
                  }}
                  onClick={closeMenu}
                >
                  Become an Agent
                </Link>
              )}
              <div style={{ padding: '8px 0', borderTop: `1px solid ${colors.border}`, marginTop: '4px', paddingTop: '12px' }}>
                <LogoutButton />
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link
                href="/auth/login"
                style={{
                  padding: '12px 16px',
                  color: colors.textPrimary,
                  fontWeight: '600',
                  fontSize: '16px',
                  textDecoration: 'none',
                  borderRadius: borderRadius.md,
                  backgroundColor: colors.bgSecondary,
                  textAlign: 'center',
                }}
                onClick={closeMenu}
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                style={{
                  padding: '12px 16px',
                  backgroundColor: colors.primary,
                  color: colors.white,
                  borderRadius: borderRadius.md,
                  fontWeight: '600',
                  fontSize: '16px',
                  textDecoration: 'none',
                  textAlign: 'center',
                }}
                onClick={closeMenu}
              >
                Join
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Responsive CSS */}
      <style jsx>{`
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .mobile-menu-btn {
            display: block !important;
          }
          .mobile-menu {
            display: block !important;
          }
        }
      `}</style>
    </nav>
  );
}
