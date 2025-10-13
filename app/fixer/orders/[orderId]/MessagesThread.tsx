'use client';

import { useState, useRef } from 'react';
import { colors, borderRadius } from '@/lib/theme';
import { useOptimizedPolling, STABLE_MESSAGE_STYLES } from '@/hooks/useOptimizedPolling';

type Message = {
  id: string;
  message: string;
  senderId: string;
  sender: {
    id: string;
    name: string | null;
    profileImage: string | null;
  };
  createdAt: string;
};

export function MessagesThread({
  orderId,
  currentUserId,
}: {
  orderId: string;
  currentUserId: string;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNewMessageAlert, setShowNewMessageAlert] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);
  const isUserScrolledUpRef = useRef(false);

  const scrollToBottom = (smooth = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' });
    setShowNewMessageAlert(false);
    setUnreadCount(0);
  };

  const handleScroll = () => {
    if (!messagesContainerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;

    isUserScrolledUpRef.current = !isNearBottom;

    if (isNearBottom) {
      setShowNewMessageAlert(false);
      setUnreadCount(0);
    }
  };

  const fetchMessages = async (isInitialLoad = false) => {
    try {
      const res = await fetch(`/api/orders/${orderId}/messages`);
      if (res.ok) {
        const data = await res.json();
        const newMessages = data.messages;

        // Check if there are new messages
        if (!isInitialLoad && newMessages.length > previousMessageCountRef.current) {
          const newMessageCount = newMessages.length - previousMessageCountRef.current;
          const hasNewMessageFromOthers = newMessages
            .slice(-newMessageCount)
            .some((msg: Message) => msg.senderId !== currentUserId);

          if (hasNewMessageFromOthers && isUserScrolledUpRef.current) {
            // User is scrolled up, show notification
            setUnreadCount(prev => prev + newMessageCount);
            setShowNewMessageAlert(true);
          }
          // Remove the else clause - never auto-scroll on polling
        }

        previousMessageCountRef.current = newMessages.length;
        setMessages(newMessages);

        // Only auto-scroll on initial load
        if (isInitialLoad) {
          setTimeout(() => scrollToBottom(false), 100);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use optimized polling hook
  useOptimizedPolling(
    async (silent) => {
      await fetchMessages(!silent);
    },
    30000,
    [orderId]
  );

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newMessage.trim() }),
      });

      if (res.ok) {
        setNewMessage('');
        await fetchMessages(false);
        // Always scroll to bottom after sending
        setTimeout(() => scrollToBottom(), 100);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to send message');
      }
    } catch (error) {
      alert('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: colors.textSecondary }}>
        Loading messages...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      {/* Messages List */}
      <div
        ref={messagesContainerRef}
        onScroll={handleScroll}
        style={{
          height: '180px',
          overflowY: 'auto',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
          backgroundColor: colors.bgSecondary,
          borderRadius: borderRadius.md,
          marginBottom: '16px',
          position: 'relative',
          ...STABLE_MESSAGE_STYLES.container,
          ...STABLE_MESSAGE_STYLES.scrollContainer,
        }}
      >
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', color: colors.textSecondary, padding: '40px 20px' }}>
            <p style={{ fontSize: '15px', marginBottom: '8px' }}>No messages yet</p>
            <p style={{ fontSize: '13px' }}>Start a conversation</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.senderId === currentUserId;
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                  alignItems: 'flex-start',
                  gap: '8px',
                }}
              >
                {!isCurrentUser && (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: colors.primary,
                      color: colors.white,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      flexShrink: 0,
                    }}
                  >
                    {msg.sender.name?.charAt(0).toUpperCase() || '?'}
                  </div>
                )}
                <div
                  style={{
                    maxWidth: '70%',
                    padding: '12px 16px',
                    backgroundColor: isCurrentUser ? colors.primary : colors.white,
                    color: isCurrentUser ? colors.white : colors.textPrimary,
                    borderRadius: borderRadius.md,
                    fontSize: '15px',
                    lineHeight: '1.5',
                    wordWrap: 'break-word',
                  }}
                >
                  {!isCurrentUser && (
                    <div style={{ fontSize: '12px', fontWeight: '600', marginBottom: '4px', opacity: 0.9 }}>
                      {msg.sender.name || 'Seller'}
                    </div>
                  )}
                  <div>{msg.message}</div>
                  <div
                    style={{
                      fontSize: '11px',
                      marginTop: '4px',
                      opacity: 0.7,
                    }}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
                {isCurrentUser && (
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      backgroundColor: colors.bgTertiary,
                      color: colors.textSecondary,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '14px',
                      fontWeight: '600',
                      flexShrink: 0,
                    }}
                  >
                    You
                  </div>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* New Message Alert */}
      {showNewMessageAlert && (
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            backgroundColor: colors.primary,
            color: colors.white,
            padding: '8px 16px',
            borderRadius: borderRadius.full,
            fontSize: '14px',
            fontWeight: '600',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            cursor: 'pointer',
            zIndex: 10,
          }}
          onClick={() => scrollToBottom()}
        >
          {unreadCount} new message{unreadCount > 1 ? 's' : ''} ↓
        </div>
      )}

      {/* Message Input */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          rows={2}
          style={{
            flex: 1,
            padding: '12px',
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.md,
            fontSize: '15px',
            fontFamily: 'inherit',
            resize: 'none',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
        />
        <button
          type="submit"
          disabled={!newMessage.trim() || sending}
          style={{
            padding: '12px 24px',
            backgroundColor: !newMessage.trim() || sending ? colors.gray300 : colors.primary,
            color: colors.white,
            border: 'none',
            borderRadius: borderRadius.md,
            fontSize: '15px',
            fontWeight: '600',
            cursor: !newMessage.trim() || sending ? 'not-allowed' : 'pointer',
            alignSelf: 'flex-end',
          }}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}
