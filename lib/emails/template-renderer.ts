import Handlebars from 'handlebars';
import { prisma } from '@/lib/prisma';
import { EmailTemplateType } from '@prisma/client';
import { sendEmail } from '@/lib/email';

// Cache for compiled templates
const templateCache = new Map<EmailTemplateType, {
  subjectTemplate: HandlebarsTemplateDelegate;
  htmlTemplate: HandlebarsTemplateDelegate;
  textTemplate?: HandlebarsTemplateDelegate;
}>();

/**
 * Get and compile email template from database
 */
async function getCompiledTemplate(type: EmailTemplateType) {
  // Check cache first
  if (templateCache.has(type)) {
    return templateCache.get(type)!;
  }

  // Fetch from database
  const template = await prisma.emailTemplate.findUnique({
    where: { type, isActive: true },
  });

  if (!template) {
    throw new Error(`Email template '${type}' not found or inactive`);
  }

  // Compile templates
  const compiled = {
    subjectTemplate: Handlebars.compile(template.subject),
    htmlTemplate: Handlebars.compile(template.htmlBody),
    textTemplate: template.textBody ? Handlebars.compile(template.textBody) : undefined,
  };

  // Cache the compiled templates
  templateCache.set(type, compiled);

  return compiled;
}

/**
 * Render an email template with the provided data
 */
export async function renderEmailTemplate(
  type: EmailTemplateType,
  data: Record<string, any>
): Promise<{
  subject: string;
  htmlBody: string;
  textBody?: string;
}> {
  const { subjectTemplate, htmlTemplate, textTemplate } = await getCompiledTemplate(type);

  // Add unsubscribe link if userId is provided
  const enrichedData = { ...data };
  if (data.userId) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3010';
    enrichedData.unsubscribeUrl = `${baseUrl}/api/auth/unsubscribe?token=${data.userId}&type=email`;
    enrichedData.preferencesUrl = `${baseUrl}/settings`;
  }

  return {
    subject: subjectTemplate(enrichedData),
    htmlBody: htmlTemplate(enrichedData),
    textBody: textTemplate ? textTemplate(enrichedData) : undefined,
  };
}

/**
 * Send an email using a template
 */
export async function sendTemplatedEmail(
  to: string,
  type: EmailTemplateType,
  data: Record<string, any>
): Promise<void> {
  const { subject, htmlBody, textBody } = await renderEmailTemplate(type, data);

  await sendEmail({
    to,
    subject,
    html: htmlBody,
    text: textBody,
  });

  console.log(`[Email] Sent ${type} to ${to}`);
}

/**
 * Clear template cache (useful for admin updates)
 */
export function clearTemplateCache(type?: EmailTemplateType) {
  if (type) {
    templateCache.delete(type);
    console.log(`[Template Cache] Cleared cache for ${type}`);
  } else {
    templateCache.clear();
    console.log('[Template Cache] Cleared all cached templates');
  }
}

/**
 * Preload all active templates into cache
 */
export async function preloadTemplates() {
  const templates = await prisma.emailTemplate.findMany({
    where: { isActive: true },
  });

  for (const template of templates) {
    const compiled = {
      subjectTemplate: Handlebars.compile(template.subject),
      htmlTemplate: Handlebars.compile(template.htmlBody),
      textTemplate: template.textBody ? Handlebars.compile(template.textBody) : undefined,
    };
    templateCache.set(template.type, compiled);
  }

  console.log(`[Template Cache] Preloaded ${templates.length} email templates`);
}

// Helper functions for common email scenarios

/**
 * Send order confirmation email to client
 */
export async function sendOrderConfirmationEmail(params: {
  clientEmail: string;
  clientName: string;
  orderNumber: string;
  serviceName: string;
  fixerName: string;
  totalAmount: string;
  deliveryDate?: string;
  orderUrl: string;
}) {
  await sendTemplatedEmail(params.clientEmail, EmailTemplateType.ORDER_CONFIRMATION, params);
}

/**
 * Send payment received notification to fixer
 */
export async function sendPaymentReceivedEmail(params: {
  fixerEmail: string;
  fixerName: string;
  orderNumber: string;
  clientName: string;
  totalAmount: string;
  fixerAmount: string;
  platformFee: string;
  orderUrl: string;
}) {
  await sendTemplatedEmail(params.fixerEmail, EmailTemplateType.ORDER_PAID, params);
}

/**
 * Send order completed notification
 */
export async function sendOrderCompletedEmail(params: {
  email: string;
  userName: string;
  orderNumber: string;
  isClient?: boolean;
  isFixer?: boolean;
  fixerAmount?: string;
  reviewUrl?: string;
  walletUrl?: string;
  orderUrl: string;
}) {
  await sendTemplatedEmail(params.email, EmailTemplateType.ORDER_COMPLETED, params);
}

/**
 * Send new quote notification to client
 */
export async function sendQuoteReceivedEmail(params: {
  clientEmail: string;
  clientName: string;
  fixerName: string;
  serviceTitle: string;
  quoteAmount: string;
  estimatedDuration?: string;
  startDate?: string;
  description: string;
  quoteUrl: string;
}) {
  await sendTemplatedEmail(params.clientEmail, EmailTemplateType.QUOTE_RECEIVED, params);
}

/**
 * Send quote accepted notification to fixer
 */
export async function sendQuoteAcceptedEmail(params: {
  fixerEmail: string;
  fixerName: string;
  clientName: string;
  quoteAmount: string;
  serviceTitle: string;
  orderUrl: string;
}) {
  await sendTemplatedEmail(params.fixerEmail, EmailTemplateType.QUOTE_ACCEPTED, params);
}

/**
 * Send review request to client
 */
export async function sendReviewRequestEmail(params: {
  clientEmail: string;
  clientName: string;
  fixerName: string;
  reviewUrl: string;
}) {
  await sendTemplatedEmail(params.clientEmail, EmailTemplateType.REVIEW_REQUEST, params);
}
