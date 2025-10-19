'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';
import { DashboardButton } from '@/components/DashboardLayout';

interface FixerActionButtonsProps {
  fixerId: string;
  fixerName: string;
  fixerEmail: string | null;
  status: string;
  hasPendingChanges: boolean;
  wasApproved: boolean;
}

export function FixerActionButtons({
  fixerId,
  fixerName,
  fixerEmail,
  status,
  hasPendingChanges,
  wasApproved,
}: FixerActionButtonsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAdditionalDetailsForm, setShowAdditionalDetailsForm] = useState(false);
  const [additionalDetailsMessage, setAdditionalDetailsMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleApprove = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/approve-fixer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixerId, approved: true }),
      });

      if (!response.ok) {
        throw new Error('Failed to approve fixer');
      }

      setSuccess('Fixer approved successfully!');
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to approve fixer');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!confirm(`Are you sure you want to reject ${fixerName}'s application?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/approve-fixer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixerId, approved: false }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject fixer');
      }

      setSuccess('Fixer rejected successfully!');
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to reject fixer');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAdditionalDetails = async () => {
    if (!additionalDetailsMessage.trim()) {
      setError('Please enter a message');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/admin/fixers/${fixerId}/request-details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: additionalDetailsMessage.trim() }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to request additional details');
      }

      setSuccess('Request sent successfully! Email sent to fixer.');
      setShowAdditionalDetailsForm(false);
      setAdditionalDetailsMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to request additional details');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async () => {
    if (!confirm(`Are you sure you want to suspend ${fixerName}? They will no longer be able to accept jobs.`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/suspend-fixer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to suspend fixer');
      }

      setSuccess('Fixer suspended successfully!');
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to suspend fixer');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    if (!confirm(`Are you sure you want to reactivate ${fixerName}?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/unsuspend-fixer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fixerId }),
      });

      if (!response.ok) {
        throw new Error('Failed to reactivate fixer');
      }

      setSuccess('Fixer reactivated successfully!');
      setTimeout(() => {
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to reactivate fixer');
    } finally {
      setLoading(false);
    }
  };

  // Show suspend button for ACTIVE fixers (without pending changes)
  if (status === 'ACTIVE' && !hasPendingChanges) {
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

        <button
          onClick={handleSuspend}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 24px',
            fontSize: '14px',
            fontWeight: '600',
            color: 'white',
            backgroundColor: loading ? colors.textSecondary : colors.warning,
            border: 'none',
            borderRadius: borderRadius.md,
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? 'Processing...' : 'Suspend Fixer'}
        </button>
      </div>
    );
  }

  // Show reactivate button for suspended fixers (SUSPENDED status OR PENDING + wasApproved)
  if (status === 'SUSPENDED' || (status === 'PENDING' && wasApproved)) {
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

        <div style={{ padding: '16px', backgroundColor: '#FEF5E7', borderRadius: borderRadius.md, marginBottom: '16px', border: '1px solid #F39C12' }}>
          <p style={{ fontSize: '14px', color: '#95620D', fontWeight: '600', margin: 0 }}>
            ⚠️ This fixer has been suspended
          </p>
        </div>

        <button
          onClick={handleUnsuspend}
          disabled={loading}
          style={{
            width: '100%',
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
          {loading ? 'Processing...' : 'Reactivate Fixer'}
        </button>
      </div>
    );
  }

  const showApprovalActions = status === 'PENDING' || hasPendingChanges;
  const isReReview = (status === 'PENDING' && wasApproved) || hasPendingChanges;

  // Show message for rejected fixers
  if (status === 'REJECTED') {
    return (
      <div style={{ padding: '16px', backgroundColor: colors.bgSecondary, borderRadius: borderRadius.md, textAlign: 'center' }}>
        <p style={{ fontSize: '14px', color: colors.textSecondary, margin: 0 }}>
          This fixer has been rejected
        </p>
      </div>
    );
  }

  // Show approval actions for pending fixers
  if (!showApprovalActions) {
    return null;
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
            Message to Fixer
          </label>
          <textarea
            value={additionalDetailsMessage}
            onChange={(e) => setAdditionalDetailsMessage(e.target.value)}
            placeholder="What additional information do you need from the fixer?"
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {isReReview && (
            <div style={{ padding: '12px', backgroundColor: '#E8F4FD', borderRadius: borderRadius.md, marginBottom: '4px', border: '1px solid #2196F3' }}>
              <p style={{ fontSize: '13px', color: '#1565C0', fontWeight: '600', margin: 0 }}>
                ℹ️ This is a re-review. Fixer was previously approved.
              </p>
            </div>
          )}
          <button
            onClick={handleApprove}
            disabled={loading}
            style={{
              width: '100%',
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
            {loading ? 'Processing...' : isReReview ? 'Re-Approve Fixer' : 'Approve Fixer'}
          </button>

          <button
            onClick={handleReject}
            disabled={loading}
            style={{
              width: '100%',
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
            {loading ? 'Processing...' : 'Reject Application'}
          </button>

          <button
            onClick={() => setShowAdditionalDetailsForm(true)}
            disabled={loading}
            style={{
              width: '100%',
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
