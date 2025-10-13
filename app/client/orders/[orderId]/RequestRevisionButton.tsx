'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';

interface RequestRevisionButtonProps {
  orderId: string;
  revisionsUsed: number;
  revisionsAllowed: number;
}

export function RequestRevisionButton({ orderId, revisionsUsed, revisionsAllowed }: RequestRevisionButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const revisionsRemaining = revisionsAllowed - revisionsUsed;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!note.trim() || note.trim().length < 10) {
      setError('Please provide detailed feedback (at least 10 characters)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/request-revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ note: note.trim() }),
      });

      if (response.ok) {
        setShowModal(false);
        router.refresh();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to request revision');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (revisionsRemaining <= 0) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          padding: '12px 24px',
          backgroundColor: colors.white,
          color: colors.textPrimary,
          border: `1px solid ${colors.border}`,
          borderRadius: borderRadius.md,
          fontSize: '15px',
          fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        Request Revision ({revisionsRemaining} left)
      </button>

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
              backgroundColor: colors.white,
              padding: '32px',
              borderRadius: borderRadius.lg,
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
              Request Revision
            </h3>
            <p style={{ fontSize: '15px', color: colors.textSecondary, marginBottom: '24px' }}>
              You have {revisionsRemaining} revision{revisionsRemaining !== 1 ? 's' : ''} remaining. Please provide detailed feedback on what needs to be changed.
            </p>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary, display: 'block', marginBottom: '8px' }}>
                  Revision Details *
                </label>
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Describe what changes you would like the seller to make..."
                  rows={6}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    fontSize: '15px',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
                <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
                  Minimum 10 characters
                </div>
              </div>

              {error && (
                <div
                  style={{
                    padding: '12px',
                    backgroundColor: colors.errorLight,
                    color: colors.error,
                    borderRadius: borderRadius.md,
                    fontSize: '14px',
                    marginBottom: '16px',
                  }}
                >
                  {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    backgroundColor: colors.warning,
                    color: colors.white,
                    border: 'none',
                    borderRadius: borderRadius.md,
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  {loading ? 'Requesting...' : 'Request Revision'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  disabled={loading}
                  style={{
                    flex: 1,
                    padding: '12px 24px',
                    backgroundColor: colors.white,
                    color: colors.textPrimary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: borderRadius.md,
                    fontSize: '15px',
                    fontWeight: '600',
                    cursor: loading ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
