'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';

interface OrderActionsProps {
  order: {
    id: string;
    status: string;
  };
}

export default function OrderActions({ order }: OrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState('');

  const handleStartWork = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/fixer/orders/${order.id}/start`, {
        method: 'POST',
      });

      if (response.ok) {
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to start work');
      }
    } catch (error) {
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleDeliver = async () => {
    if (!deliveryNote.trim()) {
      alert('Please provide a delivery note');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/fixer/orders/${order.id}/deliver`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryNote }),
      });

      if (response.ok) {
        setShowDeliveryForm(false);
        setDeliveryNote('');
        router.refresh();
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to deliver order');
      }
    } catch (error) {
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (order.status === 'PENDING') {
    return (
      <button
        onClick={handleStartWork}
        disabled={loading}
        style={{
          padding: '12px 24px',
          fontSize: '14px',
          fontWeight: '600',
          color: colors.white,
          backgroundColor: colors.primary,
          border: 'none',
          borderRadius: borderRadius.md,
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Starting...' : 'Start Working'}
      </button>
    );
  }

  if (order.status === 'IN_PROGRESS') {
    return (
      <div>
        {!showDeliveryForm ? (
          <button
            onClick={() => setShowDeliveryForm(true)}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              color: colors.white,
              backgroundColor: colors.success,
              border: 'none',
              borderRadius: borderRadius.md,
              cursor: 'pointer',
            }}
          >
            Deliver Order
          </button>
        ) : (
          <div
            style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: colors.bgSecondary,
              borderRadius: borderRadius.md,
            }}
          >
            <div style={{ marginBottom: '12px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  marginBottom: '8px',
                }}
              >
                Delivery Note *
              </label>
              <textarea
                value={deliveryNote}
                onChange={(e) => setDeliveryNote(e.target.value)}
                placeholder="Describe what you've completed, provide instructions, or any other relevant information..."
                rows={6}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleDeliver}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.white,
                  backgroundColor: colors.success,
                  border: 'none',
                  borderRadius: borderRadius.md,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'Delivering...' : 'Submit Delivery'}
              </button>
              <button
                onClick={() => setShowDeliveryForm(false)}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  fontSize: '14px',
                  fontWeight: '600',
                  color: colors.textSecondary,
                  backgroundColor: colors.white,
                  border: `1px solid ${colors.border}`,
                  borderRadius: borderRadius.md,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // COMPLETED status means order is delivered and waiting for payment
  // No action needed from fixer side

  if (order.status === 'COMPLETED') {
    return (
      <div
        style={{
          padding: '12px 16px',
          fontSize: '14px',
          fontWeight: '600',
          color: colors.success,
          backgroundColor: colors.successLight,
          borderRadius: borderRadius.md,
        }}
      >
        ✓ Order Completed
      </div>
    );
  }

  return null;
}
