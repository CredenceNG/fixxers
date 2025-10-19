'use client';

import { useState } from 'react';
import { DashboardButton } from '@/components/DashboardLayout';
import { PurseBalanceInline } from '@/components/PurseBalanceInline';
import { colors, borderRadius } from '@/lib/theme';
import styles from './FixerDashboardActions.module.css';

interface FixerDashboardActionsProps {
  hasCLIENTRole: boolean;
}

export function FixerDashboardActions({ hasCLIENTRole }: FixerDashboardActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className={styles.actionsContainer}>
      {/* Desktop & Tablet: Show Orders, Offers, More, Wallet */}
      <div className={styles.desktopTabletActions}>
        <DashboardButton variant="outline" href="/fixer/orders">
          📦 Orders
        </DashboardButton>
        <DashboardButton variant="outline" href="/fixer/gigs">
          📋 Offers
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
                  href="/fixer/services"
                  className={styles.dropdownItem}
                  style={{
                    color: colors.textPrimary,
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                  onClick={closeMenu}
                >
                  🛠️ My Services
                </a>
                <a
                  href="/fixer/profile"
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
                  href="/fixer/badges"
                  className={styles.dropdownItem}
                  style={{
                    color: colors.textPrimary,
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                  onClick={closeMenu}
                >
                  🛡️ Trust Badges
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
                    borderBottom: hasCLIENTRole ? `1px solid ${colors.border}` : 'none',
                  }}
                  onClick={closeMenu}
                >
                  🎁 Referrals
                </a>
                {hasCLIENTRole && (
                  <a
                    href="/client/dashboard"
                    className={styles.dropdownItem}
                    style={{ color: colors.textPrimary }}
                    onClick={closeMenu}
                  >
                    👤 Switch to Client Mode
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

      {/* Mobile: Show Orders, Offers, More, Wallet */}
      <div className={styles.mobileActions}>
        <DashboardButton variant="outline" href="/fixer/orders" style={{ padding: '8px 12px', fontSize: '14px' }}>
          📦 Orders
        </DashboardButton>
        <DashboardButton variant="outline" href="/fixer/gigs" style={{ padding: '8px 12px', fontSize: '14px' }}>
          📋 Offers
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
                  href="/fixer/services"
                  className={styles.dropdownItem}
                  style={{
                    color: colors.textPrimary,
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                  onClick={closeMenu}
                >
                  🛠️ My Services
                </a>
                <a
                  href="/fixer/profile"
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
                  href="/fixer/badges"
                  className={styles.dropdownItem}
                  style={{
                    color: colors.textPrimary,
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                  onClick={closeMenu}
                >
                  🛡️ Trust Badges
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
                    borderBottom: hasCLIENTRole ? `1px solid ${colors.border}` : 'none',
                  }}
                  onClick={closeMenu}
                >
                  🎁 Referrals
                </a>
                {hasCLIENTRole && (
                  <a
                    href="/client/dashboard"
                    className={styles.dropdownItem}
                    style={{ color: colors.textPrimary }}
                    onClick={closeMenu}
                  >
                    👤 Switch to Client Mode
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
