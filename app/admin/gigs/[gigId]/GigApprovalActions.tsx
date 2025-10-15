'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { colors, borderRadius } from '@/lib/theme';

export function GigApprovalActions({
  gigId,
  currentStatus,
  sellerEmail,
  sellerName,
}: {
  gigId: string;
  currentStatus: string;
  sellerEmail?: string;
  sellerName?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAdditionalDetailsForm, setShowAdditionalDetailsForm] = useState(false);
  const [additionalDetailsMessage, setAdditionalDetailsMessage] = useState('');

  const handleApprove = async () => {
    if (!confirm('Approve this service offer? It will become visible to clients.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gigs/${gigId}/approve`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to approve gig');
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (error: any) {
      alert(error.message);
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Please provide a reason for rejection:');
    if (!reason) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gigs/${gigId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to reject gig');
      }

      router.push('/admin/dashboard');
      router.refresh();
    } catch (error: any) {
      alert(error.message);
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!confirm('Suspend this service offer? It will no longer be visible to clients.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gigs/${gigId}/suspend`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to suspend gig');
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message);
      setLoading(false);
    }
  };

  const handleResume = async () => {
    if (!confirm('Resume this service offer? It will become visible to clients again.')) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gigs/${gigId}/resume`, {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to resume gig');
      }

      router.refresh();
    } catch (error: any) {
      alert(error.message);
      setLoading(false);
    }
  };

  const handleRequestAdditionalDetails = async () => {
    if (!additionalDetailsMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gigs/${gigId}/request-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: additionalDetailsMessage }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to send request');
      }

      alert('Request sent successfully!');
      setShowAdditionalDetailsForm(false);
      setAdditionalDetailsMessage('');
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Show approve/reject for pending gigs
  if (currentStatus === 'PENDING_REVIEW') {
    if (showAdditionalDetailsForm) {
      return (
        <div style={{ width: '100%', maxWidth: '500px' }}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
              Request Additional Details from {sellerName || 'Seller'}
            </label>
            <textarea
              value={additionalDetailsMessage}
              onChange={(e) => setAdditionalDetailsMessage(e.target.value)}
              placeholder="What additional information do you need from the seller?"
              rows={4}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '14px',
                border: `2px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                outline: 'none',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => {
                setShowAdditionalDetailsForm(false);
                setAdditionalDetailsMessage('');
              }}
              disabled={loading}
              style={{
                padding: '10px 20px',
                backgroundColor: colors.white,
                color: colors.textSecondary,
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleRequestAdditionalDetails}
              disabled={loading || !additionalDetailsMessage.trim()}
              style={{
                padding: '10px 20px',
                backgroundColor: colors.primary,
                color: colors.white,
                border: 'none',
                borderRadius: borderRadius.md,
                fontSize: '14px',
                fontWeight: '600',
                cursor: loading || !additionalDetailsMessage.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !additionalDetailsMessage.trim() ? 0.5 : 1,
              }}
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleReject}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: colors.white,
            color: colors.error,
            border: `1px solid ${colors.error}`,
            borderRadius: borderRadius.md,
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          Reject
        </button>
        <button
          onClick={() => setShowAdditionalDetailsForm(true)}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: colors.white,
            color: colors.primary,
            border: `1px solid ${colors.primary}`,
            borderRadius: borderRadius.md,
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          Request Details
        </button>
        <button
          onClick={handleApprove}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: colors.success,
            color: colors.white,
            border: 'none',
            borderRadius: borderRadius.md,
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? 'Processing...' : 'Approve'}
        </button>
      </div>
    );
  }

  // Show suspend for active gigs
  if (currentStatus === 'ACTIVE') {
    return (
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleSuspend}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: colors.white,
            color: colors.warning,
            border: `1px solid ${colors.warning}`,
            borderRadius: borderRadius.md,
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? 'Processing...' : 'Suspend'}
        </button>
      </div>
    );
  }

  // Show resume for paused gigs
  if (currentStatus === 'PAUSED') {
    return (
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleResume}
          disabled={loading}
          style={{
            padding: '10px 20px',
            backgroundColor: colors.success,
            color: colors.white,
            border: 'none',
            borderRadius: borderRadius.md,
            fontSize: '14px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.5 : 1,
          }}
        >
          {loading ? 'Processing...' : 'Resume'}
        </button>
      </div>
    );
  }

  return null;
}
