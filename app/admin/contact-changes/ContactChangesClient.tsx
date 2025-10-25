'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';
import toast from 'react-hot-toast';

interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  pendingEmail: string | null;
  pendingPhone: string | null;
  emailChangeRequested: boolean;
  phoneChangeRequested: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface ContactChangesClientProps {
  users: User[];
}

export default function ContactChangesClient({ users }: ContactChangesClientProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  const handleApprove = async (userId: string) => {
    setLoading(userId);
    try {
      const response = await fetch('/api/admin/contact-changes/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Contact changes approved successfully');
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to approve changes');
      }
    } catch (error) {
      console.error('Approve error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (userId: string) => {
    setLoading(userId);
    try {
      const response = await fetch('/api/admin/contact-changes/reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success('Contact changes rejected');
        router.refresh();
      } else {
        toast.error(data.error || 'Failed to reject changes');
      }
    } catch (error) {
      console.error('Reject error:', error);
      toast.error('Something went wrong');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {users.map((user) => (
        <div
          key={user.id}
          style={{
            backgroundColor: colors.white,
            borderRadius: borderRadius.lg,
            padding: '24px',
            border: `1px solid ${colors.border}`,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '4px' }}>
                {user.name || 'Unknown User'}
              </h3>
              <p style={{ fontSize: '14px', color: colors.textSecondary }}>
                User ID: {user.id}
              </p>
            </div>
            <div style={{
              padding: '6px 12px',
              backgroundColor: '#FEF5E7',
              color: '#7D6608',
              borderRadius: borderRadius.sm,
              fontSize: '12px',
              fontWeight: '600'
            }}>
              PENDING
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
            {user.emailChangeRequested && (
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: colors.textSecondary, marginBottom: '6px', textTransform: 'uppercase' }}>
                  Email Change
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', color: colors.textSecondary }}>Current:</span>
                    <span style={{ fontSize: '14px', color: colors.textPrimary, fontWeight: '500' }}>
                      {user.email || 'Not set'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', color: colors.textSecondary }}>New:</span>
                    <span style={{ fontSize: '14px', color: colors.success, fontWeight: '600' }}>
                      {user.pendingEmail}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {user.phoneChangeRequested && (
              <div>
                <p style={{ fontSize: '12px', fontWeight: '600', color: colors.textSecondary, marginBottom: '6px', textTransform: 'uppercase' }}>
                  Phone Change
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', color: colors.textSecondary }}>Current:</span>
                    <span style={{ fontSize: '14px', color: colors.textPrimary, fontWeight: '500' }}>
                      {user.phone || 'Not set'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', color: colors.textSecondary }}>New:</span>
                    <span style={{ fontSize: '14px', color: colors.success, fontWeight: '600' }}>
                      {user.pendingPhone}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              onClick={() => handleReject(user.id)}
              disabled={loading === user.id}
              style={{
                padding: '10px 20px',
                backgroundColor: 'transparent',
                color: colors.error,
                border: `1px solid ${colors.error}`,
                borderRadius: borderRadius.md,
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading === user.id ? 'not-allowed' : 'pointer',
                opacity: loading === user.id ? 0.6 : 1
              }}
            >
              {loading === user.id ? 'Processing...' : 'Reject'}
            </button>
            <button
              onClick={() => handleApprove(user.id)}
              disabled={loading === user.id}
              style={{
                padding: '10px 20px',
                backgroundColor: colors.success,
                color: colors.white,
                border: 'none',
                borderRadius: borderRadius.md,
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading === user.id ? 'not-allowed' : 'pointer',
                opacity: loading === user.id ? 0.6 : 1
              }}
            >
              {loading === user.id ? 'Processing...' : 'Approve'}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
