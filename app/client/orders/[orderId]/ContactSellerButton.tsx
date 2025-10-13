'use client';

import { useState } from 'react';
import { colors, borderRadius } from '@/lib/theme';

export function ContactSellerButton({
  orderId,
  sellerName,
}: {
  orderId: string;
  sellerName: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!message.trim()) {
      alert('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: message.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setSent(true);
      setMessage('');
      setTimeout(() => {
        setShowModal(false);
        setSent(false);
      }, 2000);
    } catch (error: any) {
      alert(error.message);
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        style={{
          width: '100%',
          padding: '10px',
          backgroundColor: colors.white,
          color: colors.primary,
          border: `1px solid ${colors.primary}`,
          borderRadius: borderRadius.md,
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        Contact Seller
      </button>

      {/* Modal */}
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
            zIndex: 9999,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.lg,
              padding: '32px',
              maxWidth: '500px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {sent ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
                  Message Sent!
                </h2>
                <p style={{ fontSize: '15px', color: colors.textSecondary }}>
                  The seller will receive your message and respond soon.
                </p>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, margin: 0 }}>
                    Contact {sellerName}
                  </h2>
                  <button
                    onClick={() => setShowModal(false)}
                    style={{
                      backgroundColor: 'transparent',
                      border: 'none',
                      fontSize: '24px',
                      color: colors.textSecondary,
                      cursor: 'pointer',
                      padding: '0',
                      width: '32px',
                      height: '32px',
                    }}
                  >
                    ×
                  </button>
                </div>

                <p style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '16px', lineHeight: '1.6' }}>
                  Send a message to the seller about this order. They'll receive a notification and can respond to you.
                </p>

                <div style={{ marginBottom: '24px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: colors.textPrimary,
                      marginBottom: '8px',
                    }}
                  >
                    Your Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Hi, I have a question about my order..."
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
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <button
                    onClick={() => setShowModal(false)}
                    disabled={loading}
                    style={{
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
                  <button
                    onClick={handleSend}
                    disabled={loading || !message.trim()}
                    style={{
                      padding: '12px 24px',
                      backgroundColor: loading || !message.trim() ? colors.gray300 : colors.primary,
                      color: colors.white,
                      border: 'none',
                      borderRadius: borderRadius.md,
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: loading || !message.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {loading ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
