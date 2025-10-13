'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { colors, borderRadius } from '@/lib/theme';

export function GigApprovalActions({
  gigId,
  currentStatus,
}: {
  gigId: string;
  currentStatus: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleApprove = async () => {
    if (!confirm('Approve this service offer? It will become visible to clients.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gigs/${gigId}/approve`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to approve gig');
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (error: any) {
      alert(error.message);
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gigs/${gigId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reject gig');
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (error: any) {
      alert(error.message);
      setLoading(false);
    }
  };

  if (currentStatus !== 'PENDING_REVIEW') {
    return null;
  }

  return (
    <div style={{ display: 'flex', gap: '12px' }}>
      <button
        onClick={handleReject}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: colors.white,
          color: colors.error,
          border: `1px solid ${colors.error}`,
          borderRadius: borderRadius.md,
          fontSize: '14px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.5 : 1,
        }}
      >
        Reject
      </button>
      <button
        onClick={handleApprove}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: colors.success,
          color: colors.white,
          border: 'none',
          borderRadius: borderRadius.md,
          fontSize: '14px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.5 : 1,
        }}
      >
        {loading ? 'Processing...' : 'Approve'}
      </button>
    </div>
  );
}
