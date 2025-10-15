'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';

interface RequestActionButtonsProps {
  requestId: string;
  status: string;
  clientEmail: string;
  clientName: string;
  adminApproved: boolean;
}

export function RequestActionButtons({
  requestId,
  status,
  clientEmail,
  clientName,
  adminApproved,
}: RequestActionButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAdditionalDetailsForm, setShowAdditionalDetailsForm] = useState(false);
  const [additionalDetailsMessage, setAdditionalDetailsMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleApprove = async () => {
    if (!confirm(`Are you sure you want to approve this request from ${clientName}?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/requests/${requestId}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to approve request');
      }

      setSuccess('Request approved successfully! Email sent to client.');
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to approve request');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt(`Why are you rejecting this request from ${clientName}?\n\nThis reason will be sent to the client via email:`);

    if (!reason || reason.trim() === '') {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/requests/${requestId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to reject request');
      }

      setSuccess('Request rejected successfully! Email sent to client.');
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to reject request');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAdditionalDetails = async () => {
    if (!additionalDetailsMessage.trim()) {
      setError('Please enter a message requesting additional details');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/requests/${requestId}/request-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: additionalDetailsMessage.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to request additional details');
      }

      setSuccess('Request sent successfully! Email sent to client.');
      setShowAdditionalDetailsForm(false);
      setAdditionalDetailsMessage('');
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to request additional details');
    } finally {
      setLoading(false);
    }
  };

  // If already approved, show message
  if (adminApproved) {
    return (
      <div style={{ padding: '16px', backgroundColor: colors.successLight, borderRadius: borderRadius.md, border: `1px solid ${colors.success}` }}>
        <p style={{ fontSize: '14px', color: colors.success, fontWeight: '600', margin: 0 }}>
          ✓ This request has been approved
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Messages */}
      {error && (
        <div style={{ padding: '12px', backgroundColor: colors.errorLight, borderRadius: borderRadius.md, border: `1px solid ${colors.error}`, marginBottom: '16px' }}>
          <p style={{ fontSize: '14px', color: colors.error, margin: 0 }}>{error}</p>
        </div>
      )}
      {success && (
        <div style={{ padding: '12px', backgroundColor: colors.successLight, borderRadius: borderRadius.md, border: `1px solid ${colors.success}`, marginBottom: '16px' }}>
          <p style={{ fontSize: '14px', color: colors.success, margin: 0 }}>{success}</p>
        </div>
      )}

      {/* Additional Details Form */}
      {showAdditionalDetailsForm ? (
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
            Message to Client
          </label>
          <textarea
            value={additionalDetailsMessage}
            onChange={(e) => setAdditionalDetailsMessage(e.target.value)}
            placeholder="What additional information do you need from the client?"
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
          <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
            <button
              onClick={handleRequestAdditionalDetails}
              disabled={loading || !additionalDetailsMessage.trim()}
              style={{
                flex: 1,
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                color: 'white',
                backgroundColor: loading || !additionalDetailsMessage.trim() ? colors.textSecondary : colors.primary,
                border: 'none',
                borderRadius: borderRadius.md,
                cursor: loading || !additionalDetailsMessage.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Sending...' : 'Send Request'}
            </button>
            <button
              onClick={() => {
                setShowAdditionalDetailsForm(false);
                setAdditionalDetailsMessage('');
                setError('');
              }}
              disabled={loading}
              style={{
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: '600',
                color: colors.textPrimary,
                backgroundColor: 'white',
                border: `2px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleApprove}
            disabled={loading}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: loading ? colors.textSecondary : colors.success,
              border: 'none',
              borderRadius: borderRadius.md,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Processing...' : '✓ Approve'}
          </button>

          <button
            onClick={handleReject}
            disabled={loading}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              color: 'white',
              backgroundColor: loading ? colors.textSecondary : colors.error,
              border: 'none',
              borderRadius: borderRadius.md,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Processing...' : '✗ Reject'}
          </button>

          <button
            onClick={() => setShowAdditionalDetailsForm(true)}
            disabled={loading}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              color: colors.primary,
              backgroundColor: 'white',
              border: `2px solid ${colors.primary}`,
              borderRadius: borderRadius.md,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            Request Additional Details
          </button>
        </div>
      )}
    </div>
  );
}
