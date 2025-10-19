# Badge Payment Modal Implementation

**Status:** ✅ Complete  
**Date:** October 17, 2025  
**Approach:** Modal/Popup with Stripe Elements (following inspection payment pattern)

## Overview

The badge payment system now uses a **modal/popup approach** instead of a separate payment page. When a user clicks "Complete Payment", a modal opens with Stripe Elements for checkout, providing a seamless in-page payment experience.

## Flow Diagram

```
Badge Request Detail Page
    ↓
User clicks "Complete Payment" button
    ↓
BadgePaymentButton fetches clientSecret from API
    ↓
Modal opens with Stripe Elements
    ↓
User enters card details (Test: 4242 4242 4242 4242)
    ↓
Stripe processes payment
    ↓
Backend confirms payment via /api/badge-requests/[requestId]/confirm-payment
    ↓
Modal closes, page refreshes
    ↓
Status updated to PAYMENT_RECEIVED
```

## Components

### 1. BadgePaymentButton (`/components/badges/BadgePaymentButton.tsx`)

**Purpose:** Client component that triggers payment modal

**Props:**

- `requestId`: Badge request ID
- `amount`: Payment amount in kobo (₦100 = 10000 kobo)
- `badgeName`: Display name of badge
- `badgeIcon`: Emoji icon for badge

**Features:**

- Fetches `clientSecret` from API when clicked
- Opens modal with Stripe Elements
- Shows loading state during API call
- Error handling for failed requests

### 2. PaymentModal (internal component)

**Purpose:** Modal overlay with Stripe payment form

**Features:**

- Full-screen backdrop overlay
- Centered modal card
- Close button (disabled during processing)
- Badge icon and name display
- Amount display in Naira format
- Stripe PaymentElement
- Cancel and Pay Now buttons
- Security notice
- Error message display

**Payment Flow:**

1. User fills in card details
2. Click "Pay Now"
3. Stripe confirms payment
4. Backend validates via PaymentIntent ID
5. Status updates in database
6. Modal closes
7. Page refreshes to show updated status

## API Endpoints

### GET `/api/badge-requests/[requestId]`

**Purpose:** Fetch badge request with clientSecret

**Returns:**

```json
{
  "success": true,
  "request": {
    "id": "...",
    "badgeId": "...",
    "fixerId": "...",
    "status": "PENDING",
    "paymentStatus": "PENDING",
    "paymentAmount": 10000,
    "clientSecret": "pi_xxx_secret_xxx",
    "paymentRef": "pi_xxx",
    "badge": { "name": "...", "icon": "..." },
    "fixer": { "name": "...", "email": "..." }
  }
}
```

**Security:** Only request owner or admin can access

### POST `/api/badge-requests/[requestId]/confirm-payment`

**Purpose:** Backend confirmation after Stripe payment succeeds

**Request:**

```json
{
  "paymentIntentId": "pi_xxx"
}
```

**Process:**

1. Verify PaymentIntent with Stripe
2. Validate amount matches request
3. Update status to `PAYMENT_RECEIVED`
4. Update `paymentStatus` to `PAID`
5. Set `paidAt` timestamp

## Usage Example

```tsx
import { BadgePaymentButton } from "@/components/badges/BadgePaymentButton";

// In your page/component
<BadgePaymentButton
  requestId={badgeRequest.id}
  amount={badgeRequest.paymentAmount}
  badgeName={badgeRequest.badge.name}
  badgeIcon={badgeRequest.badge.icon}
/>;
```

## Styling

The modal uses Tailwind CSS with:

- Fixed positioning for overlay
- z-50 for modal stack order
- Semi-transparent backdrop (bg-black bg-opacity-50)
- White rounded card (max-w-md)
- Responsive padding
- Smooth transitions
- Disabled states during processing

## Testing

**Test Card:** `4242 4242 4242 4242`

- Any future expiry date
- Any 3-digit CVC
- Any postal code

**Test Flow:**

1. Go to `/fixer/badges`
2. Click on any badge → "Request Badge"
3. Upload required documents
4. Submit request
5. On request detail page, click "Complete Payment"
6. Modal opens with Stripe Elements
7. Enter test card details
8. Click "Pay Now"
9. Modal closes
10. Page shows "Payment Received" status

## Advantages Over Separate Page

✅ **Better UX:** No navigation away from request details  
✅ **Faster:** Single-page interaction  
✅ **Cleaner:** No need for dedicated payment route  
✅ **Consistent:** Matches inspection payment pattern  
✅ **Mobile-friendly:** Modal adapts to screen size  
✅ **Error recovery:** Easy to retry without losing context

## Files Modified

1. **Created:** `/components/badges/BadgePaymentButton.tsx`
   - New client component with modal payment
2. **Updated:** `/app/fixer/badges/requests/[requestId]/page.tsx`
   - Replaced Link to payment page with BadgePaymentButton
   - Added import for new component

3. **Updated:** `/app/api/badge-requests/[requestId]/route.ts`
   - Fixed User field names (firstName/lastName → name)
   - Enhanced error logging

## Migration Notes

The old payment page at `/fixer/badges/payment/[requestId]` still exists but is no longer used. It can be safely deleted or kept as a fallback/alternative flow.

**Old approach:**

```tsx
<Link href={`/fixer/badges/payment/${requestId}`}>Complete Payment</Link>
```

**New approach:**

```tsx
<BadgePaymentButton
  requestId={requestId}
  amount={amount}
  badgeName={badgeName}
  badgeIcon={badgeIcon}
/>
```

## Environment Variables

Required in `.env`:

```
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

## Security Features

- Payment session expires after 24 hours
- Only request owner can access payment
- Backend validates all payments with Stripe
- Amount validation prevents tampering
- HTTPS required in production
- clientSecret never exposed to other users

## Future Enhancements

- [ ] Add payment retry on failure
- [ ] Show payment receipt/invoice
- [ ] Email notification on payment success
- [ ] Support for payment methods beyond cards
- [ ] Webhook integration for async updates
- [ ] Payment analytics tracking

## Related Documentation

- [Badge Request Flow](./BADGE-PAYMENT-FIX.md)
- [Delete Badge Requests](./DELETE-BADGE-REQUESTS.md)
- [Badge Management System](./BADGE-MANAGEMENT-SYSTEM.md)
