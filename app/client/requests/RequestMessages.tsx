'use client';

import { useState, useRef } from 'react';
import { colors } from '@/lib/theme';
import { useOptimizedPolling, STABLE_MESSAGE_STYLES } from '@/hooks/useOptimizedPolling';

interface Message {
  id: string;
  message: string;
  createdAt: string;
  sender: {
    id: string;
    name: string | null;
    role: string;
  };
}

interface RequestMessagesProps {
  requestId: string;
  currentUserId: string;
}

export function RequestMessages({ requestId, currentUserId }: RequestMessagesProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  };

  const fetchMessages = async (silent = false) => {
    try {
      const response = await fetch(`/api/requests/${requestId}/messages`);
      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || [];

        // Only update if there are actually new messages
        if (newMessages.length !== messages.length) {
          const hasNewMessages = newMessages.length > lastMessageCountRef.current;
          setMessages(newMessages);
          lastMessageCountRef.current = newMessages.length;

          if (hasNewMessages && !silent) {
            setTimeout(scrollToBottom, 50);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Use optimized polling hook
  useOptimizedPolling(fetchMessages, 30000, [requestId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await fetch(`/api/requests/${requestId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages([...messages, data.message]);
        setNewMessage('');
        setTimeout(scrollToBottom, 100);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: colors.textSecondary }}>
        Loading messages...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '600px', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', ...STABLE_MESSAGE_STYLES.container }}>
      {/* Messages area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', minHeight: 0, ...STABLE_MESSAGE_STYLES.scrollContainer }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: colors.textSecondary }}>
            <p style={{ margin: 0, fontSize: '14px' }}>No messages yet. Start a conversation!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.sender.id === currentUserId;
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isOwn ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    backgroundColor: isOwn ? colors.primary : '#F3F4F6',
                    color: isOwn ? 'white' : colors.textPrimary,
                  }}
                >
                  {!isOwn && (
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', opacity: 0.9 }}>
                      {msg.sender.name || msg.sender.role}
                    </div>
                  )}
                  <div style={{ fontSize: '14px', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                    {msg.message}
                  </div>
                  <div
                    style={{
                      fontSize: '11px',
                      marginTop: '4px',
                      opacity: 0.7,
                    }}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSendMessage}
        style={{
          borderTop: '1px solid #E4E6EB',
          padding: '16px',
          display: 'flex',
          gap: '12px',
          backgroundColor: '#F9FAFB',
        }}
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={sending}
          style={{
            flex: 1,
            padding: '12px 16px',
            border: '2px solid #E4E6EB',
            borderRadius: '8px',
            fontSize: '14px',
            outline: 'none',
            backgroundColor: 'white',
          }}
        />
        <button
          type="submit"
          disabled={sending || !newMessage.trim()}
          style={{
            padding: '12px 24px',
            backgroundColor: colors.primary,
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: '600',
            cursor: sending || !newMessage.trim() ? 'not-allowed' : 'pointer',
            opacity: sending || !newMessage.trim() ? 0.5 : 1,
          }}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
