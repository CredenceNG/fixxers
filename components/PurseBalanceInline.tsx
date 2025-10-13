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

export function PurseBalanceInline() {
  const [balance, setBalance] = useState<PurseBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBalance() {
      try {
        const response = await fetch('/api/purse/balance');
        if (!response.ok) throw new Error('Failed to fetch balance');
        const data = await response.json();
        setBalance(data);
      } catch (err) {
        // Set default balance with zero value on error
        setBalance({
          purseId: '',
          role: 'CLIENT',
          availableBalance: 0,
          pendingBalance: 0,
          commissionBalance: 0,
          totalRevenue: 0,
          totalBalance: 0,
        });
      } finally {
        setLoading(false);
      }
    }

    fetchBalance();
  }, []);

  if (loading) {
    return (
      <div style={{
        padding: '10px 16px',
        backgroundColor: colors.bgSecondary,
        borderRadius: borderRadius.md,
        border: `1px solid ${colors.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          backgroundColor: colors.border,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
        }}>
          💰
        </div>
        <div>
          <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '2px' }}>
            Wallet Balance
          </div>
          <div style={{ fontSize: '18px', fontWeight: '700', color: colors.textSecondary }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  const displayBalance = balance?.role === 'ADMIN'
    ? balance?.totalBalance || 0
    : balance?.availableBalance || 0;

  const role = balance?.role || 'CLIENT';
  const href = role === 'ADMIN' ? '/admin/purse' : role === 'FIXER' ? '/fixer/purse' : '/client/purse';

  return (
    <Link
      href={href}
      style={{
        textDecoration: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '10px 16px',
        backgroundColor: colors.white,
        border: `2px solid ${colors.primary}`,
        borderRadius: borderRadius.md,
        transition: 'all 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = colors.primaryLight;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = colors.white;
      }}
    >
      <div style={{
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        backgroundColor: colors.primaryLight,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
      }}>
        💰
      </div>
      <div>
        <div style={{ fontSize: '12px', color: colors.textSecondary, marginBottom: '2px' }}>
          {role === 'ADMIN' ? 'Platform Balance' : 'Wallet Balance'}
        </div>
        <div style={{ fontSize: '18px', fontWeight: '700', color: colors.primary }}>
          ₦{displayBalance.toLocaleString()}
        </div>
      </div>
    </Link>
  );
}
