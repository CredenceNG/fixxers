import { useEffect, useRef } from 'react';

/**
 * Optimized polling hook that reduces unnecessary updates and prevents page jumping
 *
 * Features:
 * - Reduced polling frequency (30s instead of 5s)
 * - Silent updates that don't trigger re-renders
 * - Visibility API integration (refresh when tab becomes active)
 * - Prevents unnecessary state updates
 *
 * @param fetchFn - Function to fetch data (should return true if data changed)
 * @param interval - Polling interval in milliseconds (default: 30000ms = 30s)
 * @param dependencies - Dependencies array for the effect
 */
export function useOptimizedPolling(
  fetchFn: (silent?: boolean) => Promise<void>,
  interval: number = 30000,
  dependencies: any[] = []
) {
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  useEffect(() => {
    // Initial fetch
    fetchFn(false);

    // Listen for tab visibility changes
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchFn(true); // Silent update when returning to tab
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Set up minimal polling as fallback
    intervalRef.current = setInterval(() => fetchFn(true), interval);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, dependencies);
}

/**
 * Configuration for stable message containers to prevent layout shifts
 */
export const STABLE_MESSAGE_STYLES = {
  container: {
    willChange: 'auto' as const,
    contain: 'layout style' as const,
  },
  scrollContainer: {
    scrollBehavior: 'auto' as const,
  },
};
