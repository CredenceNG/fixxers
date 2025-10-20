'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { colors } from '@/lib/theme';
import CommissionCard from '@/components/agent/CommissionCard';

interface Commission {
  id: string;
  amount: number;
  percentage: number;
  orderAmount: number;
  status: string;
  createdAt: Date;
  order?: {
    id: string;
    gig?: {
      title: string;
    };
  };
  agentFixer?: {
    fixer: {
      name: string;
    };
  };
}

interface EarningsData {
  walletBalance: number;
  totalEarned: number;
  totalWithdrawn: number;
  pendingAmount: number;
  paidAmount: number;
  commissions: Commission[];
}

export default function AgentEarningsClient() {
  const [data, setData] = useState<EarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  const [withdrawSuccess, setWithdrawSuccess] = useState('');

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const res = await fetch('/api/agent/earnings');
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to fetch earnings');
      }

      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async () => {
    if (!data || data.walletBalance <= 0) {
      setWithdrawError('Insufficient balance for withdrawal');
      return;
    }

    setWithdrawing(true);
    setWithdrawError('');
    setWithdrawSuccess('');

    try {
      const res = await fetch('/api/agent/earnings/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to process withdrawal');
      }

      setWithdrawSuccess('Withdrawal request submitted successfully');
      // Refresh earnings data
      fetchEarnings();
    } catch (err: any) {
      setWithdrawError(err.message);
    } finally {
      setWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary, padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <p style={{ color: colors.textSecondary }}>Loading earnings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary, padding: '24px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ backgroundColor: colors.errorLight, border: `1px solid ${colors.error}`, borderRadius: '8px', padding: '16px' }}>
            <p style={{ color: colors.error }}>{error || 'Failed to load earnings'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bgSecondary, padding: '24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: colors.textPrimary }}>
              Earnings & Commissions
            </h1>
            <Link
              href="/agent/dashboard"
              style={{
                padding: '10px 20px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                backgroundColor: colors.white,
                color: colors.textPrimary,
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
              }}
            >
              ← Back to Dashboard
            </Link>
          </div>
          <p style={{ color: colors.textSecondary }}>
            Track your earnings and commission history
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div style={{ backgroundColor: colors.white, padding: '20px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px', fontWeight: '500' }}>
              Wallet Balance
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: colors.primary, marginBottom: '4px' }}>
              ₦{Number(data.walletBalance).toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: colors.textLight }}>
              Available for withdrawal
            </div>
          </div>

          <div style={{ backgroundColor: colors.white, padding: '20px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px', fontWeight: '500' }}>
              Total Earned
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, marginBottom: '4px' }}>
              ₦{Number(data.totalEarned).toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: colors.textLight }}>
              All-time earnings
            </div>
          </div>

          <div style={{ backgroundColor: colors.white, padding: '20px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px', fontWeight: '500' }}>
              Pending
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: colors.warning, marginBottom: '4px' }}>
              ₦{Number(data.pendingAmount).toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: colors.textLight }}>
              Awaiting payment
            </div>
          </div>

          <div style={{ backgroundColor: colors.white, padding: '20px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
            <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '8px', fontWeight: '500' }}>
              Total Withdrawn
            </div>
            <div style={{ fontSize: '32px', fontWeight: '700', color: colors.textPrimary, marginBottom: '4px' }}>
              ₦{Number(data.totalWithdrawn).toLocaleString()}
            </div>
            <div style={{ fontSize: '12px', color: colors.textLight }}>
              All-time withdrawals
            </div>
          </div>
        </div>

        {/* Withdrawal Section */}
        <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '12px', marginBottom: '24px', border: `1px solid ${colors.border}` }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
            Withdraw Funds
          </h2>

          {withdrawSuccess && (
            <div style={{ padding: '12px', backgroundColor: colors.successLight, color: colors.successDark, borderRadius: '8px', marginBottom: '16px' }}>
              {withdrawSuccess}
            </div>
          )}

          {withdrawError && (
            <div style={{ padding: '12px', backgroundColor: colors.errorLight, color: colors.error, borderRadius: '8px', marginBottom: '16px' }}>
              {withdrawError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: colors.textSecondary, fontSize: '14px', marginBottom: '4px' }}>
                Available Balance
              </p>
              <p style={{ fontSize: '24px', fontWeight: '700', color: colors.primary }}>
                ₦{Number(data.walletBalance).toLocaleString()}
              </p>
            </div>
            <button
              onClick={handleWithdraw}
              disabled={withdrawing || data.walletBalance <= 0}
              style={{
                padding: '12px 24px',
                backgroundColor: data.walletBalance > 0 ? colors.primary : colors.gray300,
                color: colors.white,
                border: 'none',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: data.walletBalance > 0 && !withdrawing ? 'pointer' : 'not-allowed',
                opacity: withdrawing ? 0.6 : 1,
              }}
            >
              {withdrawing ? 'Processing...' : 'Request Withdrawal'}
            </button>
          </div>
        </div>

        {/* Commission History */}
        <div style={{ backgroundColor: colors.white, padding: '24px', borderRadius: '12px', border: `1px solid ${colors.border}` }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
            Commission History
          </h2>

          {data.commissions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p style={{ color: colors.textSecondary }}>
                No commissions yet
              </p>
            </div>
          ) : (
            <div>
              {data.commissions.map((commission) => (
                <CommissionCard key={commission.id} commission={commission} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
