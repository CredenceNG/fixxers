'use client';

import { useState } from 'react';
import { DashboardButton } from '@/components/DashboardLayout';
import { PurseBalanceInline } from '@/components/PurseBalanceInline';
import { colors, borderRadius } from '@/lib/theme';
import styles from './FixerDashboardActions.module.css'; // Reuse same CSS

interface ClientDashboardActionsProps {
  hasFIXERRole: boolean;
}

export function ClientDashboardActions({ hasFIXERRole }: ClientDashboardActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className={styles.actionsContainer}>
      {/* Desktop & Tablet: Show My Requests, My Orders, More, Wallet */}
      <div className={styles.desktopTabletActions}>
        <DashboardButton variant="outline" href="/client/requests">
          📝 My Requests
        </DashboardButton>
        <DashboardButton variant="outline" href="/client/orders">
          📦 My Orders
        </DashboardButton>

        {/* More Menu */}
        <div className={styles.dropdownContainer}>
          <button
            onClick={toggleMenu}
            className={styles.moreButton}
            style={{
              padding: '10px 20px',
              backgroundColor: colors.white,
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              fontSize: '15px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            ⋮ More
          </button>
          {isMenuOpen && (
            <>
              <div
                className={styles.backdrop}
                onClick={closeMenu}
              />
              <div
                className={styles.dropdownMenu}
                style={{
                  backgroundColor: colors.white,
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                <a
                  href="/profile"
                  className={styles.dropdownItem}
                  style={{
                    color: colors.textPrimary,
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                  onClick={closeMenu}
                >
                  ✏️ Edit Profile
                </a>
                <a
                  href="/settings"
                  className={styles.dropdownItem}
                  style={{
                    color: colors.textPrimary,
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                  onClick={closeMenu}
                >
                  ⚙️ Settings
                </a>
                <a
                  href="/settings/referral"
                  className={styles.dropdownItem}
                  style={{
                    color: colors.textPrimary,
                    borderBottom: !hasFIXERRole ? `1px solid ${colors.border}` : (hasFIXERRole ? `1px solid ${colors.border}` : 'none'),
                  }}
                  onClick={closeMenu}
                >
                  🎁 Referrals
                </a>
                {!hasFIXERRole && (
                  <a
                    href="/client/upgrade"
                    className={styles.dropdownItem}
                    style={{
                      color: colors.primary,
                      fontWeight: '600',
                      borderBottom: 'none',
                    }}
                    onClick={closeMenu}
                  >
                    🚀 Become a Service Provider
                  </a>
                )}
                {hasFIXERRole && (
                  <a
                    href="/fixer/dashboard"
                    className={styles.dropdownItem}
                    style={{ color: colors.textPrimary }}
                    onClick={closeMenu}
                  >
                    🛠️ Switch to Fixer Mode
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        {/* Wallet Balance */}
        <div className={styles.walletBalance}>
          <PurseBalanceInline />
        </div>
      </div>

      {/* Mobile: Show My Requests, My Orders, More, Wallet */}
      <div className={styles.mobileActions}>
        <DashboardButton variant="outline" href="/client/requests" style={{ padding: '8px 12px', fontSize: '14px' }}>
          📝 Requests
        </DashboardButton>
        <DashboardButton variant="outline" href="/client/orders" style={{ padding: '8px 12px', fontSize: '14px' }}>
          📦 Orders
        </DashboardButton>

        {/* More Menu */}
        <div className={styles.dropdownContainer}>
          <button
            onClick={toggleMenu}
            className={styles.moreButton}
            style={{
              padding: '8px 16px',
              backgroundColor: colors.white,
              color: colors.textPrimary,
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            ⋮ More
          </button>
          {isMenuOpen && (
            <>
              <div
                className={styles.backdrop}
                onClick={closeMenu}
              />
              <div
                className={styles.dropdownMenu}
                style={{
                  backgroundColor: colors.white,
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}
              >
                <a
                  href="/profile"
                  className={styles.dropdownItem}
                  style={{
                    color: colors.textPrimary,
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                  onClick={closeMenu}
                >
                  ✏️ Edit Profile
                </a>
                <a
                  href="/settings"
                  className={styles.dropdownItem}
                  style={{
                    color: colors.textPrimary,
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                  onClick={closeMenu}
                >
                  ⚙️ Settings
                </a>
                <a
                  href="/settings/referral"
                  className={styles.dropdownItem}
                  style={{
                    color: colors.textPrimary,
                    borderBottom: !hasFIXERRole ? `1px solid ${colors.border}` : (hasFIXERRole ? `1px solid ${colors.border}` : 'none'),
                  }}
                  onClick={closeMenu}
                >
                  🎁 Referrals
                </a>
                {!hasFIXERRole && (
                  <a
                    href="/client/upgrade"
                    className={styles.dropdownItem}
                    style={{
                      color: colors.primary,
                      fontWeight: '600',
                      borderBottom: 'none',
                    }}
                    onClick={closeMenu}
                  >
                    🚀 Become a Service Provider
                  </a>
                )}
                {hasFIXERRole && (
                  <a
                    href="/fixer/dashboard"
                    className={styles.dropdownItem}
                    style={{ color: colors.textPrimary }}
                    onClick={closeMenu}
                  >
                    🛠️ Switch to Fixer Mode
                  </a>
                )}
              </div>
            </>
          )}
        </div>

        {/* Wallet Balance - Compact */}
        <div className={styles.walletBalance}>
          <PurseBalanceInline />
        </div>
      </div>
    </div>
  );
}
