'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { colors, borderRadius } from '@/lib/theme';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface AcceptDeliveryButtonProps {
  orderId: string;
  amount: number;
  hasReview: boolean;
}

function PaymentForm({ orderId, amount, onSuccess, onCancel }: { orderId: string; amount: number; onSuccess: () => void; onCancel: () => void }) {
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
          return_url: `${window.location.origin}/client/orders/${orderId}?payment=success`,
        },
        redirect: 'if_required',
      });

      if (submitError) {
        setError(submitError.message || 'Payment failed');
        setLoading(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment successful, complete the order
        const response = await fetch(`/api/orders/${orderId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
        });

        if (response.ok) {
          onSuccess();
        } else {
          const data = await response.json();
          setError(data.error || 'Failed to complete order');
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
            backgroundColor: colors.errorLight,
            color: colors.error,
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
            backgroundColor: colors.success,
            color: colors.white,
            border: 'none',
            borderRadius: borderRadius.md,
            fontSize: '15px',
            fontWeight: '600',
            cursor: !stripe || loading ? 'not-allowed' : 'pointer',
            opacity: !stripe || loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Processing...' : `Pay ₦${amount.toLocaleString()}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 24px',
            backgroundColor: colors.white,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.md,
            fontSize: '15px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function ReviewForm({ orderId, onSuccess }: { orderId: string; onSuccess: () => void }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Please select a rating');
      return;
    }

    if (!comment.trim()) {
      setError('Please provide a review comment');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/orders/${orderId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment.trim() }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.error || 'Failed to submit review');
      }
    } catch (err) {
      setError('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: '24px' }}>
        <label style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary, display: 'block', marginBottom: '12px' }}>
          Rate your experience (1-4 stars) *
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          {[1, 2, 3, 4].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              style={{
                fontSize: '32px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: star <= (hoverRating || rating) ? colors.warning : colors.gray300,
                transition: 'color 0.2s',
              }}
            >
              ★
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <label style={{ fontSize: '15px', fontWeight: '600', color: colors.textPrimary, display: 'block', marginBottom: '8px' }}>
          Review Comment *
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell us about your experience with this service..."
          rows={4}
          style={{
            width: '100%',
            padding: '12px',
            border: `1px solid ${colors.border}`,
            borderRadius: borderRadius.md,
            fontSize: '15px',
            fontFamily: 'inherit',
            resize: 'vertical',
          }}
        />
      </div>

      {error && (
        <div
          style={{
            padding: '12px',
            backgroundColor: colors.errorLight,
            color: colors.error,
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
          disabled={loading}
          style={{
            flex: 1,
            padding: '12px 24px',
            backgroundColor: colors.success,
            color: colors.white,
            border: 'none',
            borderRadius: borderRadius.md,
            fontSize: '15px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Submitting...' : 'Submit Review & Continue'}
        </button>
      </div>
    </form>
  );
}

export function AcceptDeliveryButton({ orderId, amount, hasReview }: AcceptDeliveryButtonProps) {
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAccept = () => {
    if (!hasReview) {
      // Show review form first
      setShowModal(true);
      setShowPayment(false);
    } else {
      // Already has review, go straight to payment
      initializePayment();
    }
  };

  const initializePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}/create-payment-intent`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setClientSecret(data.clientSecret);
        setShowPayment(true);
        setShowModal(true);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to initialize payment');
      }
    } catch (error) {
      alert('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSuccess = () => {
    // Review submitted, now show payment form
    initializePayment();
  };

  const handlePaymentSuccess = () => {
    setShowModal(false);
    router.refresh();
  };

  const handleCancel = () => {
    setShowModal(false);
    setShowPayment(false);
    setClientSecret(null);
  };

  const options = clientSecret ? { clientSecret } : undefined;

  return (
    <>
      <button
        onClick={handleAccept}
        disabled={loading}
        style={{
          padding: '12px 24px',
          backgroundColor: colors.success,
          color: colors.white,
          border: 'none',
          borderRadius: borderRadius.md,
          fontSize: '15px',
          fontWeight: '600',
          cursor: loading ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.6 : 1,
          marginRight: '12px',
        }}
      >
        {loading ? 'Loading...' : 'Accept & Pay'}
      </button>

      {showModal && (
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
          }}
          onClick={handleCancel}
        >
          <div
            style={{
              backgroundColor: colors.white,
              padding: '32px',
              borderRadius: borderRadius.lg,
              maxWidth: '600px',
              width: '90%',
              maxHeight: '90vh',
              overflow: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: colors.textPrimary, marginBottom: '8px' }}>
              {showPayment ? 'Complete Payment' : 'Review Service'}
            </h3>
            <p style={{ fontSize: '15px', color: colors.textSecondary, marginBottom: '24px' }}>
              {showPayment
                ? 'Enter your payment details to release payment to the service provider.'
                : 'Please rate and review the service before proceeding to payment.'}
            </p>

            {showPayment && clientSecret ? (
              <Elements stripe={stripePromise} options={options}>
                <PaymentForm orderId={orderId} amount={amount} onSuccess={handlePaymentSuccess} onCancel={handleCancel} />
              </Elements>
            ) : (
              <ReviewForm orderId={orderId} onSuccess={handleReviewSuccess} />
            )}
          </div>
        </div>
      )}
    </>
  );
}
