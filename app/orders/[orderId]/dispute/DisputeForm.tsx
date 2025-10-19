'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius } from '@/lib/theme';

interface DisputeFormProps {
  orderId: string;
}

const DISPUTE_REASONS = [
  { value: 'QUALITY_ISSUES', label: 'Quality Issues - Work not up to standard' },
  { value: 'INCOMPLETE_WORK', label: 'Incomplete Work - Service not fully delivered' },
  { value: 'OVERCHARGING', label: 'Overcharging - Price doesn\'t match agreement' },
  { value: 'PAYMENT_DISPUTE', label: 'Payment Dispute - Payment issues' },
  { value: 'TIMELINE_ISSUES', label: 'Timeline Issues - Delays or missed deadlines' },
  { value: 'COMMUNICATION_ISSUES', label: 'Communication Issues - Poor responsiveness' },
  { value: 'SCOPE_DISAGREEMENT', label: 'Scope Disagreement - Work doesn\'t match agreement' },
  { value: 'OTHER', label: 'Other - Please explain in description' },
];

export default function DisputeForm({ orderId }: DisputeFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/orders/${orderId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to file dispute');
      }

      // Redirect to order page
      router.push(`/orders/${orderId}?disputeFiled=true`);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to file dispute');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      backgroundColor: colors.white,
      padding: '32px',
      borderRadius: borderRadius.lg,
      border: `1px solid ${colors.border}`,
    }}>
      <div style={{
        padding: '16px',
        backgroundColor: colors.warningLight,
        borderRadius: borderRadius.md,
        marginBottom: '24px',
        borderLeft: `4px solid ${colors.warning}`,
      }}>
        <p style={{ fontSize: '14px', color: colors.warningDark, margin: 0, lineHeight: '1.6' }}>
          ⚠️ <strong>Important:</strong> Filing a dispute will pause the order and notify an administrator to review the case.
          Please provide detailed information to help us resolve this matter fairly.
        </p>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          backgroundColor: colors.errorLight,
          borderRadius: borderRadius.md,
          marginBottom: '24px',
          border: `1px solid ${colors.error}`,
        }}>
          <p style={{ fontSize: '14px', color: colors.error, margin: 0 }}>
            {error}
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: colors.textPrimary,
            marginBottom: '8px',
          }}>
            Reason for Dispute *
          </label>
          <select
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
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
            <option value="">Select a reason...</option>
            {DISPUTE_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '600',
            color: colors.textPrimary,
            marginBottom: '8px',
          }}>
            Description *
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            rows={6}
            placeholder="Please provide a detailed description of the issue, including dates, specific problems, and any attempts to resolve it with the other party..."
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
          <p style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '8px', margin: 0 }}>
            Minimum 50 characters required
          </p>
        </div>

        <div style={{
          padding: '16px',
          backgroundColor: colors.bgSecondary,
          borderRadius: borderRadius.md,
          marginBottom: '24px',
        }}>
          <p style={{ fontSize: '14px', color: colors.textPrimary, fontWeight: '600', marginBottom: '8px' }}>
            What happens next?
          </p>
          <ul style={{ fontSize: '14px', color: colors.textSecondary, margin: 0, paddingLeft: '20px', lineHeight: '1.8' }}>
            <li>An administrator will review your dispute within 24-48 hours</li>
            <li>Both parties will be able to communicate via the dispute messaging system</li>
            <li>You may be asked to provide additional evidence or information</li>
            <li>The administrator will make a fair decision based on all evidence provided</li>
            <li>Payment may be held, refunded, or released based on the resolution</li>
          </ul>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => router.back()}
            disabled={loading}
            style={{
              padding: '12px 24px',
              fontSize: '15px',
              fontWeight: '600',
              color: colors.textPrimary,
              backgroundColor: colors.white,
              border: `2px solid ${colors.border}`,
              borderRadius: borderRadius.md,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || formData.description.length < 50}
            style={{
              padding: '12px 32px',
              fontSize: '15px',
              fontWeight: '600',
              color: colors.white,
              backgroundColor: loading || formData.description.length < 50 ? colors.textSecondary : colors.error,
              border: 'none',
              borderRadius: borderRadius.md,
              cursor: loading || formData.description.length < 50 ? 'not-allowed' : 'pointer',
              opacity: loading || formData.description.length < 50 ? 0.6 : 1,
            }}
          >
            {loading ? 'Filing Dispute...' : 'File Dispute'}
          </button>
        </div>
      </form>
    </div>
  );
}
