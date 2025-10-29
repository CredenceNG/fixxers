'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Client-side analytics tracker for page views
 * Tracks page navigation for authenticated users
 *
 * This runs client-side to avoid Prisma imports in middleware (Netlify limitation)
 */
export default function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    // Don't track API routes or Next.js internals
    if (pathname.startsWith('/api') || pathname.startsWith('/_next')) {
      return;
    }

    // Generate a simple session ID based on session start time
    const sessionId = sessionStorage.getItem('analytics_session_id') ||
      `session_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    if (!sessionStorage.getItem('analytics_session_id')) {
      sessionStorage.setItem('analytics_session_id', sessionId);
    }

    // Track page view (non-blocking)
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'PAGE_VIEW',
        page: pathname,
        sessionId,
      }),
    }).catch(err => {
      // Silently fail - don't break user experience
      console.debug('[Analytics] Failed to track page view:', err);
    });
  }, [pathname]);

  // This component renders nothing
  return null;
}
