'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface BadgePaymentButtonProps {
    requestId: string;
    amount: number;
    badgeName: string;
    badgeIcon: string;
}

function formatPrice(kobo: number): string {
    const naira = kobo / 100;
    return `₦${naira.toLocaleString('en-NG')}`;
}

function PaymentModal({
    requestId,
    amount,
    badgeName,
    badgeIcon,
    clientSecret,
    onClose
}: {
    requestId: string;
    amount: number;
    badgeName: string;
    badgeIcon: string;
    clientSecret: string;
    onClose: () => void;
}) {
    const router = useRouter();
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!stripe || !elements) {
            setError('Payment system not loaded');
            return;
        }

        setProcessing(true);
        setError('');

        try {
            // Confirm payment with Stripe
            const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: `${window.location.origin}/fixer/badges/requests/${requestId}?payment=success`,
                },
                redirect: 'if_required',
            });

            if (confirmError) {
                setError(confirmError.message || 'Payment failed');
                setProcessing(false);
                return;
            }

            if (paymentIntent && paymentIntent.status === 'succeeded') {
                // Confirm with backend
                const confirmResponse = await fetch(`/api/badge-requests/${requestId}/confirm-payment`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paymentIntentId: paymentIntent.id }),
                });

                const confirmData = await confirmResponse.json();

                if (confirmData.success) {
                    // Close modal and refresh page
                    onClose();
                    router.refresh();
                } else {
                    setError(confirmData.error || 'Failed to confirm payment');
                    setProcessing(false);
                }
            } else {
                setError('Payment was not successful');
                setProcessing(false);
            }
        } catch (err) {
            console.error('Payment error:', err);
            setError('Payment processing failed');
            setProcessing(false);
        }
    }

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex min-h-screen items-center justify-center p-4">
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
                    onClick={onClose}
                />

                {/* Modal */}
                <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        disabled={processing}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="text-5xl mb-3">{badgeIcon}</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{badgeName}</h2>
                        <p className="text-gray-600">Complete your badge verification payment</p>
                    </div>

                    {/* Amount */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 font-medium">Total Amount</span>
                            <span className="text-2xl font-bold text-gray-900">
                                {formatPrice(amount)}
                            </span>
                        </div>
                    </div>

                    {/* Payment Form */}
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <PaymentElement />
                        </div>

                        {error && (
                            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={processing}
                                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!stripe || processing}
                                className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                {processing ? 'Processing...' : 'Pay Now'}
                            </button>
                        </div>
                    </form>

                    {/* Security Notice */}
                    <p className="text-xs text-center text-gray-500 mt-4">
                        🔒 Payments are processed securely through Stripe
                    </p>
                </div>
            </div>
        </div>
    );
}

export function BadgePaymentButton({ requestId, amount, badgeName, badgeIcon }: BadgePaymentButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [clientSecret, setClientSecret] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    async function handlePayClick() {
        setLoading(true);
        setError('');

        try {
            // Fetch the badge request to get the clientSecret
            const response = await fetch(`/api/badge-requests/${requestId}`);
            const data = await response.json();

            if (data.success && data.request.clientSecret) {
                setClientSecret(data.request.clientSecret);
                setShowModal(true);
            } else {
                setError('Payment session not found. Please try again.');
            }
        } catch (err) {
            console.error('Error fetching payment details:', err);
            setError('Failed to load payment details');
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <button
                onClick={handlePayClick}
                disabled={loading}
                className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {loading ? 'Loading...' : 'Complete Payment'}
            </button>

            {error && (
                <p className="mt-2 text-sm text-red-600">{error}</p>
            )}

            {showModal && clientSecret && (
                <Elements stripe={stripePromise} options={{ clientSecret }}>
                    <PaymentModal
                        requestId={requestId}
                        amount={amount}
                        badgeName={badgeName}
                        badgeIcon={badgeIcon}
                        clientSecret={clientSecret}
                        onClose={() => setShowModal(false)}
                    />
                </Elements>
            )}
        </>
    );
}
