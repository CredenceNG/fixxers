'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { styles, colors } from '@/lib/theme';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface AcceptQuoteButtonProps {
  quoteId: string;
  requiresDownPayment: boolean;
  downPaymentAmount?: number | null;
  requestId: string;
}

function PaymentForm({ quoteId, requestId }: { quoteId: string; requestId: string }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message || 'An error occurred');
      setProcessing(false);
      return;
    }

    const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message || 'Payment failed');
      setProcessing(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Payment successful - confirm with backend
      try {
        const response = await fetch(`/api/client/quotes/${quoteId}/confirm-acceptance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });

        if (response.ok) {
          router.push(`/client/requests/${requestId}`);
          router.refresh();
        } else {
          const data = await response.json();
          setError(data.error || 'Failed to confirm acceptance');
        }
      } catch (err) {
        setError('An error occurred while confirming');
      }
    }

    setProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '16px' }}>
        <PaymentElement />
      </div>
      {error && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#FEE2E2', borderRadius: '8px' }}>
          <p style={{ fontSize: '14px', color: '#DC2626', margin: 0 }}>{error}</p>
        </div>
      )}
      <button
        type="submit"
        disabled={!stripe || processing}
        style={{
          ...styles.buttonPrimary,
          width: '100%',
          cursor: (!stripe || processing) ? 'not-allowed' : 'pointer',
          opacity: (!stripe || processing) ? 0.6 : 1,
        }}
      >
        {processing ? 'Processing...' : 'Complete Payment'}
      </button>
    </form>
  );
}

export function AcceptQuoteButton({ quoteId, requiresDownPayment, downPaymentAmount, requestId }: AcceptQuoteButtonProps) {
  const router = useRouter();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  const handleAcceptQuote = async () => {
    setAccepting(true);
    setError(null);

    try {
      const response = await fetch(`/api/client/quotes/${quoteId}/accept`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to accept quote');
        setAccepting(false);
        return;
      }

      if (data.requiresPayment && data.clientSecret) {
        // Show payment modal
        setClientSecret(data.clientSecret);
        setShowPaymentModal(true);
        setAccepting(false);
      } else {
        // No payment required - redirect to request page
        router.push(data.redirectTo || `/client/requests/${requestId}`);
        router.refresh();
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setAccepting(false);
    }
  };

  return (
    <>
      {error && (
        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#FEE2E2', borderRadius: '8px' }}>
          <p style={{ fontSize: '14px', color: '#DC2626', margin: 0 }}>{error}</p>
        </div>
      )}
      <button
        onClick={handleAcceptQuote}
        disabled={accepting}
        style={{
          ...styles.buttonPrimary,
          width: '100%',
          cursor: accepting ? 'not-allowed' : 'pointer',
          opacity: accepting ? 0.6 : 1,
        }}
      >
        {accepting
          ? 'Processing...'
          : requiresDownPayment
            ? `Accept & Pay Down Payment (₦${downPaymentAmount?.toLocaleString()})`
            : 'Accept Quote'}
      </button>

      {/* Payment Modal */}
      {showPaymentModal && clientSecret && (
        <div style={{
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
          padding: '20px',
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '32px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, margin: 0 }}>
                Pay Down Payment
              </h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: colors.textSecondary,
                  padding: '0',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ×
              </button>
            </div>
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#F3F4F6', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', color: colors.textSecondary, marginBottom: '4px' }}>Down Payment Amount</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: colors.primary }}>
                ₦{downPaymentAmount?.toLocaleString()}
              </div>
            </div>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <PaymentForm quoteId={quoteId} requestId={requestId} />
            </Elements>
          </div>
        </div>
      )}
    </>
  );
}
