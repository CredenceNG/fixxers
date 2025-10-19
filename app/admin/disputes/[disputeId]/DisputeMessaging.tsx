'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';

interface Message {
  id: string;
  message: string;
  isAdminNote: boolean;
  createdAt: Date | string;
  sender: {
    id: string;
    name: string | null;
    email: string | null;
    profileImage: string | null;
  };
}

interface DisputeMessagingProps {
  disputeId: string;
  messages: Message[];
  currentUserId: string;
}

export default function DisputeMessaging({
  disputeId,
  messages: initialMessages,
  currentUserId,
}: DisputeMessagingProps) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [isAdminNote, setIsAdminNote] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/disputes/${disputeId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          isAdminNote,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setMessage('');
      setIsAdminNote(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: colors.white,
      borderRadius: borderRadius.lg,
      border: `1px solid ${colors.border}`,
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '20px 24px',
        borderBottom: `1px solid ${colors.border}`,
        backgroundColor: colors.bgSecondary,
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, margin: 0 }}>
          Messages ({initialMessages.length})
        </h2>
      </div>

      {/* Messages List */}
      <div style={{
        maxHeight: '500px',
        overflowY: 'auto',
        padding: '24px',
      }}>
        {initialMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ fontSize: '15px', color: colors.textSecondary }}>
              No messages yet. Start the conversation below.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {initialMessages.map((msg) => {
              const isCurrentUser = msg.sender.id === currentUserId;

              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: isCurrentUser ? 'row-reverse' : 'row',
                    gap: '12px',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Avatar */}
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    backgroundColor: colors.primary,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: colors.white,
                    fontWeight: '600',
                    fontSize: '16px',
                    flexShrink: 0,
                  }}>
                    {(msg.sender.name || msg.sender.email || 'U').charAt(0).toUpperCase()}
                  </div>

                  {/* Message Content */}
                  <div style={{
                    flex: 1,
                    maxWidth: '70%',
                  }}>
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: borderRadius.lg,
                      backgroundColor: msg.isAdminNote
                        ? '#FFF3CD'
                        : isCurrentUser
                        ? colors.primary
                        : colors.bgSecondary,
                      border: msg.isAdminNote ? '1px solid #FFC107' : 'none',
                    }}>
                      <p style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: msg.isAdminNote
                          ? '#856404'
                          : isCurrentUser
                          ? colors.white
                          : colors.textPrimary,
                        marginBottom: '4px',
                      }}>
                        {msg.sender.name || msg.sender.email}
                        {msg.isAdminNote && ' (Internal Note)'}
                      </p>
                      <p style={{
                        fontSize: '15px',
                        color: msg.isAdminNote
                          ? '#856404'
                          : isCurrentUser
                          ? colors.white
                          : colors.textPrimary,
                        lineHeight: '1.6',
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                      }}>
                        {msg.message}
                      </p>
                      <p style={{
                        fontSize: '12px',
                        color: msg.isAdminNote
                          ? '#856404'
                          : isCurrentUser
                          ? 'rgba(255,255,255,0.8)'
                          : colors.textSecondary,
                        marginTop: '8px',
                        margin: 0,
                      }}>
                        {new Date(msg.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Input Form */}
      <div style={{
        padding: '20px 24px',
        borderTop: `1px solid ${colors.border}`,
        backgroundColor: colors.bgSecondary,
      }}>
        {error && (
          <div style={{
            padding: '12px',
            backgroundColor: colors.errorLight,
            borderRadius: borderRadius.md,
            marginBottom: '12px',
            border: `1px solid ${colors.error}`,
          }}>
            <p style={{ fontSize: '14px', color: colors.error, margin: 0 }}>
              {error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message..."
              rows={3}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '15px',
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical',
                backgroundColor: colors.white,
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isAdminNote}
                onChange={(e) => setIsAdminNote(e.target.checked)}
                disabled={loading}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <span style={{ fontSize: '14px', color: colors.textPrimary, fontWeight: '500' }}>
                Internal Admin Note (not visible to parties)
              </span>
            </label>

            <button
              type="submit"
              disabled={loading || !message.trim()}
              style={{
                padding: '10px 24px',
                fontSize: '15px',
                fontWeight: '600',
                color: colors.white,
                backgroundColor: loading || !message.trim() ? colors.textSecondary : colors.primary,
                border: 'none',
                borderRadius: borderRadius.md,
                cursor: loading || !message.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !message.trim() ? 0.6 : 1,
              }}
            >
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
