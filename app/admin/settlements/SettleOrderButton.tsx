'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';

export function SettleOrderButton({
  orderId,
  sellerName,
}: {
  orderId: string;
  sellerName: string;
}) {
  const [settling, setSettling] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleSettle = async () => {
    setSettling(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/settle`, {
        method: 'POST',
      });

      if (res.ok) {
        alert('Payment settled successfully!');
        router.refresh();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to settle payment');
      }
    } catch (error) {
      alert('Failed to settle payment');
    } finally {
      setSettling(false);
      setShowConfirm(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        disabled={settling}
        style={{
          padding: '8px 16px',
          backgroundColor: colors.success,
          color: colors.white,
          border: 'none',
          borderRadius: borderRadius.md,
          fontSize: '14px',
          fontWeight: '600',
          cursor: settling ? 'not-allowed' : 'pointer',
          opacity: settling ? 0.6 : 1,
        }}
      >
        {settling ? 'Settling...' : 'Settle Payment'}
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setShowConfirm(false)}
        >
          <div
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.lg,
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: colors.textPrimary, marginBottom: '16px' }}>
              Confirm Settlement
            </h3>
            <p style={{ fontSize: '15px', color: colors.textSecondary, marginBottom: '24px' }}>
              Are you sure you want to settle this payment with <strong>{sellerName}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={settling}
                style={{
                  padding: '10px 20px',
                  backgroundColor: colors.bgSecondary,
                  color: colors.textPrimary,
                  border: 'none',
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSettle}
                disabled={settling}
                style={{
                  padding: '10px 20px',
                  backgroundColor: colors.success,
                  color: colors.white,
                  border: 'none',
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: settling ? 'not-allowed' : 'pointer',
                  opacity: settling ? 0.6 : 1,
                }}
              >
                {settling ? 'Settling...' : 'Confirm Settlement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
