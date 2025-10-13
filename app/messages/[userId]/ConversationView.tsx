'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { colors } from '@/lib/theme';

interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  message: string;
  gigId: string | null;
  orderId: string | null;
  requestId: string | null;
  createdAt: Date;
  sender: {
    id: string;
    name: string | null;
    email: string | null;
  };
  gig?: { id: string; title: string; slug: string } | null;
  order?: { id: string; gig: { title: string; slug: string } | null; request: { title: string } | null } | null;
  request?: { id: string; title: string } | null;
}

interface ConversationViewProps {
  currentUserId: string;
  otherUserId: string;
  otherUserName: string;
  messages: Message[];
}

export function ConversationView({
  currentUserId,
  otherUserId,
  otherUserName,
  messages: initialMessages,
}: ConversationViewProps) {
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) {
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
          recipientId: otherUserId,
          message: newMessage.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send message');
      }

      const data = await response.json();

      // Add the new message to the list
      setMessages((prev) => [...prev, data.message]);
      setNewMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const renderContext = (message: Message) => {
    if (message.gig) {
      return (
        <Link
          href={`/gigs/${message.gig.slug}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            marginTop: '8px',
            padding: '6px 10px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          📦 <span style={{ fontWeight: '500' }}>{message.gig.title}</span>
        </Link>
      );
    }

    if (message.order) {
      const title = message.order.gig?.title || message.order.request?.title || 'Service';
      const link = message.order.gig?.slug ? `/gigs/${message.order.gig.slug}` : `/client/requests/${message.requestId}`;
      return (
        <Link
          href={link}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            marginTop: '8px',
            padding: '6px 10px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          📋 <span style={{ fontWeight: '500' }}>Order: {title}</span>
        </Link>
      );
    }

    if (message.request) {
      return (
        <Link
          href={`/client/requests/${message.request.id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '12px',
            marginTop: '8px',
            padding: '6px 10px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            borderRadius: '6px',
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          🔧 <span style={{ fontWeight: '500' }}>Request: {message.request.title}</span>
        </Link>
      );
    }

    return null;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 200px)',
        backgroundColor: colors.white,
        borderRadius: '12px',
        border: `1px solid ${colors.border}`,
        overflow: 'hidden',
      }}
    >
      {/* Messages Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
            <div style={{ fontSize: '16px' }}>No messages yet. Start the conversation!</div>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.senderId === currentUserId;

            return (
              <div
                key={message.id}
                style={{
                  display: 'flex',
                  justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: isCurrentUser ? colors.primary : colors.bgSecondary,
                    color: isCurrentUser ? colors.white : colors.textPrimary,
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <div style={{ fontSize: '15px', lineHeight: '1.5', wordBreak: 'break-word' }}>
                    {message.message}
                  </div>
                  {renderContext(message)}
                  <div
                    style={{
                      fontSize: '11px',
                      marginTop: '6px',
                      opacity: 0.7,
                      textAlign: 'right',
                    }}
                  >
                    {formatTime(message.createdAt)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          padding: '20px 24px',
          borderTop: `1px solid ${colors.border}`,
          backgroundColor: colors.bgSecondary,
        }}
      >
        <form onSubmit={handleSend}>
          {error && (
            <div
              style={{
                padding: '10px',
                marginBottom: '12px',
                backgroundColor: '#FDEDEC',
                border: `1px solid #922B21`,
                borderRadius: '6px',
                fontSize: '14px',
                color: '#922B21',
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder={`Message ${otherUserName}...`}
              rows={3}
              style={{
                flex: 1,
                padding: '12px',
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                fontSize: '15px',
                fontFamily: 'inherit',
                resize: 'none',
                backgroundColor: colors.white,
              }}
              disabled={sending}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend(e);
                }
              }}
            />
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                backgroundColor: sending ? colors.gray300 : colors.primary,
                border: 'none',
                borderRadius: '8px',
                color: colors.white,
                fontSize: '15px',
                fontWeight: '600',
                cursor: sending ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
              }}
              disabled={sending}
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>

          <div style={{ marginTop: '8px', fontSize: '12px', color: colors.textSecondary }}>
            Press Enter to send, Shift+Enter for new line
          </div>
        </form>
      </div>
    </div>
  );
}
