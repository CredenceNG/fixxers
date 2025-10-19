import axios from 'axios';

// Paystack API configuration
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

// Helper to check if Paystack is configured
export function isPaystackConfigured(): boolean {
  return !!PAYSTACK_SECRET_KEY;
}

// Helper to require Paystack configuration
export function requirePaystack() {
  if (!PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack is not configured. Please set PAYSTACK_SECRET_KEY environment variable.');
  }
}

// Paystack API client
const paystackClient = axios.create({
  baseURL: PAYSTACK_BASE_URL,
  headers: {
    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json',
  },
});

// Types
export interface PaystackInitializePaymentParams {
  email: string;
  amount: number; // in kobo (smallest currency unit)
  reference?: string;
  callback_url?: string;
  metadata?: Record<string, any>;
  channels?: string[]; // e.g., ['card', 'bank', 'ussd', 'qr', 'mobile_money']
  currency?: string; // default: NGN
}

export interface PaystackInitializePaymentResponse {
  status: boolean;
  message: string;
  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyPaymentResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    domain: string;
    status: 'success' | 'failed' | 'abandoned';
    reference: string;
    amount: number;
    message: string | null;
    gateway_response: string;
    paid_at: string;
    created_at: string;
    channel: string;
    currency: string;
    ip_address: string;
    metadata: Record<string, any>;
    fees: number;
    customer: {
      id: number;
      email: string;
      customer_code: string;
    };
    authorization: {
      authorization_code: string;
      bin: string;
      last4: string;
      exp_month: string;
      exp_year: string;
      channel: string;
      card_type: string;
      bank: string;
      country_code: string;
      brand: string;
      reusable: boolean;
      signature: string;
      account_name: string | null;
    };
  };
}

/**
 * Initialize a Paystack payment
 */
export async function initializePayment(
  params: PaystackInitializePaymentParams
): Promise<PaystackInitializePaymentResponse> {
  requirePaystack();

  try {
    const response = await paystackClient.post<PaystackInitializePaymentResponse>(
      '/transaction/initialize',
      {
        email: params.email,
        amount: params.amount,
        reference: params.reference,
        callback_url: params.callback_url,
        metadata: params.metadata,
        channels: params.channels || ['card', 'bank', 'ussd', 'qr', 'mobile_money'],
        currency: params.currency || 'NGN',
      }
    );

    return response.data;
  } catch (error: any) {
    console.error('Paystack initialize payment error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to initialize Paystack payment');
  }
}

/**
 * Verify a Paystack payment
 */
export async function verifyPayment(reference: string): Promise<PaystackVerifyPaymentResponse> {
  requirePaystack();

  try {
    const response = await paystackClient.get<PaystackVerifyPaymentResponse>(
      `/transaction/verify/${reference}`
    );

    return response.data;
  } catch (error: any) {
    console.error('Paystack verify payment error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to verify Paystack payment');
  }
}

/**
 * Generate a unique payment reference
 */
export function generateReference(prefix: string = 'FIXI'): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Convert Naira to Kobo (Paystack uses kobo as smallest unit)
 */
export function nairaToKobo(naira: number): number {
  return Math.round(naira * 100);
}

/**
 * Convert Kobo to Naira
 */
export function koboToNaira(kobo: number): number {
  return kobo / 100;
}

/**
 * Verify webhook signature from Paystack
 */
export function verifyWebhookSignature(payload: string, signature: string): boolean {
  const crypto = require('crypto');
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY!)
    .update(payload)
    .digest('hex');
  return hash === signature;
}
