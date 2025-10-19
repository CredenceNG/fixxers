# Badge Payment Webhook Setup Guide

This guide explains how to set up Stripe webhooks for the badge payment system.

## High Priority Fixes Completed ✅

### 1. Schema Updates
- ✅ Added `MORE_INFO_NEEDED` status to `BadgeRequestStatus` enum
- ✅ Fixed `isExpiringSOon` typo → `isExpiringSoon`
- ✅ Verified BadgeAssignment ↔ BadgeRequest relation is complete

### 2. Webhook Implementation
- ✅ Created `/app/api/webhooks/stripe/route.ts`
- ✅ Added email notifications for payment events
- ✅ Handles: payment success, failure, refunds, and cancellations

---

## Webhook Setup Instructions

### Local Development

1. **Install Stripe CLI**
   ```bash
   brew install stripe/stripe-cli/stripe
   # or download from https://stripe.com/docs/stripe-cli
   ```

2. **Login to Stripe**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server**
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

   This will output a webhook signing secret like `whsec_xxxxx`

4. **Update `.env.local`**
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
   ```

5. **Test webhook**
   ```bash
   # In another terminal, trigger a test event
   stripe trigger payment_intent.succeeded
   ```

---

### Production Setup

1. **Go to Stripe Dashboard**
   - Navigate to: [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)

2. **Add endpoint**
   - Click "Add endpoint"
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Description: "Badge payment webhooks"

3. **Select events to listen to**
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
   - `payment_intent.canceled`

4. **Get signing secret**
   - After creating the endpoint, click "Reveal" next to "Signing secret"
   - Copy the secret (starts with `whsec_`)

5. **Add to production environment variables**
   ```env
   STRIPE_WEBHOOK_SECRET="whsec_xxxxx"
   ```

---

## Webhook Events Handled

### 1. `payment_intent.succeeded`
**What it does:**
- Updates badge request: `PENDING` → `PAYMENT_RECEIVED`
- Sets payment status to `PAID`
- Records `paidAt` timestamp
- Sends confirmation email to fixer

**Email sent:** Payment Confirmation

---

### 2. `payment_intent.payment_failed`
**What it does:**
- Logs payment failure
- Sends failure notification to fixer
- Badge request remains in `PENDING` status

**Email sent:** Payment Failure Notice

**Future enhancement:** Auto-expire after 3 failed attempts

---

### 3. `charge.refunded`
**What it does:**
- Updates payment status to `REFUNDED`
- Sends refund notification to fixer
- Typically triggered after badge rejection

**Email sent:** Refund Notification

---

### 4. `payment_intent.canceled`
**What it does:**
- Logs cancellation event
- No status change (stays `PENDING`)

**Email sent:** None (future enhancement)

---

## Testing Webhooks

### Test Payment Success
```bash
stripe trigger payment_intent.succeeded
```

### Test Payment Failure
```bash
stripe trigger payment_intent.payment_failed
```

### Test Refund
```bash
stripe trigger charge.refunded
```

---

## Email Templates

The webhook uses email templates from `/lib/emails/badge-payment-emails.ts`:

1. **Payment Confirmation** - Green theme, includes request link
2. **Payment Failure** - Red theme, includes retry link
3. **Refund Notification** - Blue theme, includes refund timeline

---

## Security Best Practices

✅ **Webhook signature verification** - All requests verified using Stripe signature
✅ **Environment variables** - Secrets stored in `.env` files
✅ **Error handling** - Failed emails don't break webhook processing
✅ **Idempotency** - Safe to receive duplicate events

---

## Monitoring

### Check webhook logs in Stripe Dashboard
1. Go to: [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Click on your endpoint
3. View "Attempts" tab for delivery status

### Check application logs
```bash
# Look for these log messages:
# - "Payment confirmed for badge request {id}"
# - "Payment failed for badge request {id}"
# - "Refund processed for badge request {id}"
```

---

## Troubleshooting

### Webhook not receiving events
1. Check endpoint URL is correct
2. Verify webhook secret matches
3. Check Stripe Dashboard for failed deliveries
4. Ensure server is accessible (not localhost in production)

### Signature verification failed
- Check `STRIPE_WEBHOOK_SECRET` environment variable
- Ensure raw body is used (not parsed JSON)
- Verify Stripe API version compatibility

### Emails not sending
- Check `RESEND_API_KEY` is set
- Verify email addresses in database
- Check Resend dashboard for delivery logs

---

## Next Steps (Future Enhancements)

⏳ **Pending implementation:**
1. Auto-expire requests after 30 days unpaid
2. Admin notification when request ready for review
3. Retry logic for failed email sends
4. Webhook event audit logging
5. SLA tracking for payment processing time

---

## Related Files

- Webhook handler: [/app/api/webhooks/stripe/route.ts](../app/api/webhooks/stripe/route.ts)
- Email templates: [/lib/emails/badge-payment-emails.ts](../lib/emails/badge-payment-emails.ts)
- Badge emails: [/lib/emails/badge-emails.ts](../lib/emails/badge-emails.ts)
- Schema: [/prisma/schema.prisma](../prisma/schema.prisma)
