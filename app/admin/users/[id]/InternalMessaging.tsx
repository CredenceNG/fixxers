'use client';

import { useState } from 'react';
import { colors, borderRadius } from '@/lib/theme';

interface InternalMessagingProps {
  userId: string;
  userEmail: string;
  userName: string;
}

export function InternalMessaging({ userId, userEmail, userName }: InternalMessagingProps) {
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      setStatus({ type: 'error', message: 'Please fill in both subject and message' });
      return;
    }

    setSending(true);
    setStatus(null);

    try {
      const response = await fetch(`/api/admin/users/${userId}/send-message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, message }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus({ type: 'success', message: 'Message sent successfully to ' + userEmail });
        setSubject('');
        setMessage('');
      } else {
        setStatus({ type: 'error', message: data.error || 'Failed to send message' });
      }
    } catch (error) {
      setStatus({ type: 'error', message: 'Error sending message. Please try again.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ backgroundColor: 'white', borderRadius: borderRadius.lg, boxShadow: '0 1px 3px rgba(0,0,0,0.1)', padding: '20px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '24px', paddingBottom: '16px', borderBottom: `2px solid ${colors.border}` }}>
        Send Message to {userName}
      </h2>

      {status && (
        <div
          style={{
            padding: '12px 16px',
            marginBottom: '16px',
            borderRadius: borderRadius.md,
            backgroundColor: status.type === 'success' ? colors.successLight : colors.errorLight,
            border: `1px solid ${status.type === 'success' ? colors.success : colors.error}`,
            color: status.type === 'success' ? colors.success : colors.error,
            fontSize: '14px',
          }}
        >
          {status.message}
        </div>
      )}

      <form onSubmit={handleSendMessage}>
        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="subject"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: colors.textSecondary,
              marginBottom: '8px',
            }}
          >
            Subject
          </label>
          <input
            id="subject"
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter message subject"
            disabled={sending}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              outline: 'none',
            }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label
            htmlFor="message"
            style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: colors.textSecondary,
              marginBottom: '8px',
            }}
          >
            Message
          </label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message here..."
            disabled={sending}
            rows={6}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '14px',
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              outline: 'none',
              resize: 'vertical',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={sending || !subject.trim() || !message.trim()}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            color: colors.white,
            backgroundColor: colors.primary,
            border: 'none',
            borderRadius: borderRadius.md,
            cursor: sending || !subject.trim() || !message.trim() ? 'not-allowed' : 'pointer',
            opacity: sending || !subject.trim() || !message.trim() ? 0.6 : 1,
          }}
        >
          {sending ? 'Sending...' : 'Send Message'}
        </button>

        <p style={{ marginTop: '12px', fontSize: '13px', color: colors.textSecondary }}>
          This message will be sent to: <strong>{userEmail}</strong>
        </p>
      </form>
    </div>
  );
}
