'use client';

import { useState } from 'react';
import { colors } from '@/lib/theme';

interface MessageFixerButtonProps {
  fixerId: string;
  fixerName: string;
  gigId: string;
  gigTitle: string;
}

export function MessageFixerButton({ fixerId, fixerName, gigId, gigTitle }: MessageFixerButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      setError('Please enter a message');
      return;
    }

    setSending(true);
    setError('');

    try {
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientId: fixerId,
          message: message.trim(),
          gigId,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess(true);
      setMessage('');
      setTimeout(() => {
        setIsOpen(false);
        setSuccess(false);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        style={{
          width: '100%',
          padding: '14px 24px',
          backgroundColor: colors.white,
          border: `2px solid ${colors.primary}`,
          borderRadius: '8px',
          color: colors.primary,
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = colors.primaryLight;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = colors.white;
        }}
      >
        📧 Message {fixerName}
      </button>

      {/* Modal */}
      {isOpen && (
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
            padding: '20px',
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            style={{
              backgroundColor: colors.white,
              borderRadius: '12px',
              maxWidth: '500px',
              width: '100%',
              padding: '32px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '24px', fontWeight: '700', color: colors.textPrimary, margin: 0 }}>
                Message {fixerName}
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: colors.textSecondary,
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>

            <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: colors.primaryLight, borderRadius: '8px' }}>
              <div style={{ fontSize: '13px', color: colors.textSecondary, marginBottom: '4px' }}>
                Regarding:
              </div>
              <div style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary }}>
                {gigTitle}
              </div>
            </div>

            {success ? (
              <div style={{ padding: '20px', backgroundColor: colors.primaryLight, borderRadius: '8px', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '12px' }}>✓</div>
                <div style={{ fontSize: '18px', fontWeight: '600', color: colors.primary }}>
                  Message Sent!
                </div>
                <div style={{ fontSize: '14px', color: colors.textSecondary, marginTop: '8px' }}>
                  {fixerName} will be notified based on their preferences
                </div>
              </div>
            ) : (
              <form onSubmit={handleSend}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
                    Your Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={`Hi ${fixerName}, I'm interested in your service...`}
                    style={{
                      width: '100%',
                      minHeight: '150px',
                      padding: '12px',
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      fontSize: '15px',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                    }}
                    disabled={sending}
                  />
                </div>

                {error && (
                  <div style={{ padding: '12px', backgroundColor: '#FDEDEC', border: `1px solid #922B21`, borderRadius: '8px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '14px', color: '#922B21' }}>
                      {error}
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '12px' }}>
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      backgroundColor: colors.white,
                      border: `1px solid ${colors.border}`,
                      borderRadius: '8px',
                      color: colors.textPrimary,
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: 'pointer',
                    }}
                    disabled={sending}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      flex: 1,
                      padding: '12px 24px',
                      backgroundColor: sending ? colors.gray300 : colors.primary,
                      border: 'none',
                      borderRadius: '8px',
                      color: colors.white,
                      fontSize: '15px',
                      fontWeight: '600',
                      cursor: sending ? 'not-allowed' : 'pointer',
                    }}
                    disabled={sending}
                  >
                    {sending ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
