'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import Link from 'next/link';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

function PaymentForm({ requestId }: { requestId: string }) {
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
                    // Redirect to request detail page
                    router.push(`/fixer/badges/requests/${requestId}?payment=success`);
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
                <Link
                    href="/fixer/badges"
                    className="flex-1 px-6 py-3 text-center border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium rounded-lg transition-colors"
                >
                    Cancel
                </Link>
                <button
                    type="submit"
                    disabled={!stripe || processing}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    {processing ? 'Processing...' : 'Pay Now'}
                </button>
            </div>
        </form>
    );
}

function formatPrice(kobo: number): string {
    const naira = kobo / 100;
    return `₦${naira.toLocaleString('en-NG')}`;
}

export default function BadgePaymentClient({ requestId }: { requestId: string }) {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [request, setRequest] = useState<any>(null);
    const [clientSecret, setClientSecret] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!requestId) return;
        fetchRequest();
    }, [requestId]);

    async function fetchRequest() {
        try {
            const response = await fetch(`/api/badge-requests/${requestId}`);
            const data = await response.json();

            if (data.success) {
                setRequest(data.request);

                // Check if payment already completed
                if (data.request.paymentStatus === 'PAID') {
                    router.push(`/fixer/badges/requests/${requestId}?payment=already-paid`);
                    return;
                }

                // Get payment intent client secret if not already stored
                if (data.request.clientSecret) {
                    setClientSecret(data.request.clientSecret);
                } else {
                    setError('Payment session expired. Please create a new request.');
                }
            } else {
                setError(data.error || 'Failed to load request');
            }
        } catch (err) {
            setError('Failed to load request');
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading payment details...</p>
                </div>
            </div>
        );
    }

    if (error && !request) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="max-w-md w-full bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-center">
                        <div className="text-5xl mb-4">❌</div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Error</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <Link
                            href="/fixer/badges"
                            className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                        >
                            Back to Badges
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (!clientSecret) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-5xl mb-4">⚠️</div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Session Expired</h2>
                    <p className="text-gray-600 mb-6">Please create a new badge request</p>
                    <Link
                        href="/fixer/badges"
                        className="inline-block px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700"
                    >
                        Back to Badges
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-md mx-auto px-4">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    {/* Header */}
                    <div className="text-center mb-6">
                        <div className="text-5xl mb-4">{request?.badge?.icon || '🏅'}</div>
                        <h1 className="text-2xl font-bold text-gray-900">{request?.badge?.name}</h1>
                        <p className="text-gray-600 mt-2">Complete your badge verification payment</p>
                    </div>

                    {/* Payment Amount */}
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">Amount</span>
                            <span className="text-2xl font-bold text-gray-900">
                                {formatPrice(request?.paymentAmount || 0)}
                            </span>
                        </div>
                    </div>

                    {/* Stripe Payment Form */}
                    <Elements stripe={stripePromise} options={{ clientSecret }}>
                        <PaymentForm requestId={requestId} />
                    </Elements>

                    {/* Security Notice */}
                    <p className="text-xs text-center text-gray-500 mt-6">
                        🔒 Payments are processed securely through Stripe
                    </p>
                </div>
            </div>
        </div>
    );
}
