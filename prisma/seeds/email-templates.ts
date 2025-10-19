import { PrismaClient, EmailTemplateType } from '@prisma/client';

const prisma = new PrismaClient();

const emailTemplates = [
  // ORDER TEMPLATES
  {
    type: EmailTemplateType.ORDER_CONFIRMATION,
    name: 'Order Confirmation',
    description: 'Sent to client when an order is created',
    subject: 'Order Confirmation #{{orderNumber}} - {{serviceName}}',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .order-details { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
    .total { font-size: 20px; font-weight: bold; color: #4CAF50; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Order Confirmed!</h1>
    </div>
    <div class="content">
      <p>Hi {{clientName}},</p>
      <p>Your order has been confirmed. The service provider will begin work soon.</p>

      <div class="order-details">
        <h3>Order #{{orderNumber}}</h3>
        <p><strong>Service:</strong> {{serviceName}}</p>
        <p><strong>Provider:</strong> {{fixerName}}</p>
        <p><strong>Total Amount:</strong> <span class="total">₦{{totalAmount}}</span></p>
        {{#if deliveryDate}}<p><strong>Expected Delivery:</strong> {{deliveryDate}}</p>{{/if}}
      </div>

      <p style="text-align: center; margin: 30px 0;">
        <a href="{{orderUrl}}" class="button">View Order Details</a>
      </p>

      <p>If you have any questions, please don't hesitate to contact us.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Fixers. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    textBody: `Order Confirmed!

Hi {{clientName}},

Your order has been confirmed. The service provider will begin work soon.

Order #{{orderNumber}}
Service: {{serviceName}}
Provider: {{fixerName}}
Total Amount: ₦{{totalAmount}}
{{#if deliveryDate}}Expected Delivery: {{deliveryDate}}{{/if}}

View your order: {{orderUrl}}

If you have any questions, please don't hesitate to contact us.

© 2025 Fixers. All rights reserved.`,
    variables: {
      clientName: 'Client\'s name',
      orderNumber: 'Order ID',
      serviceName: 'Service/gig title',
      fixerName: 'Fixer/provider name',
      totalAmount: 'Total amount formatted',
      deliveryDate: 'Expected delivery date (optional)',
      orderUrl: 'Link to order details page'
    }
  },

  {
    type: EmailTemplateType.ORDER_PAID,
    name: 'Payment Received',
    description: 'Sent to fixer when payment is received for an order',
    subject: 'Payment Received for Order #{{orderNumber}}',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #2196F3; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .payment-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #2196F3; }
    .amount { font-size: 24px; font-weight: bold; color: #2196F3; }
    .button { display: inline-block; padding: 12px 24px; background: #2196F3; color: white; text-decoration: none; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💰 Payment Received!</h1>
    </div>
    <div class="content">
      <p>Hi {{fixerName}},</p>
      <p>Great news! Payment has been received for your order and is being held in escrow.</p>

      <div class="payment-box">
        <h3>Payment Details</h3>
        <p><strong>Order:</strong> #{{orderNumber}}</p>
        <p><strong>Client:</strong> {{clientName}}</p>
        <p><strong>Amount:</strong> <span class="amount">₦{{totalAmount}}</span></p>
        <p><strong>Your Earnings:</strong> ₦{{fixerAmount}}</p>
        <p><strong>Platform Fee:</strong> ₦{{platformFee}}</p>
      </div>

      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>Complete the work as agreed</li>
        <li>Submit delivery when done</li>
        <li>Funds will be released after client approval</li>
      </ul>

      <p style="text-align: center; margin: 30px 0;">
        <a href="{{orderUrl}}" class="button">View Order</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Fixers. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    textBody: `Payment Received!

Hi {{fixerName}},

Great news! Payment has been received for your order and is being held in escrow.

Payment Details:
- Order: #{{orderNumber}}
- Client: {{clientName}}
- Amount: ₦{{totalAmount}}
- Your Earnings: ₦{{fixerAmount}}
- Platform Fee: ₦{{platformFee}}

Next Steps:
1. Complete the work as agreed
2. Submit delivery when done
3. Funds will be released after client approval

View Order: {{orderUrl}}

© 2025 Fixers. All rights reserved.`,
    variables: {
      fixerName: 'Fixer\'s name',
      orderNumber: 'Order ID',
      clientName: 'Client\'s name',
      totalAmount: 'Total payment amount',
      fixerAmount: 'Fixer\'s earnings after platform fee',
      platformFee: 'Platform commission',
      orderUrl: 'Link to order page'
    }
  },

  {
    type: EmailTemplateType.ORDER_COMPLETED,
    name: 'Order Completed',
    description: 'Sent to both client and fixer when order is marked complete',
    subject: 'Order #{{orderNumber}} Completed Successfully',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; margin: 10px 5px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Order Completed!</h1>
    </div>
    <div class="content">
      <p>Hi {{userName}},</p>
      <p>Order #{{orderNumber}} has been marked as completed.</p>

      {{#if isClient}}
      <p><strong>We hope you're satisfied with the service!</strong></p>
      <p style="text-align: center;">
        <a href="{{reviewUrl}}" class="button">Leave a Review</a>
      </p>
      {{/if}}

      {{#if isFixer}}
      <p><strong>Congratulations!</strong> The payment of <strong>₦{{fixerAmount}}</strong> has been released to your wallet.</p>
      <p style="text-align: center;">
        <a href="{{walletUrl}}" class="button">View Wallet</a>
      </p>
      {{/if}}

      <p style="text-align: center;">
        <a href="{{orderUrl}}" class="button">View Order</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Fixers. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    textBody: `Order Completed!

Hi {{userName}},

Order #{{orderNumber}} has been marked as completed.

{{#if isClient}}
We hope you're satisfied with the service!
Leave a review: {{reviewUrl}}
{{/if}}

{{#if isFixer}}
Congratulations! The payment of ₦{{fixerAmount}} has been released to your wallet.
View Wallet: {{walletUrl}}
{{/if}}

View Order: {{orderUrl}}

© 2025 Fixers. All rights reserved.`,
    variables: {
      userName: 'Recipient name',
      orderNumber: 'Order ID',
      isClient: 'true if recipient is client',
      isFixer: 'true if recipient is fixer',
      fixerAmount: 'Payment amount (for fixer)',
      reviewUrl: 'Link to leave review',
      walletUrl: 'Link to wallet',
      orderUrl: 'Link to order'
    }
  },

  // QUOTE TEMPLATES
  {
    type: EmailTemplateType.QUOTE_RECEIVED,
    name: 'New Quote Received',
    description: 'Sent to client when a fixer submits a quote',
    subject: 'New Quote from {{fixerName}} for "{{serviceTitle}}"',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #FF9800; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .quote-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #FF9800; }
    .amount { font-size: 24px; font-weight: bold; color: #FF9800; }
    .button { display: inline-block; padding: 12px 24px; background: #FF9800; color: white; text-decoration: none; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📋 New Quote Received!</h1>
    </div>
    <div class="content">
      <p>Hi {{clientName}},</p>
      <p>Good news! {{fixerName}} has submitted a quote for your service request.</p>

      <div class="quote-box">
        <h3>Quote Details</h3>
        <p><strong>Service:</strong> {{serviceTitle}}</p>
        <p><strong>Provider:</strong> {{fixerName}}</p>
        <p><strong>Quote Amount:</strong> <span class="amount">₦{{quoteAmount}}</span></p>
        {{#if estimatedDuration}}<p><strong>Est. Duration:</strong> {{estimatedDuration}}</p>{{/if}}
        {{#if startDate}}<p><strong>Can Start:</strong> {{startDate}}</p>{{/if}}
        <p><strong>Description:</strong> {{description}}</p>
      </div>

      <p style="text-align: center; margin: 30px 0;">
        <a href="{{quoteUrl}}" class="button">View & Accept Quote</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Fixers. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    textBody: `New Quote Received!

Hi {{clientName}},

Good news! {{fixerName}} has submitted a quote for your service request.

Quote Details:
- Service: {{serviceTitle}}
- Provider: {{fixerName}}
- Quote Amount: ₦{{quoteAmount}}
{{#if estimatedDuration}}- Est. Duration: {{estimatedDuration}}{{/if}}
{{#if startDate}}- Can Start: {{startDate}}{{/if}}
- Description: {{description}}

View & Accept Quote: {{quoteUrl}}

© 2025 Fixers. All rights reserved.`,
    variables: {
      clientName: 'Client name',
      fixerName: 'Fixer name',
      serviceTitle: 'Service request title',
      quoteAmount: 'Quote amount',
      estimatedDuration: 'Estimated duration (optional)',
      startDate: 'Start date (optional)',
      description: 'Quote description',
      quoteUrl: 'Link to quote details'
    }
  },

  {
    type: EmailTemplateType.QUOTE_ACCEPTED,
    name: 'Quote Accepted',
    description: 'Sent to fixer when client accepts their quote',
    subject: 'Your Quote for "{{serviceTitle}}" was Accepted!',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #4CAF50; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Quote Accepted!</h1>
    </div>
    <div class="content">
      <p>Hi {{fixerName}},</p>
      <p>Great news! {{clientName}} has accepted your quote for <strong>₦{{quoteAmount}}</strong>.</p>

      <p><strong>Next Steps:</strong></p>
      <ul>
        <li>Wait for the client to make payment</li>
        <li>Once paid, you can begin work</li>
        <li>Keep the client updated on progress</li>
      </ul>

      <p style="text-align: center; margin: 30px 0;">
        <a href="{{orderUrl}}" class="button">View Order</a>
      </p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Fixers. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    textBody: `Quote Accepted!

Hi {{fixerName}},

Great news! {{clientName}} has accepted your quote for ₦{{quoteAmount}}.

Next Steps:
1. Wait for the client to make payment
2. Once paid, you can begin work
3. Keep the client updated on progress

View Order: {{orderUrl}}

© 2025 Fixers. All rights reserved.`,
    variables: {
      fixerName: 'Fixer name',
      clientName: 'Client name',
      quoteAmount: 'Quote amount',
      serviceTitle: 'Service title',
      orderUrl: 'Link to order page'
    }
  },

  // REVIEW REQUEST
  {
    type: EmailTemplateType.REVIEW_REQUEST,
    name: 'Review Request',
    description: 'Sent to client after order completion to request a review',
    subject: 'How was your experience with {{fixerName}}?',
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #9C27B0; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; background: #f9f9f9; }
    .button { display: inline-block; padding: 12px 24px; background: #9C27B0; color: white; text-decoration: none; border-radius: 4px; }
    .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⭐ Share Your Experience</h1>
    </div>
    <div class="content">
      <p>Hi {{clientName}},</p>
      <p>Thank you for using Fixers! Your order with {{fixerName}} has been completed.</p>
      <p>We'd love to hear about your experience. Your feedback helps other clients make informed decisions and helps service providers improve.</p>

      <p style="text-align: center; margin: 30px 0;">
        <a href="{{reviewUrl}}" class="button">Leave a Review</a>
      </p>

      <p style="font-size: 14px; color: #666;">Your review will help build trust in our community and improve the quality of service for everyone.</p>
    </div>
    <div class="footer">
      <p>&copy; 2025 Fixers. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `,
    textBody: `Share Your Experience

Hi {{clientName}},

Thank you for using Fixers! Your order with {{fixerName}} has been completed.

We'd love to hear about your experience. Your feedback helps other clients make informed decisions and helps service providers improve.

Leave a Review: {{reviewUrl}}

Your review will help build trust in our community and improve the quality of service for everyone.

© 2025 Fixers. All rights reserved.`,
    variables: {
      clientName: 'Client name',
      fixerName: 'Fixer name',
      reviewUrl: 'Link to review form'
    }
  }
];

async function seedEmailTemplates() {
  console.log('🌱 Seeding email templates...');

  for (const template of emailTemplates) {
    await prisma.emailTemplate.upsert({
      where: { type: template.type },
      update: {
        name: template.name,
        description: template.description,
        subject: template.subject,
        htmlBody: template.htmlBody,
        textBody: template.textBody,
        variables: template.variables,
      },
      create: template,
    });
    console.log(`  ✓ ${template.name}`);
  }

  console.log(`\n✅ Successfully seeded ${emailTemplates.length} email templates!`);
}

seedEmailTemplates()
  .catch((e) => {
    console.error('Error seeding email templates:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
