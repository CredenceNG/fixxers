import Stripe from 'stripe';

// Make Stripe optional to allow builds without the key
// In production, ensure STRIPE_SECRET_KEY is set in environment variables
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-09-30.clover',
      typescript: true,
    })
  : null;

// Helper to check if Stripe is configured
export function requireStripe() {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.');
  }
  return stripe;
}
