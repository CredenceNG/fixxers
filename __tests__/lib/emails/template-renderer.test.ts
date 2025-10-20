import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmailTemplateType } from '@prisma/client';
import * as templateRenderer from '@/lib/emails/template-renderer';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    emailTemplate: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

// Mock email sender
vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(),
}));

import { prisma } from '@/lib/prisma';
import { sendEmail } from '@/lib/email';

describe('Email Template Renderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear template cache before each test
    templateRenderer.clearTemplateCache();
  });

  describe('renderEmailTemplate', () => {
    it('should render template with provided data', async () => {
      const mockTemplate = {
        type: EmailTemplateType.ORDER_CONFIRMATION,
        subject: 'Order Confirmation - {{orderNumber}}',
        htmlBody: '<p>Hello {{clientName}}, your order {{orderNumber}} is confirmed.</p>',
        textBody: 'Hello {{clientName}}, your order {{orderNumber}} is confirmed.',
        isActive: true,
      };

      vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue(mockTemplate as any);

      const result = await templateRenderer.renderEmailTemplate(
        EmailTemplateType.ORDER_CONFIRMATION,
        {
          clientName: 'John Doe',
          orderNumber: 'ORD-123',
        }
      );

      expect(result.subject).toBe('Order Confirmation - ORD-123');
      expect(result.htmlBody).toContain('Hello John Doe');
      expect(result.htmlBody).toContain('your order ORD-123');
      expect(result.textBody).toContain('Hello John Doe');
    });

    it('should add unsubscribe link if userId is provided', async () => {
      const mockTemplate = {
        type: EmailTemplateType.ORDER_CONFIRMATION,
        subject: 'Test Subject',
        htmlBody: '<p>Test</p><a href="{{unsubscribeUrl}}">Unsubscribe</a>',
        textBody: null,
        isActive: true,
      };

      vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue(mockTemplate as any);

      const result = await templateRenderer.renderEmailTemplate(
        EmailTemplateType.ORDER_CONFIRMATION,
        { userId: 'user-123' }
      );

      // Check for unsubscribe URL - it should include the domain and path
      // Note: Handlebars HTML-encodes special characters like =
      expect(result.htmlBody).toContain('http://localhost:3010/api/auth/unsubscribe');
      expect(result.htmlBody).toContain('user-123');
    });

    it('should cache compiled templates', async () => {
      const mockTemplate = {
        type: EmailTemplateType.ORDER_CONFIRMATION,
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
        isActive: true,
      };

      vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue(mockTemplate as any);

      // First call
      await templateRenderer.renderEmailTemplate(EmailTemplateType.ORDER_CONFIRMATION, {});

      // Second call - should use cache
      await templateRenderer.renderEmailTemplate(EmailTemplateType.ORDER_CONFIRMATION, {});

      // Should only fetch from database once
      expect(prisma.emailTemplate.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should throw error if template not found', async () => {
      vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue(null);

      await expect(
        templateRenderer.renderEmailTemplate(EmailTemplateType.ORDER_CONFIRMATION, {})
      ).rejects.toThrow("Email template 'ORDER_CONFIRMATION' not found or inactive");
    });

    it('should handle missing textBody gracefully', async () => {
      const mockTemplate = {
        type: EmailTemplateType.ORDER_CONFIRMATION,
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        textBody: null,
        isActive: true,
      };

      vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue(mockTemplate as any);

      const result = await templateRenderer.renderEmailTemplate(
        EmailTemplateType.ORDER_CONFIRMATION,
        {}
      );

      expect(result.textBody).toBeUndefined();
    });
  });

  describe('sendTemplatedEmail', () => {
    it('should render and send email', async () => {
      const mockTemplate = {
        type: EmailTemplateType.ORDER_CONFIRMATION,
        subject: 'Order {{orderNumber}}',
        htmlBody: '<p>Hello {{clientName}}</p>',
        textBody: 'Hello {{clientName}}',
        isActive: true,
      };

      vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue(mockTemplate as any);
      vi.mocked(sendEmail).mockResolvedValue({ success: true });

      await templateRenderer.sendTemplatedEmail(
        'test@example.com',
        EmailTemplateType.ORDER_CONFIRMATION,
        {
          clientName: 'John Doe',
          orderNumber: 'ORD-123',
        }
      );

      expect(sendEmail).toHaveBeenCalledWith({
        to: 'test@example.com',
        subject: 'Order ORD-123',
        html: '<p>Hello John Doe</p>',
        text: 'Hello John Doe',
      });
    });
  });

  describe('clearTemplateCache', () => {
    it('should clear specific template from cache', async () => {
      const mockTemplate = {
        type: EmailTemplateType.ORDER_CONFIRMATION,
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
        isActive: true,
      };

      vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue(mockTemplate as any);

      // Load template into cache
      await templateRenderer.renderEmailTemplate(EmailTemplateType.ORDER_CONFIRMATION, {});

      // Clear cache
      templateRenderer.clearTemplateCache(EmailTemplateType.ORDER_CONFIRMATION);

      // Next call should fetch from database again
      await templateRenderer.renderEmailTemplate(EmailTemplateType.ORDER_CONFIRMATION, {});

      expect(prisma.emailTemplate.findUnique).toHaveBeenCalledTimes(2);
    });

    it('should clear all templates from cache', async () => {
      const mockTemplate = {
        type: EmailTemplateType.ORDER_CONFIRMATION,
        subject: 'Test',
        htmlBody: '<p>Test</p>',
        textBody: 'Test',
        isActive: true,
      };

      vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue(mockTemplate as any);

      // Load templates into cache
      await templateRenderer.renderEmailTemplate(EmailTemplateType.ORDER_CONFIRMATION, {});

      // Clear all cache
      templateRenderer.clearTemplateCache();

      // Next call should fetch from database again
      await templateRenderer.renderEmailTemplate(EmailTemplateType.ORDER_CONFIRMATION, {});

      expect(prisma.emailTemplate.findUnique).toHaveBeenCalledTimes(2);
    });
  });

  describe('preloadTemplates', () => {
    it('should preload all active templates', async () => {
      const mockTemplates = [
        {
          type: EmailTemplateType.ORDER_CONFIRMATION,
          subject: 'Test 1',
          htmlBody: '<p>Test 1</p>',
          textBody: 'Test 1',
          isActive: true,
        },
        {
          type: EmailTemplateType.ORDER_PAID,
          subject: 'Test 2',
          htmlBody: '<p>Test 2</p>',
          textBody: 'Test 2',
          isActive: true,
        },
      ];

      vi.mocked(prisma.emailTemplate.findMany).mockResolvedValue(mockTemplates as any);

      await templateRenderer.preloadTemplates();

      expect(prisma.emailTemplate.findMany).toHaveBeenCalledWith({
        where: { isActive: true },
      });

      // Verify templates are cached - rendering shouldn't fetch from DB
      vi.mocked(prisma.emailTemplate.findUnique).mockClear();

      await templateRenderer.renderEmailTemplate(EmailTemplateType.ORDER_CONFIRMATION, {});

      expect(prisma.emailTemplate.findUnique).not.toHaveBeenCalled();
    });
  });

  describe('Helper functions', () => {
    describe('sendOrderConfirmationEmail', () => {
      it('should send order confirmation with correct data', async () => {
        const mockTemplate = {
          type: EmailTemplateType.ORDER_CONFIRMATION,
          subject: 'Order Confirmation',
          htmlBody: '<p>Test</p>',
          textBody: 'Test',
          isActive: true,
        };

        vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue(mockTemplate as any);
        vi.mocked(sendEmail).mockResolvedValue({ success: true });

        await templateRenderer.sendOrderConfirmationEmail({
          clientEmail: 'client@example.com',
          clientName: 'John Doe',
          orderNumber: 'ORD-123',
          serviceName: 'Plumbing Service',
          fixerName: 'Jane Smith',
          totalAmount: '$100',
          orderUrl: 'https://example.com/orders/123',
        });

        expect(sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'client@example.com',
          })
        );
      });
    });

    describe('sendPaymentReceivedEmail', () => {
      it('should send payment received notification', async () => {
        const mockTemplate = {
          type: EmailTemplateType.ORDER_PAID,
          subject: 'Payment Received',
          htmlBody: '<p>Test</p>',
          textBody: 'Test',
          isActive: true,
        };

        vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue(mockTemplate as any);
        vi.mocked(sendEmail).mockResolvedValue({ success: true });

        await templateRenderer.sendPaymentReceivedEmail({
          fixerEmail: 'fixer@example.com',
          fixerName: 'Jane Smith',
          orderNumber: 'ORD-123',
          clientName: 'John Doe',
          totalAmount: '$100',
          fixerAmount: '$85',
          platformFee: '$15',
          orderUrl: 'https://example.com/orders/123',
        });

        expect(sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'fixer@example.com',
          })
        );
      });
    });

    describe('sendQuoteReceivedEmail', () => {
      it('should send quote received notification', async () => {
        const mockTemplate = {
          type: EmailTemplateType.QUOTE_RECEIVED,
          subject: 'New Quote',
          htmlBody: '<p>Test</p>',
          textBody: 'Test',
          isActive: true,
        };

        vi.mocked(prisma.emailTemplate.findUnique).mockResolvedValue(mockTemplate as any);
        vi.mocked(sendEmail).mockResolvedValue({ success: true });

        await templateRenderer.sendQuoteReceivedEmail({
          clientEmail: 'client@example.com',
          clientName: 'John Doe',
          fixerName: 'Jane Smith',
          serviceTitle: 'Plumbing Repair',
          quoteAmount: '$100',
          description: 'Fix leaky faucet',
          quoteUrl: 'https://example.com/quotes/123',
        });

        expect(sendEmail).toHaveBeenCalledWith(
          expect.objectContaining({
            to: 'client@example.com',
          })
        );
      });
    });
  });
});
