# Email Template System - Implementation Guide

## Overview

The email template system allows you to manage all email content through the admin panel without changing code. Templates use Handlebars syntax for dynamic content.

## ✅ What's Been Implemented

### 1. Database Schema
- **EmailTemplate** model with support for:
  - Multiple template types (orders, quotes, reviews, etc.)
  - HTML and plain text versions
  - Variable definitions
  - Active/inactive status
  - Handlebars template compilation

### 2. Seeded Templates
Six initial templates have been created:
- **ORDER_CONFIRMATION** - Sent when order is created
- **ORDER_PAID** - Sent to fixer when payment received
- **ORDER_COMPLETED** - Sent when order is completed
- **QUOTE_RECEIVED** - Sent to client when quote submitted
- **QUOTE_ACCEPTED** - Sent to fixer when quote accepted
- **REVIEW_REQUEST** - Sent to request customer review

### 3. Admin UI
- **List view**: `/admin/email-templates`
  - View all templates
  - See status (active/inactive)
  - Quick access to edit

- **Edit view**: `/admin/email-templates/[templateId]`
  - WYSIWYG-style editing
  - Live preview with sample data
  - Variable reference guide
  - Template activation toggle

### 4. Template Renderer
Location: `/lib/emails/template-renderer.ts`

Features:
- Handlebars template compilation
- Template caching for performance
- Helper functions for common scenarios
- Automatic cache invalidation on updates

## 📝 How to Use

### Option 1: Using Helper Functions (Recommended)

```typescript
import { sendOrderConfirmationEmail } from '@/lib/emails/template-renderer';

// In your API route
await sendOrderConfirmationEmail({
  clientEmail: client.email,
  clientName: client.name,
  orderNumber: order.id,
  serviceName: service.title,
  fixerName: fixer.name,
  totalAmount: formatCurrency(order.totalAmount),
  orderUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}`
});
```

### Option 2: Using Generic Template Function

```typescript
import { sendTemplatedEmail } from '@/lib/emails/template-renderer';
import { EmailTemplateType } from '@prisma/client';

await sendTemplatedEmail(
  recipientEmail,
  EmailTemplateType.QUOTE_RECEIVED,
  {
    clientName: 'John Doe',
    fixerName: 'Jane Smith',
    quoteAmount: '₦15,000',
    // ... other variables
  }
);
```

### Option 3: Manual Rendering

```typescript
import { renderEmailTemplate } from '@/lib/emails/template-renderer';
import { sendEmail } from '@/lib/email';

const { subject, htmlBody, textBody } = await renderEmailTemplate(
  EmailTemplateType.ORDER_PAID,
  dataObject
);

await sendEmail({
  to: email,
  subject,
  html: htmlBody,
  text: textBody
});
```

## 🔧 Integration Examples

### Example 1: Quote Submission
File: `app/api/fixer/quotes/route.ts`

```typescript
import { sendQuoteReceivedEmail } from '@/lib/emails/template-renderer';

// After quote is created
await sendQuoteReceivedEmail({
  clientEmail: request.client.email,
  clientName: request.client.name,
  fixerName: user.name,
  serviceTitle: request.title,
  quoteAmount: formatCurrency(totalAmount),
  estimatedDuration: estimatedDuration || undefined,
  startDate: startDate ? new Date(startDate).toLocaleDateString() : undefined,
  description: description,
  quoteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/quotes/${quote.id}`
});
```

### Example 2: Order Completion
File: `app/api/orders/[orderId]/complete/route.ts`

```typescript
import { sendOrderCompletedEmail, sendReviewRequestEmail } from '@/lib/emails/template-renderer';

// Send to fixer
await sendOrderCompletedEmail({
  email: order.fixer.email,
  userName: order.fixer.name,
  orderNumber: order.id,
  isFixer: true,
  fixerAmount: formatCurrency(fixerEarnings),
  walletUrl: `${process.env.NEXT_PUBLIC_APP_URL}/wallet`,
  orderUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}`
});

// Send to client
await sendOrderCompletedEmail({
  email: order.client.email,
  userName: order.client.name,
  orderNumber: order.id,
  isClient: true,
  reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}/review`,
  orderUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}`
});

