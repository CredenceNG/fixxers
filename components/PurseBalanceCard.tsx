'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { colors, borderRadius } from '@/lib/theme';

interface PurseBalance {
  purseId: string;
  role: string;
  availableBalance: number;
  pendingBalance: number;
  commissionBalance: number;
  totalRevenue: number;
  totalBalance: number;
}

export function PurseBalanceCard() {
  const [balance, setBalance] = useState<PurseBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBalance() {
      try {
        const response = await fetch('/api/purse/balance');
        if (!response.ok) throw new Error('Failed to fetch balance');
        const data = await response.json();
        setBalance(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load balance');
      } finally {
        setLoading(false);
      }
    }

    fetchBalance();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          backgroundColor: colors.white,
          borderRadius: borderRadius.lg,
          border: `1px solid ${colors.border}`,
          padding: '24px',
        }}
      >
        <div style={{ fontSize: '14px', color: colors.textSecondary }}>Loading...</div>
      </div>
    );
  }

  if (error || !balance) {
    return null;
  }

  const isAdmin = balance.role === 'ADMIN';
  const isFixer = balance.role === 'FIXER';
  const isClient = balance.role === 'CLIENT';

  return (
    <div
      style={{
        backgroundColor: colors.white,
        borderRadius: borderRadius.lg,
        border: `1px solid ${colors.border}`,
        padding: '24px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: colors.textSecondary, marginBottom: '8px' }}>
            {isAdmin ? 'Platform Purse' : isFixer ? 'My Wallet' : 'My Wallet'}
          </div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary }}>
            ₦{balance.availableBalance.toLocaleString()}
          </div>
          <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
            Available Balance
          </div>
        </div>
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: colors.primaryLight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
          }}
        >
          💰
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        {isAdmin && (
          <>
            <div>
              <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px' }}>
                Pending (Escrow)
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>
                ₦{balance.pendingBalance.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px' }}>
                Commission Held
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>
                ₦{balance.commissionBalance.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px' }}>
                Total Revenue
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: colors.primary }}>
                ₦{balance.totalRevenue.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px' }}>
                Total Balance
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary }}>
                ₦{balance.totalBalance.toLocaleString()}
              </div>
            </div>
          </>
        )}

        {isFixer && (
          <>
            <div>
              <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px' }}>
                Pending
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: colors.warning }}>
                ₦{balance.pendingBalance.toLocaleString()}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px' }}>
                Total Earned
              </div>
              <div style={{ fontSize: '18px', fontWeight: '600', color: colors.primary }}>
                ₦{balance.totalRevenue.toLocaleString()}
              </div>
            </div>
          </>
        )}

        {isClient && balance.availableBalance > 0 && (
          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px' }}>
              From Refunds
            </div>
            <div style={{ fontSize: '14px', color: colors.textPrimary }}>
              You have ₦{balance.availableBalance.toLocaleString()} available from refunded orders
            </div>
          </div>
        )}
      </div>

      {(isFixer || isClient) && balance.availableBalance > 0 && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: `1px solid ${colors.border}` }}>
          <Link
            href={isFixer ? '/fixer/wallet' : '/client/wallet'}
            style={{
              display: 'inline-block',
              padding: '10px 20px',
              backgroundColor: colors.primary,
              color: colors.white,
              borderRadius: borderRadius.md,
              fontSize: '14px',
              fontWeight: '600',
              textDecoration: 'none',
              textAlign: 'center',
            }}
          >
            Withdraw Funds
          </Link>
        </div>
      )}
    </div>
  );
}
