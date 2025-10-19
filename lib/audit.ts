import { prisma } from '@/lib/prisma';
import { AuditAction } from '@prisma/client';
import { NextRequest } from 'next/server';

interface CreateAuditLogParams {
  performedBy: string;
  action: AuditAction;
  targetType: string;
  targetId?: string;
  description?: string;
  metadata?: Record<string, any>;
  request?: NextRequest;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog({
  performedBy,
  action,
  targetType,
  targetId,
  description,
  metadata,
  request,
}: CreateAuditLogParams) {
  try {
    // Extract IP address and user agent from request if provided
    let ipAddress: string | undefined;
    let userAgent: string | undefined;

    if (request) {
      // Get IP address
      ipAddress =
        request.headers.get('x-forwarded-for')?.split(',')[0] ||
        request.headers.get('x-real-ip') ||
        undefined;

      // Get user agent
      userAgent = request.headers.get('user-agent') || undefined;
    }

    const auditLog = await prisma.auditLog.create({
      data: {
        performedBy,
        action,
        targetType,
        targetId,
        description,
        metadata,
        ipAddress,
        userAgent,
      },
    });

    console.log(`[Audit Log] ${action} on ${targetType}${targetId ? ` (${targetId})` : ''} by ${performedBy}`);

    return auditLog;
  } catch (error) {
    console.error('[Audit Log] Failed to create audit log:', error);
    // Don't throw - audit logging should not break the main operation
    return null;
  }
}

/**
 * Log user management actions
 */
export async function logUserAction(
  performedBy: string,
  action: AuditAction,
  userId: string,
  description?: string,
  metadata?: Record<string, any>,
  request?: NextRequest
) {
  return createAuditLog({
    performedBy,
    action,
    targetType: 'User',
    targetId: userId,
    description,
    metadata,
    request,
  });
}

/**
 * Log fixer management actions
 */
export async function logFixerAction(
  performedBy: string,
  action: AuditAction,
  fixerId: string,
  description?: string,
  metadata?: Record<string, any>,
  request?: NextRequest
) {
  return createAuditLog({
    performedBy,
    action,
    targetType: 'Fixer',
    targetId: fixerId,
    description,
    metadata,
    request,
  });
}

/**
 * Log badge management actions
 */
export async function logBadgeAction(
  performedBy: string,
  action: AuditAction,
  badgeRequestId: string,
  description?: string,
  metadata?: Record<string, any>,
  request?: NextRequest
) {
  return createAuditLog({
    performedBy,
    action,
    targetType: 'BadgeRequest',
    targetId: badgeRequestId,
    description,
    metadata,
    request,
  });
}

/**
 * Log order management actions
 */
export async function logOrderAction(
  performedBy: string,
  action: AuditAction,
  orderId: string,
  description?: string,
  metadata?: Record<string, any>,
  request?: NextRequest
) {
  return createAuditLog({
    performedBy,
    action,
    targetType: 'Order',
    targetId: orderId,
    description,
    metadata,
    request,
  });
}

/**
 * Log gig management actions
 */
export async function logGigAction(
  performedBy: string,
  action: AuditAction,
  gigId: string,
  description?: string,
  metadata?: Record<string, any>,
  request?: NextRequest
) {
  return createAuditLog({
    performedBy,
    action,
    targetType: 'Gig',
    targetId: gigId,
    description,
    metadata,
    request,
  });
}

/**
 * Log review moderation actions
 */
export async function logReviewAction(
  performedBy: string,
  action: AuditAction,
  reviewId: string,
  description?: string,
  metadata?: Record<string, any>,
  request?: NextRequest
) {
  return createAuditLog({
    performedBy,
    action,
    targetType: 'Review',
    targetId: reviewId,
    description,
    metadata,
    request,
  });
}

/**
 * Log report management actions
 */
export async function logReportAction(
  performedBy: string,
  action: AuditAction,
  reportId: string,
  description?: string,
  metadata?: Record<string, any>,
  request?: NextRequest
) {
  return createAuditLog({
    performedBy,
    action,
    targetType: 'Report',
    targetId: reportId,
    description,
    metadata,
    request,
  });
}

/**
 * Log agent management actions
 */
export async function logAgentAction(
  performedBy: string,
  action: AuditAction,
  agentId: string,
  description?: string,
  metadata?: Record<string, any>,
  request?: NextRequest
) {
  return createAuditLog({
    performedBy,
    action,
    targetType: 'Agent',
    targetId: agentId,
    description,
    metadata,
    request,
  });
}

/**
 * Log email template actions
 */
export async function logEmailTemplateAction(
  performedBy: string,
  action: AuditAction,
  templateId: string,
  description?: string,
  metadata?: Record<string, any>,
  request?: NextRequest
) {
  return createAuditLog({
    performedBy,
    action,
    targetType: 'EmailTemplate',
    targetId: templateId,
    description,
    metadata,
    request,
  });
}

/**
 * Log system settings actions
 */
export async function logSettingsAction(
  performedBy: string,
  action: AuditAction,
  description?: string,
  metadata?: Record<string, any>,
  request?: NextRequest
) {
  return createAuditLog({
    performedBy,
    action,
    targetType: 'Settings',
    description,
    metadata,
    request,
  });
}

/**
 * Log category management actions
 */
export async function logCategoryAction(
  performedBy: string,
  action: AuditAction,
  categoryId: string,
  description?: string,
  metadata?: Record<string, any>,
  request?: NextRequest
) {
  return createAuditLog({
    performedBy,
    action,
    targetType: 'Category',
    targetId: categoryId,
    description,
    metadata,
    request,
  });
}

/**
 * Log financial operations
 */
export async function logFinancialAction(
  performedBy: string,
  action: AuditAction,
  targetId: string,
  description?: string,
  metadata?: Record<string, any>,
  request?: NextRequest
) {
  return createAuditLog({
    performedBy,
    action,
    targetType: 'Financial',
    targetId,
    description,
    metadata,
    request,
  });
}

/**
 * Get audit logs with filters
 */
export async function getAuditLogs({
  performedBy,
  action,
  targetType,
  targetId,
  startDate,
  endDate,
  limit = 100,
  offset = 0,
}: {
  performedBy?: string;
  action?: AuditAction;
  targetType?: string;
  targetId?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const where: any = {};

  if (performedBy) where.performedBy = performedBy;
  if (action) where.action = action;
  if (targetType) where.targetType = targetType;
  if (targetId) where.targetId = targetId;
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = startDate;
    if (endDate) where.createdAt.lte = endDate;
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            roles: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total };
}
