'use client';

import { useState } from 'react';
import { colors, borderRadius, spacing } from '@/lib/theme';

export type PaymentProvider = 'stripe' | 'paystack';

interface PaymentProviderSelectorProps {
  orderId: string;
  amount: number;
  onProviderSelect?: (provider: PaymentProvider) => void;
  defaultProvider?: PaymentProvider;
}

export function PaymentProviderSelector({
  orderId,
  amount,
  onProviderSelect,
  defaultProvider = 'paystack', // Default to Paystack for Nigerian market
}: PaymentProviderSelectorProps) {
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>(defaultProvider);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleProviderChange = (provider: PaymentProvider) => {
    setSelectedProvider(provider);
    onProviderSelect?.(provider);
  };

  const handlePaymentInitiation = async () => {
    setIsProcessing(true);
    setError('');

    try {
      if (selectedProvider === 'paystack') {
        // Initialize Paystack payment
        const response = await fetch(`/api/orders/${orderId}/create-paystack-payment`, {
          method: 'POST',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to initialize Paystack payment');
        }

        // Redirect to Paystack payment page
        window.location.href = data.authorization_url;
      } else {
        // Initialize Stripe payment
        const response = await fetch(`/api/orders/${orderId}/create-payment-intent`, {
          method: 'POST',
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to initialize Stripe payment');
        }

        // The existing Stripe payment flow will handle the redirect
        window.location.href = `/client/orders/${orderId}/pay?provider=stripe`;
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: spacing.lg, color: colors.textPrimary }}>
        Select Payment Method
      </h3>

      {error && (
        <div
          style={{
            backgroundColor: colors.errorLight,
            border: `1px solid ${colors.error}`,
            borderRadius: borderRadius.md,
            padding: spacing.md,
            marginBottom: spacing.lg,
            color: colors.error,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gap: spacing.md, marginBottom: spacing.xl }}>
        {/* Paystack Option (Recommended for Nigerian market) */}
        <button
          onClick={() => handleProviderChange('paystack')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing.lg,
            border: `2px solid ${selectedProvider === 'paystack' ? colors.primary : colors.border}`,
            borderRadius: borderRadius.lg,
            backgroundColor: selectedProvider === 'paystack' ? colors.primaryLight : colors.white,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: `2px solid ${selectedProvider === 'paystack' ? colors.primary : colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selectedProvider === 'paystack' && (
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: colors.primary,
                  }}
                />
              )}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                Paystack
                <span
                  style={{
                    marginLeft: spacing.sm,
                    fontSize: '12px',
                    fontWeight: '600',
                    color: colors.success,
                    backgroundColor: colors.successLight,
                    padding: '2px 8px',
                    borderRadius: borderRadius.full,
                  }}
                >
                  RECOMMENDED
                </span>
              </div>
              <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
                Card, Bank Transfer, USSD, Mobile Money
              </div>
              <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                Lower fees • Higher success rates for Nigerian cards
              </div>
            </div>
          </div>
          <div style={{ fontSize: '24px' }}>💳</div>
        </button>

        {/* Stripe Option */}
        <button
          onClick={() => handleProviderChange('stripe')}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: spacing.lg,
            border: `2px solid ${selectedProvider === 'stripe' ? colors.primary : colors.border}`,
            borderRadius: borderRadius.lg,
            backgroundColor: selectedProvider === 'stripe' ? colors.primaryLight : colors.white,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.md }}>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: `2px solid ${selectedProvider === 'stripe' ? colors.primary : colors.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {selectedProvider === 'stripe' && (
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    backgroundColor: colors.primary,
                  }}
                />
              )}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>
                Stripe
              </div>
              <div style={{ fontSize: '13px', color: colors.textSecondary, marginTop: '4px' }}>
                International Cards
              </div>
              <div style={{ fontSize: '12px', color: colors.textSecondary, marginTop: '2px' }}>
                Best for international payments
              </div>
            </div>
          </div>
          <div style={{ fontSize: '24px' }}>💰</div>
        </button>
      </div>

      {/* Payment Summary */}
      <div
        style={{
          backgroundColor: colors.bgSecondary,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          marginBottom: spacing.xl,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <span style={{ color: colors.textSecondary }}>Amount</span>
          <span style={{ fontWeight: '600', color: colors.textPrimary }}>₦{amount.toLocaleString()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <span style={{ color: colors.textSecondary }}>Payment Method</span>
          <span style={{ fontWeight: '600', color: colors.textPrimary }}>
            {selectedProvider === 'paystack' ? 'Paystack' : 'Stripe'}
          </span>
        </div>
        <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: spacing.sm, marginTop: spacing.sm }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '16px', fontWeight: '600', color: colors.textPrimary }}>Total</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: colors.primary }}>
              ₦{amount.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Pay Button */}
      <button
        onClick={handlePaymentInitiation}
        disabled={isProcessing}
        style={{
          width: '100%',
          padding: spacing.lg,
          backgroundColor: isProcessing ? colors.textSecondary : colors.primary,
          color: colors.white,
          fontSize: '16px',
          fontWeight: '600',
          border: 'none',
          borderRadius: borderRadius.lg,
          cursor: isProcessing ? 'not-allowed' : 'pointer',
          transition: 'background-color 0.2s',
        }}
      >
        {isProcessing ? 'Processing...' : `Pay ₦${amount.toLocaleString()} with ${selectedProvider === 'paystack' ? 'Paystack' : 'Stripe'}`}
      </button>

      <div style={{ textAlign: 'center', marginTop: spacing.lg, fontSize: '13px', color: colors.textSecondary }}>
        🔒 Your payment is secure and encrypted
      </div>
    </div>
  );
}
