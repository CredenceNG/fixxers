'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';

export function CancelRequestButton({
  requestId,
  requestTitle,
}: {
  requestId: string;
  requestTitle: string;
}) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCancel = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/client/requests/${requestId}/cancel`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel request');
      }

      // Redirect to dashboard
      router.push('/client/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel request');
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          padding: '10px 20px',
          fontSize: '15px',
          fontWeight: '600',
          color: colors.error,
          backgroundColor: colors.errorLight,
          border: `2px solid ${colors.error}`,
          borderRadius: borderRadius.lg,
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.error;
          e.currentTarget.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.errorLight;
          e.currentTarget.style.color = colors.error;
        }}
      >
        Cancel Request
      </button>

      {/* Confirmation Modal */}
      {showModal && (
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
          onClick={() => !loading && setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: 'white',
              borderRadius: borderRadius.xl,
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3
              style={{
                fontSize: '20px',
                fontWeight: '700',
                color: colors.textPrimary,
                marginBottom: '16px',
              }}
            >
              Cancel Service Request?
            </h3>
            <p
              style={{
                fontSize: '15px',
                color: colors.textSecondary,
                lineHeight: '1.6',
                marginBottom: '24px',
              }}
            >
              Are you sure you want to cancel the request "{requestTitle}"? This action cannot be undone.
              All quotes received for this request will no longer be actionable.
            </p>

            {error && (
              <div
                style={{
                  backgroundColor: colors.errorLight,
                  border: `1px solid ${colors.error}`,
                  borderRadius: borderRadius.lg,
                  padding: '12px',
                  marginBottom: '20px',
                }}
              >
                <p style={{ fontSize: '14px', color: colors.error, margin: 0 }}>
                  {error}
                </p>
              </div>
            )}

            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'flex-end',
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                style={{
                  padding: '10px 24px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: colors.textPrimary,
                  backgroundColor: colors.bgSecondary,
                  border: 'none',
                  borderRadius: borderRadius.lg,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                Keep Request
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                style={{
                  padding: '10px 24px',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: 'white',
                  backgroundColor: colors.error,
                  border: 'none',
                  borderRadius: borderRadius.lg,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.5 : 1,
                }}
              >
                {loading ? 'Cancelling...' : 'Yes, Cancel Request'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
