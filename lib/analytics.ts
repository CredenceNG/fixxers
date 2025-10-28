import { prisma } from './prisma';
import { ActivityAction } from '@prisma/client';
import { NextRequest } from 'next/server';

/**
 * Track user activity
 * @param userId - User ID (optional for anonymous tracking)
 * @param action - Type of activity (LOGIN, PAGE_VIEW, etc.)
 * @param page - Page URL or identifier
 * @param metadata - Additional data to store
 * @param request - NextRequest object for IP/UserAgent (optional)
 * @param sessionId - Session identifier for tracking user sessions
 */
export async function trackActivity(
  userId: string | null | undefined,
  action: ActivityAction,
  page?: string,
  metadata?: Record<string, any>,
  request?: NextRequest,
  sessionId?: string
) {
  try {
    // Extract IP and User Agent from request if provided
    let ipAddress: string | undefined;
    let userAgent: string | undefined;

    if (request) {
      ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
                  request.headers.get('x-real-ip') ||
                  undefined;
      userAgent = request.headers.get('user-agent') || undefined;
    }

    await prisma.userActivity.create({
      data: {
        userId: userId || undefined,
        action,
        page,
        ipAddress,
        userAgent,
        sessionId: sessionId || undefined,
        metadata: metadata || undefined,
      },
    });
  } catch (error) {
    // Silently fail to not break the main flow
    console.error('[Analytics] Failed to track activity:', error);
  }
}

/**
 * Track page view
 */
export async function trackPageView(
  userId: string | null | undefined,
  page: string,
  request?: NextRequest
) {
  return trackActivity(userId, 'PAGE_VIEW', page, undefined, request);
}

/**
 * Track user login
 */
export async function trackLogin(
  userId: string,
  method: string,
  request?: NextRequest
) {
  return trackActivity(userId, 'LOGIN', '/auth/verify', { method }, request);
}

/**
 * Track user logout
 */
export async function trackLogout(
  userId: string,
  request?: NextRequest
) {
  return trackActivity(userId, 'LOGOUT', undefined, undefined, request);
}

/**
 * Get analytics insights
 */
export async function getAnalyticsInsights(days: number = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Daily active users
    const dailyActiveUsers = await prisma.userActivity.groupBy({
      by: ['userId'],
      where: {
        createdAt: { gte: startDate },
        userId: { not: null },
      },
      _count: true,
    });

  // Total page views
  const pageViews = await prisma.userActivity.count({
    where: {
      action: 'PAGE_VIEW',
      createdAt: { gte: startDate },
    },
  });

  // Total logins
  const logins = await prisma.userActivity.count({
    where: {
      action: 'LOGIN',
      createdAt: { gte: startDate },
    },
  });

  // Most visited pages
  const popularPages = await prisma.userActivity.groupBy({
    by: ['page'],
    where: {
      action: 'PAGE_VIEW',
      createdAt: { gte: startDate },
      page: { not: null },
    },
    _count: true,
    orderBy: {
      _count: {
        page: 'desc',
      },
    },
    take: 10,
  });

  // Recent activities
  const recentActivities = await prisma.userActivity.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          roles: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: 50,
  });

  // Activity by action type
  const activityByType = await prisma.userActivity.groupBy({
    by: ['action'],
    where: {
      createdAt: { gte: startDate },
    },
    _count: true,
  });

    return {
      dailyActiveUsers: dailyActiveUsers.length,
      totalPageViews: pageViews,
      totalLogins: logins,
      popularPages: popularPages.map((p) => ({
        page: p.page,
        views: p._count,
      })),
      recentActivities,
      activityByType: activityByType.map((a) => ({
        action: a.action,
        count: a._count,
      })),
    };
  } catch (error) {
    console.error('[Analytics] Failed to get insights:', error);
    // Return empty data if table doesn't exist yet
    return {
      dailyActiveUsers: 0,
      totalPageViews: 0,
      totalLogins: 0,
      popularPages: [],
      recentActivities: [],
      activityByType: [],
    };
  }
}

/**
 * Get daily activity trends
 */
export async function getDailyTrends(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await prisma.userActivity.findMany({
    where: {
      createdAt: { gte: startDate },
    },
    select: {
      createdAt: true,
      action: true,
      userId: true,
    },
  });

  // Group by date
  const dailyData: Record<string, { date: string; logins: number; pageViews: number; activeUsers: Set<string> }> = {};

  activities.forEach((activity) => {
    const dateKey = activity.createdAt.toISOString().split('T')[0];

    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        logins: 0,
        pageViews: 0,
        activeUsers: new Set(),
      };
    }

    if (activity.action === 'LOGIN') {
      dailyData[dateKey].logins++;
    }
    if (activity.action === 'PAGE_VIEW') {
      dailyData[dateKey].pageViews++;
    }
    if (activity.userId) {
      dailyData[dateKey].activeUsers.add(activity.userId);
    }
  });

    return Object.values(dailyData).map((day) => ({
      date: day.date,
      logins: day.logins,
      pageViews: day.pageViews,
      activeUsers: day.activeUsers.size,
    })).sort((a, b) => a.date.localeCompare(b.date));
  } catch (error) {
    console.error('[Analytics] Failed to get daily trends:', error);
    return [];
  }
}

