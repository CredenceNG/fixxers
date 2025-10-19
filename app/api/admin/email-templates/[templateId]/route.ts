import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { clearTemplateCache } from '@/lib/emails/template-renderer';

/**
 * GET /api/admin/email-templates/[templateId]
 * Get a specific email template
 */
export async function GET(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ templateId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const params = await paramsPromise;
    const template = await prisma.emailTemplate.findUnique({
      where: { id: params.templateId },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ template });
  } catch (error) {
    console.error('Error fetching email template:', error);
    return NextResponse.json(
      { error: 'Failed to fetch email template' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/email-templates/[templateId]
 * Update an email template
 */
export async function PATCH(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ templateId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const params = await paramsPromise;
    const body = await request.json();
    const { name, description, subject, htmlBody, textBody, isActive } = body;

    const template = await prisma.emailTemplate.update({
      where: { id: params.templateId },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(subject !== undefined && { subject }),
        ...(htmlBody !== undefined && { htmlBody }),
        ...(textBody !== undefined && { textBody }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    // Clear the cache for this template
    clearTemplateCache(template.type);

    console.log(`[Admin] Updated email template: ${template.name} by ${user.email}`);

    return NextResponse.json({
      success: true,
      template,
      message: 'Template updated successfully. Cache cleared.'
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    return NextResponse.json(
      { error: 'Failed to update email template' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/email-templates/[templateId]/preview
 * Preview an email template with sample data
 */
export async function POST(
  request: NextRequest,
  { params: paramsPromise }: { params: Promise<{ templateId: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user || !user.roles?.includes('ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const params = await paramsPromise;
    const body = await request.json();
    const { sampleData } = body;

    const template = await prisma.emailTemplate.findUnique({
      where: { id: params.templateId },
    });

    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    // Render the template with sample data
    const Handlebars = require('handlebars');

    const renderedSubject = Handlebars.compile(template.subject)(sampleData || {});
    const renderedHtml = Handlebars.compile(template.htmlBody)(sampleData || {});
    const renderedText = template.textBody
      ? Handlebars.compile(template.textBody)(sampleData || {})
      : undefined;

    return NextResponse.json({
      subject: renderedSubject,
      htmlBody: renderedHtml,
      textBody: renderedText,
    });
  } catch (error) {
    console.error('Error previewing email template:', error);
    return NextResponse.json(
      { error: 'Failed to preview email template' },
      { status: 500 }
    );
  }
}
