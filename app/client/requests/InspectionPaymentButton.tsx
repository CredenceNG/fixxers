'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { colors, borderRadius, styles } from '@/lib/theme';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface InspectionPaymentButtonProps {
  quoteId: string;
  inspectionFee: number;
}

function PaymentForm({ quoteId, inspectionFee, onSuccess, onCancel }: {
  quoteId: string;
  inspectionFee: number;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { error: submitError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/client/requests/${quoteId}?payment=inspection_success`,
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || 'Payment failed');
        setLoading(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful, confirm with backend
        const response = await fetch(`/api/client/quotes/${quoteId}/confirm-inspection-payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });

        if (response.ok) {
          onSuccess();
        } else {
          const data = await response.json();
          setError(data.error || 'Failed to confirm payment');
          setLoading(false);
        }
      } else {
        setError('Payment was not successful');
        setLoading(false);
      }
    } catch (err) {
      setError('Something went wrong');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '24px' }}>
        <PaymentElement />
      </div>

      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: '#FEE2E2',
            color: '#DC2626',
            borderRadius: borderRadius.md,
            fontSize: '14px',
            marginBottom: '16px',
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          type="submit"
          disabled={!stripe || loading}
          style={{
            flex: 1,
            padding: '12px 24px',
            backgroundColor: colors.primary,
            color: colors.white,
            border: 'none',
            borderRadius: borderRadius.lg,
            fontSize: '15px',
            fontWeight: '600',
            cursor: loading || !stripe ? 'not-allowed' : 'pointer',
            opacity: loading || !stripe ? 0.6 : 1,
          }}
        >
          {loading ? 'Processing...' : `Pay ₦${inspectionFee.toLocaleString()}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          style={{
            padding: '12px 24px',
            backgroundColor: colors.white,
            color: colors.textPrimary,
            border: `2px solid ${colors.border}`,
            borderRadius: borderRadius.lg,
            fontSize: '15px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export function InspectionPaymentButton({ quoteId, inspectionFee }: InspectionPaymentButtonProps) {
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAcceptInspection = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/client/quotes/${quoteId}/pay-inspection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await response.json();

      if (response.ok && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setShowPaymentModal(true);
      } else {
        setError(data.error || 'Failed to initialize payment');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    // Reload the page to show updated state
    window.location.reload();
  };

  const handleCancel = () => {
    setShowPaymentModal(false);
    setClientSecret(null);
  };

  return (
    <>
      <button
        onClick={handleAcceptInspection}
        disabled={loading}
        style={{
          ...styles.buttonPrimary,
          width: '100%',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
        }}
      >
        {loading ? 'Initializing Payment...' : `Accept & Pay Inspection Fee (₦${inspectionFee.toLocaleString()})`}
      </button>

      {error && (
        <div style={{ marginTop: '12px', padding: '12px', backgroundColor: '#FEE2E2', color: '#DC2626', borderRadius: borderRadius.md, fontSize: '14px' }}>
          {error}
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && clientSecret && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCancel();
          }}
        >
          <div
            style={{
              backgroundColor: colors.white,
              borderRadius: borderRadius.xl,
              padding: '32px',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <h2 style={{ fontSize: '24px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
              Pay Inspection Fee
            </h2>
            <p style={{ fontSize: '15px', color: colors.textSecondary, marginBottom: '24px' }}>
              Complete payment to schedule site inspection
            </p>

            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm
                quoteId={quoteId}
                inspectionFee={inspectionFee}
                onSuccess={handlePaymentSuccess}
                onCancel={handleCancel}
              />
            </Elements>
          </div>
        </div>
      )}
    </>
  );
}