/**
 * Get average session duration in minutes
 * Calculates based on time between first and last activity per session
 */
export async function getAverageSessionDuration(days: number = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all activities grouped by sessionId
    const activities = await prisma.userActivity.findMany({
    where: {
      createdAt: { gte: startDate },
      sessionId: { not: null },
    },
    select: {
      sessionId: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  if (activities.length === 0) {
    return 0;
  }

  // Group by sessionId and calculate duration
  const sessionDurations: Record<string, { start: Date; end: Date }> = {};

  activities.forEach((activity) => {
    const sessionId = activity.sessionId!;

    if (!sessionDurations[sessionId]) {
      sessionDurations[sessionId] = {
        start: activity.createdAt,
        end: activity.createdAt,
      };
    } else {
      sessionDurations[sessionId].end = activity.createdAt;
    }
  });

  // Calculate average duration in minutes
  const durations = Object.values(sessionDurations).map((session) => {
    const durationMs = session.end.getTime() - session.start.getTime();
    return durationMs / (1000 * 60); // Convert to minutes
  });

    const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);
    const averageDuration = totalDuration / durations.length;

    return Math.round(averageDuration);
  } catch (error) {
    console.error('[Analytics] Failed to get average session duration:', error);
    return 0;
  }
}

/**
 * Get session statistics
 */
export async function getSessionStats(days: number = 7) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await prisma.userActivity.findMany({
    where: {
      createdAt: { gte: startDate },
      sessionId: { not: null },
    },
    select: {
      sessionId: true,
      createdAt: true,
      action: true,
    },
  });

  // Group by sessionId
  const sessions: Record<string, { start: Date; end: Date; actions: number; pages: Set<string> }> = {};

  activities.forEach((activity) => {
    const sessionId = activity.sessionId!;

    if (!sessions[sessionId]) {
      sessions[sessionId] = {
        start: activity.createdAt,
        end: activity.createdAt,
        actions: 0,
        pages: new Set(),
      };
    }

    sessions[sessionId].end = activity.createdAt;
    sessions[sessionId].actions++;
  });

    const sessionData = Object.values(sessions);

    return {
      totalSessions: sessionData.length,
      averageDuration: sessionData.length > 0
        ? Math.round(sessionData.reduce((sum, s) => sum + (s.end.getTime() - s.start.getTime()), 0) / sessionData.length / 1000 / 60)
        : 0,
      averageActionsPerSession: sessionData.length > 0
        ? Math.round(sessionData.reduce((sum, s) => sum + s.actions, 0) / sessionData.length)
        : 0,
    };
  } catch (error) {
    console.error('[Analytics] Failed to get session stats:', error);
    return {
      totalSessions: 0,
      averageDuration: 0,
      averageActionsPerSession: 0,
    };
  }
}

/**
 * Get user journey paths
 * Analyzes common page sequences in user sessions
 */
export async function getUserJourneyPaths(days: number = 7, limit: number = 10) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all page views grouped by session
    const activities = await prisma.userActivity.findMany({
    where: {
      createdAt: { gte: startDate },
      action: 'PAGE_VIEW',
      sessionId: { not: null },
      page: { not: null },
    },
    select: {
      sessionId: true,
      page: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  // Group by session
  const sessions: Record<string, string[]> = {};

  activities.forEach((activity) => {
    const sessionId = activity.sessionId!;
    if (!sessions[sessionId]) {
      sessions[sessionId] = [];
    }
    // Only add if different from last page (avoid duplicates)
    const lastPage = sessions[sessionId][sessions[sessionId].length - 1];
    if (activity.page && activity.page !== lastPage) {
      sessions[sessionId].push(activity.page);
    }
  });

  // Count path frequencies (first 3 pages in journey)
  const pathCounts: Record<string, number> = {};

  Object.values(sessions).forEach((path) => {
    if (path.length >= 2) {
      // Take first 3 pages as the journey
      const journey = path.slice(0, 3).join(' → ');
      pathCounts[journey] = (pathCounts[journey] || 0) + 1;
    }
  });

    // Sort by frequency and return top paths
    return Object.entries(pathCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([path, count]) => ({ path, count }));
  } catch (error) {
    console.error('[Analytics] Failed to get user journey paths:', error);
    return [];
  }
}

/**
 * Get currently active users (logged in within last 15 minutes)
 */
export async function getActiveUsersNow() {
  try {
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000);

    const activeUserIds = await prisma.userActivity.findMany({
    where: {
      createdAt: { gte: fifteenMinutesAgo },
      userId: { not: null },
    },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    return activeUserIds.length;
  } catch (error) {
    console.error('[Analytics] Failed to get active users now:', error);
    return 0;
  }
}