// Request review after 1 hour
setTimeout(async () => {
  await sendReviewRequestEmail({
    clientEmail: order.client.email,
    clientName: order.client.name,
    fixerName: order.fixer.name,
    reviewUrl: `${process.env.NEXT_PUBLIC_APP_URL}/orders/${order.id}/review`
  });
}, 3600000);
```

## 📋 Available Helper Functions

All located in `/lib/emails/template-renderer.ts`:

1. `sendOrderConfirmationEmail(params)` - Order confirmation to client
2. `sendPaymentReceivedEmail(params)` - Payment notification to fixer
3. `sendOrderCompletedEmail(params)` - Order completion notification
4. `sendQuoteReceivedEmail(params)` - New quote notification to client
5. `sendQuoteAcceptedEmail(params)` - Quote acceptance to fixer
6. `sendReviewRequestEmail(params)` - Review request to client

## 🎨 Template Syntax

### Variables
```handlebars
Hello {{clientName}},

Your order #{{orderNumber}} totals {{totalAmount}}.
```

### Conditionals
```handlebars
{{#if deliveryDate}}
Expected delivery: {{deliveryDate}}
{{/if}}

{{#if isClient}}
  <a href="{{reviewUrl}}">Leave a Review</a>
{{/if}}
```

### Loops (if needed)
```handlebars
{{#each items}}
  - {{this.name}}: {{this.price}}
{{/each}}
```

## 🔄 Endpoints to Update

### High Priority (Order/Quote Flow)
1. ✅ `/api/fixer/quotes/route.ts` - Quote submission → sendQuoteReceivedEmail
2. ❌ `/api/quotes/[id]/accept/route.ts` - Quote acceptance → sendQuoteAcceptedEmail + sendOrderConfirmationEmail
3. ❌ `/api/orders/[orderId]/create-payment-intent/route.ts` - Payment success → sendPaymentReceivedEmail
4. ❌ `/api/fixer/orders/[orderId]/complete/route.ts` - Order completion → sendOrderCompletedEmail
5. ❌ `/api/orders/[orderId]/complete/route.ts` - Client approval → sendReviewRequestEmail

### Medium Priority (Other Flows)
6. ❌ `/api/fixer/quotes/[quoteId]/submit-final/route.ts` - Final quote after inspection
7. ❌ `/api/orders/[orderId]/cancel/route.ts` - Order cancellation notification
8. ❌ Badge approval/rejection emails
9. ❌ Agent application emails

## 🎯 Next Steps

### Immediate (Critical for Launch)
1. **Update quote submission endpoint** to send QUOTE_RECEIVED email
2. **Update quote acceptance** to send QUOTE_ACCEPTED + ORDER_CONFIRMATION
3. **Update payment webhook** to send ORDER_PAID email
4. **Update order completion** to send ORDER_COMPLETED + REVIEW_REQUEST

### Short-term (1-2 weeks)
5. Add remaining order email templates (cancelled, in_progress, etc.)
6. Create admin email sending test tool
7. Add email delivery logging/tracking
8. Create email templates for badge system

### Long-term (Nice to Have)
9. Email template versioning
10. A/B testing support
11. Email analytics dashboard
12. Template cloning/duplication
13. Multi-language support

## 🐛 Troubleshooting

### Template not updating?
Cache may not be cleared. Update the template via admin UI or manually call:
```typescript
import { clearTemplateCache } from '@/lib/emails/template-renderer';
clearTemplateCache(EmailTemplateType.ORDER_CONFIRMATION);
```

### Variables not rendering?
Ensure variable names match exactly (case-sensitive):
- Template: `{{clientName}}`
- Data: `{ clientName: "John" }` ✅
- Data: `{ ClientName: "John" }` ❌

### Email not sending?
1. Check template is active (`isActive: true`)
2. Verify email service configuration (Resend API key)
3. Check server logs for errors
4. Test with preview function in admin panel

## 📚 Resources

- **Handlebars Documentation**: https://handlebarsjs.com/
- **Template List**: `/admin/email-templates`
- **Email Renderer**: `/lib/emails/template-renderer.ts`
- **Seed Script**: `/prisma/seeds/email-templates.ts`

## 🔒 Security Notes

- Only ADMIN users can edit templates
- Template cache is automatically cleared on updates
- No user input is directly inserted into templates (all sanitized through Handlebars)
- Preview function uses sample data only

---

**Status**: ✅ Infrastructure Complete | ⏳ Integration In Progress
**Last Updated**: 2025-10-19
