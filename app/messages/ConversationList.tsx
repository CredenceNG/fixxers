'use client';

import Link from 'next/link';
import { useState } from 'react';
import { colors } from '@/lib/theme';

interface Conversation {
  otherUserId: string;
  otherUser: {
    id: string;
    name: string | null;
    email: string | null;
  };
  latestMessage: {
    id: string;
    message: string;
    createdAt: Date;
    senderId: string;
    gigId: string | null;
    orderId: string | null;
    requestId: string | null;
    gig?: { id: string; title: string; slug: string } | null;
    order?: { id: string; gig: { title: string } | null; request: { title: string } | null } | null;
    request?: { id: string; title: string } | null;
  };
  unreadCount: number;
}

interface ConversationListProps {
  conversations: Conversation[];
  currentUserId: string;
}

export function ConversationList({ conversations, currentUserId }: ConversationListProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const formatDate = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = (now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return messageDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  if (conversations.length === 0) {
    return (
      <div style={{ padding: '60px 40px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '16px' }}>💬</div>
        <div style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
          No messages yet
        </div>
        <div style={{ fontSize: '14px', color: colors.textSecondary }}>
          When you receive messages from clients or fixers, they'll appear here
        </div>
      </div>
    );
  }

  return (
    <div>
      {conversations.map((conversation) => (
        <Link
          key={conversation.otherUserId}
          href={`/messages/${conversation.otherUserId}`}
          style={{
            display: 'block',
            padding: '20px 24px',
            borderBottom: `1px solid ${colors.border}`,
            textDecoration: 'none',
            backgroundColor:
              hoveredId === conversation.otherUserId
                ? colors.bgSecondary
                : conversation.unreadCount > 0
                ? colors.primaryLight
                : colors.white,
            transition: 'background-color 0.2s',
          }}
          onMouseEnter={() => setHoveredId(conversation.otherUserId)}
          onMouseLeave={() => setHoveredId(null)}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            {/* Avatar */}
            <div
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                backgroundColor: colors.primary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: colors.white,
                fontWeight: '600',
                fontSize: '20px',
                flexShrink: 0,
              }}
            >
              {(conversation.otherUser.name || conversation.otherUser.email || 'U').charAt(0).toUpperCase()}
            </div>

            {/* Message Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <div style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                  {conversation.otherUser.name || conversation.otherUser.email}
                </div>
                <div style={{ fontSize: '13px', color: colors.textSecondary, flexShrink: 0, marginLeft: '12px' }}>
                  {formatDate(conversation.latestMessage.createdAt)}
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    fontSize: '14px',
                    color: conversation.unreadCount > 0 ? colors.textPrimary : colors.textSecondary,
                    fontWeight: conversation.unreadCount > 0 ? '600' : '400',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {conversation.latestMessage.senderId === currentUserId ? 'You: ' : ''}
                  {conversation.latestMessage.message}
                </div>

                {conversation.unreadCount > 0 && (
                  <div
                    style={{
                      minWidth: '24px',
                      height: '24px',
                      borderRadius: '12px',
                      backgroundColor: colors.primary,
                      color: colors.white,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: '700',
                      padding: '0 8px',
                    }}
                  >
                    {conversation.unreadCount}
                  </div>
                )}
              </div>

              {/* Context badge */}
              {(conversation.latestMessage.gig || conversation.latestMessage.order || conversation.latestMessage.request) && (
                <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {conversation.latestMessage.gig && (
                    <>
                      📦 <span style={{ fontWeight: '500' }}>{conversation.latestMessage.gig.title}</span>
                    </>
                  )}
                  {conversation.latestMessage.order && (
                    <>
                      📋 Order: <span style={{ fontWeight: '500' }}>{conversation.latestMessage.order.gig?.title || conversation.latestMessage.order.request?.title || 'Service'}</span>
                    </>
                  )}
                  {conversation.latestMessage.request && !conversation.latestMessage.order && (
                    <>
                      🔧 Request: <span style={{ fontWeight: '500' }}>{conversation.latestMessage.request.title}</span>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
