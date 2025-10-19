'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';

interface DisputeResolutionFormProps {
  disputeId: string;
  orderId: string;
  totalAmount: number;
  fixerAmount: number;
}

export default function DisputeResolutionForm({
  disputeId,
  orderId,
  totalAmount,
  fixerAmount,
}: DisputeResolutionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    status: 'UNDER_REVIEW',
    resolution: '',
    refundAmount: 0,
    releaseTo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resolve dispute');
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to resolve dispute');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (newStatus === formData.status) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/admin/disputes/${disputeId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          resolution: `Status updated to ${newStatus.replace(/_/g, ' ')}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update status');
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: colors.white,
      padding: '24px',
      borderRadius: borderRadius.lg,
      border: `1px solid ${colors.border}`,
      marginBottom: '32px',
    }}>
      <h2 style={{ fontSize: '18px', fontWeight: '600', color: colors.textPrimary, marginBottom: '16px' }}>
        Resolve Dispute
      </h2>

      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: colors.errorLight,
          borderRadius: borderRadius.md,
          marginBottom: '16px',
          border: `1px solid ${colors.error}`,
        }}>
          <p style={{ fontSize: '14px', color: colors.error, margin: 0 }}>
            {error}
          </p>
        </div>
      )}

      {/* Quick Status Update Buttons */}
      <div style={{ marginBottom: '24px' }}>
        <p style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '8px' }}>
          Quick Status Update
        </p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleUpdateStatus('UNDER_REVIEW')}
            disabled={loading || formData.status === 'UNDER_REVIEW'}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              color: formData.status === 'UNDER_REVIEW' ? colors.white : '#2196F3',
              backgroundColor: formData.status === 'UNDER_REVIEW' ? '#2196F3' : colors.white,
              border: `2px solid #2196F3`,
              borderRadius: borderRadius.md,
              cursor: loading || formData.status === 'UNDER_REVIEW' ? 'not-allowed' : 'pointer',
              opacity: loading || formData.status === 'UNDER_REVIEW' ? 0.6 : 1,
            }}
          >
            Mark Under Review
          </button>
          <button
            onClick={() => handleUpdateStatus('ESCALATED')}
            disabled={loading || formData.status === 'ESCALATED'}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '600',
              color: formData.status === 'ESCALATED' ? colors.white : colors.error,
              backgroundColor: formData.status === 'ESCALATED' ? colors.error : colors.white,
              border: `2px solid ${colors.error}`,
              borderRadius: borderRadius.md,
              cursor: loading || formData.status === 'ESCALATED' ? 'not-allowed' : 'pointer',
              opacity: loading || formData.status === 'ESCALATED' ? 0.6 : 1,
            }}
          >
            Escalate
          </button>
        </div>
      </div>

      {/* Resolution Form */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: colors.textPrimary,
            marginBottom: '8px',
          }}>
            Final Status *
          </label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            required
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '15px',
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              outline: 'none',
              backgroundColor: colors.white,
            }}
          >
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
            <option value="ESCALATED">Escalated</option>
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: colors.textPrimary,
            marginBottom: '8px',
          }}>
            Resolution Details *
          </label>
          <textarea
            value={formData.resolution}
            onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
            required
            rows={4}
            placeholder="Explain the resolution decision, actions taken, and outcome..."
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '15px',
              border: `1px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              outline: 'none',
              fontFamily: 'inherit',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Payment Adjustment Section */}
        <div style={{
          padding: '16px',
          backgroundColor: colors.bgSecondary,
          borderRadius: borderRadius.md,
          marginBottom: '20px',
        }}>
          <p style={{ fontSize: '14px', fontWeight: '600', color: colors.textPrimary, marginBottom: '12px' }}>
            Payment Adjustment (Optional)
          </p>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: colors.textPrimary,
              marginBottom: '8px',
            }}>
              Refund/Release Amount (₦)
            </label>
            <input
              type="number"
              min="0"
              max={totalAmount}
              step="0.01"
              value={formData.refundAmount}
              onChange={(e) => setFormData({ ...formData, refundAmount: parseFloat(e.target.value) || 0 })}
              placeholder="0.00"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '15px',
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                outline: 'none',
              }}
            />
            <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
              Max: ₦{totalAmount.toLocaleString()}
            </p>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '600',
              color: colors.textPrimary,
              marginBottom: '8px',
            }}>
              Release To
            </label>
            <select
              value={formData.releaseTo}
              onChange={(e) => setFormData({ ...formData, releaseTo: e.target.value })}
              disabled={formData.refundAmount === 0}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '15px',
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                outline: 'none',
                backgroundColor: formData.refundAmount === 0 ? colors.bgSecondary : colors.white,
                cursor: formData.refundAmount === 0 ? 'not-allowed' : 'default',
              }}
            >
              <option value="">Select recipient...</option>
              <option value="CLIENT">Refund to Client</option>
              <option value="FIXER">Release to Fixer</option>
              <option value="PARTIAL">Partial Split</option>
            </select>
          </div>

          <div style={{
            marginTop: '12px',
            padding: '12px',
            backgroundColor: '#FFF3CD',
            borderRadius: borderRadius.md,
            border: '1px solid #FFC107',
          }}>
            <p style={{ fontSize: '13px', color: '#856404', margin: 0 }}>
              ⚠️ Payment adjustments will be processed separately. Make sure to document the decision in the resolution details.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="submit"
            disabled={loading || !formData.resolution.trim()}
            style={{
              padding: '12px 32px',
              fontSize: '15px',
              fontWeight: '600',
              color: colors.white,
              backgroundColor: loading || !formData.resolution.trim() ? colors.textSecondary : colors.success,
              border: 'none',
              borderRadius: borderRadius.md,
              cursor: loading || !formData.resolution.trim() ? 'not-allowed' : 'pointer',
              opacity: loading || !formData.resolution.trim() ? 0.6 : 1,
            }}
          >
            {loading ? 'Saving...' : 'Save Resolution'}
          </button>
        </div>
      </form>
    </div>
  );
}
