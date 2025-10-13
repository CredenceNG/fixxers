'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';

export function CancelOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to cancel order');
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      style={{
        padding: '12px 24px',
        backgroundColor: colors.white,
        color: colors.error,
        border: `1px solid ${colors.error}`,
        borderRadius: borderRadius.md,
        fontSize: '15px',
        fontWeight: '600',
        cursor: loading ? 'not-allowed' : 'pointer',
        opacity: loading ? 0.5 : 1,
      }}
    >
      {loading ? 'Cancelling...' : 'Cancel Order'}
    </button>
  );
}
