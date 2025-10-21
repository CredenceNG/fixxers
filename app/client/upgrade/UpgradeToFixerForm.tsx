'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { colors, borderRadius, spacing } from '@/lib/theme';

export function UpgradeToFixerForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    reason: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/user/upgrade-to-fixer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit upgrade request');
      }

      // Success! Redirect to fixer profile to complete setup
      router.push('/fixer/profile?upgraded=success');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      {/* Info Card */}
      <div
        style={{
          backgroundColor: colors.primaryLight,
          border: `1px solid ${colors.primary}`,
          borderRadius: borderRadius.lg,
          padding: spacing.xl,
          marginBottom: spacing.xl,
        }}
      >
        <h3 style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '600', color: colors.primaryDark }}>
          🚀 Why Become a Service Provider?
        </h3>
        <ul style={{ margin: 0, padding: '0 0 0 20px', color: colors.textPrimary, lineHeight: '1.8' }}>
          <li>Earn money by offering your skills and services</li>
          <li>Set your own prices and work schedule</li>
          <li>Connect with clients looking for your expertise</li>
          <li>Build your reputation and grow your business</li>
          <li>Access to tools for quotes, orders, and payments</li>
        </ul>
      </div>

      {/* Form Card */}
      <div
        style={{
          backgroundColor: colors.white,
          border: `1px solid ${colors.border}`,
          borderRadius: borderRadius.lg,
          padding: spacing.xl,
        }}
      >
        <h2 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: '600', color: colors.textPrimary }}>
          Upgrade Request
        </h2>
        <p style={{ margin: '0 0 24px 0', fontSize: '14px', color: colors.textSecondary }}>
          Tell us about your skills and experience. An admin will review your request.
        </p>

        {error && (
          <div
            style={{
              backgroundColor: colors.errorLight,
              border: `1px solid ${colors.error}`,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              marginBottom: spacing.lg,
              color: colors.errorDark,
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Reason */}
          <div style={{ marginBottom: spacing.xl }}>
            <label
              htmlFor="reason"
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '600',
                color: colors.textPrimary,
                marginBottom: spacing.sm,
              }}
            >
              Why do you want to become a service provider? *
            </label>
            <textarea
              id="reason"
              required
              rows={5}
              value={formData.reason}
              onChange={(e) => handleChange('reason', e.target.value)}
              placeholder="Tell us about your motivation and what makes you a good fit..."
              style={{
                width: '100%',
                padding: '12px 16px',
                fontSize: '15px',
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                outline: 'none',
                resize: 'vertical',
                fontFamily: 'inherit',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => router.back()}
              disabled={isSubmitting}
              style={{
                padding: '12px 24px',
                backgroundColor: colors.white,
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
                borderRadius: borderRadius.md,
                fontSize: '15px',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '12px 24px',
                backgroundColor: colors.primary,
                color: colors.white,
                border: 'none',
                borderRadius: borderRadius.md,
                fontSize: '15px',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.6 : 1,
              }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>

      {/* Info Note */}
      <div
        style={{
          marginTop: spacing.lg,
          padding: spacing.md,
          backgroundColor: colors.blueLight,
          border: `1px solid #bae6fd`,
          borderRadius: borderRadius.md,
        }}
      >
        <p style={{ margin: 0, fontSize: '14px', color: '#075985', lineHeight: '1.6' }}>
          <strong>📋 Note:</strong> Your request will be reviewed by our admin team. You'll receive a notification once
          your application is approved or if we need additional information.
        </p>
      </div>
    </div>
  );
}
