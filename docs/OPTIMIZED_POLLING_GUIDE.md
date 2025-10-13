# Optimized Polling Guide

## Overview

This guide explains how to implement optimized polling for message components and other real-time features in the application. The optimized polling approach prevents page jumping, reduces server load, and provides a better user experience.

## Problem Solved

Traditional polling approaches cause several issues:
- **Page Jumping**: Constant re-renders and smooth scrolling create visual displacement
- **High Server Load**: Polling every 3-5 seconds creates unnecessary requests
- **Poor UX**: Users experience discomfort from constant movement
- **Resource Waste**: Polling continues even when user is on different tab

## Solution

Our optimized polling system uses:
1. **Reduced Frequency**: 30 seconds instead of 5 seconds (83% reduction)
2. **Silent Updates**: Background updates don't trigger animations
3. **Visibility API**: Only refreshes when user returns to tab
4. **CSS Containment**: Prevents layout shifts from affecting parent elements
5. **Instant Scrolling**: No smooth scroll animations on polling updates

## Usage

### 1. Import the Hook

```typescript
import { useOptimizedPolling, STABLE_MESSAGE_STYLES } from '@/hooks/useOptimizedPolling';
```

### 2. Implement in Your Component

```typescript
export function YourMessageComponent({ id, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const lastMessageCountRef = useRef(0);

  const fetchMessages = async (silent = false) => {
    try {
      const response = await fetch(`/api/your-endpoint/${id}/messages`);
      if (response.ok) {
        const data = await response.json();
        const newMessages = data.messages || [];

        // Only update if count changed
        if (newMessages.length !== messages.length) {
          const hasNewMessages = newMessages.length > lastMessageCountRef.current;
          setMessages(newMessages);
          lastMessageCountRef.current = newMessages.length;

          // Only scroll on genuine new messages, not silent updates
          if (hasNewMessages && !silent) {
            setTimeout(scrollToBottom, 50);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  // Use the optimized polling hook
  useOptimizedPolling(fetchMessages, 30000, [id]);

  // Rest of your component...
}
```

### 3. Apply Stable Styles

Apply the stable styles to your message containers to prevent layout shifts:

```typescript
<div style={{
  ...yourStyles,
  ...STABLE_MESSAGE_STYLES.container,  // Prevents layout shifts
}}>
  <div style={{
    ...yourScrollStyles,
    ...STABLE_MESSAGE_STYLES.scrollContainer,  // Prevents smooth scroll
  }}>
    {/* Your messages */}
  </div>
</div>
```

### 4. Use Instant Scrolling

Always use instant scroll behavior for automatic updates:

```typescript
const scrollToBottom = () => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
};
```

## API Reference

### `useOptimizedPolling`

```typescript
useOptimizedPolling(
  fetchFn: (silent?: boolean) => Promise<void>,
  interval?: number,  // Default: 30000ms (30s)
  dependencies?: any[]  // Default: []
)
```

**Parameters:**
- `fetchFn`: Your fetch function that accepts a `silent` parameter
  - `silent=true`: Background update, don't trigger animations
  - `silent=false`: User-initiated or initial load, can trigger animations
- `interval`: Polling interval in milliseconds (default: 30000)
- `dependencies`: Array of dependencies that should restart polling

**Features:**
- Automatically handles visibility changes
- Cleans up intervals on unmount
- Silent updates on polling
- Visible updates on tab return

### `STABLE_MESSAGE_STYLES`

Pre-configured styles to prevent layout shifts:

```typescript
{
  container: {
    willChange: 'auto',
    contain: 'layout style',
  },
  scrollContainer: {
    scrollBehavior: 'auto',
  },
}
```

## Components Using This Pattern

### Current Implementations:
1. ✅ `/app/client/requests/RequestMessages.tsx`
2. ✅ `/app/fixer/orders/[orderId]/MessagesThread.tsx`
3. ✅ `/app/client/orders/[orderId]/MessagesThread.tsx`

### Future Components:
When creating new message or real-time components, follow this pattern to ensure consistent UX across the application.

## Best Practices

### DO ✅
- Use `silent` parameter to distinguish polling vs user actions
- Only scroll on genuine new messages
- Use `lastMessageCountRef` to track changes
- Apply `STABLE_MESSAGE_STYLES` to containers
- Use instant scroll for automatic updates
- Keep polling interval at 30s or higher

### DON'T ❌
- Don't use smooth scroll on polling updates
- Don't trigger re-renders if data hasn't changed
- Don't poll more frequently than 30s without good reason
- Don't forget to apply stable styles
- Don't stringify entire message arrays for comparison

## Performance Benefits

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Polling Frequency | 5s | 30s | 83% reduction |
| Requests per Hour | 720 | 120 | 83% reduction |
| Visual Jumps | Constant | None | 100% elimination |
| Tab Idle Polling | Active | Paused | 100% when idle |

## Troubleshooting

### Page Still Jumping?
1. Verify `STABLE_MESSAGE_STYLES` are applied to containers
2. Check that `behavior: 'instant'` is used for auto-scroll
3. Ensure `silent` parameter is properly passed
4. Verify no other components are causing re-renders

### Messages Not Updating?
1. Check browser console for fetch errors
2. Verify API endpoint is working
3. Check dependencies array in `useOptimizedPolling`
4. Verify `lastMessageCountRef` is tracking correctly

### High Server Load?
1. Ensure interval is set to 30000ms or higher
2. Check that visibility API is working (no polling on hidden tabs)
3. Verify only one polling instance per component

## Future Enhancements

### Potential Improvements:
1. **WebSocket Integration**: Replace polling with real-time WebSocket connections
2. **Server-Sent Events (SSE)**: Use SSE for server-push updates
3. **Notification-Driven Updates**: Leverage existing notification system to trigger message refreshes
4. **Smart Polling**: Increase frequency when user is actively chatting, decrease when idle

## Migration Guide

To migrate existing message components:

1. **Replace imports:**
   ```diff
   - import { useState, useEffect, useRef } from 'react';
   + import { useState, useRef } from 'react';
   + import { useOptimizedPolling, STABLE_MESSAGE_STYLES } from '@/hooks/useOptimizedPolling';
   ```

2. **Replace useEffect with hook:**
   ```diff
   - useEffect(() => {
   -   fetchMessages();
   -   const interval = setInterval(fetchMessages, 5000);
   -   return () => clearInterval(interval);
   - }, [id]);
   + useOptimizedPolling(fetchMessages, 30000, [id]);
   ```

3. **Update fetchMessages:**
   ```diff
   - const fetchMessages = async () => {
   + const fetchMessages = async (silent = false) => {
       // ... fetch logic
   -     setTimeout(scrollToBottom, 100);
   +     if (hasNewMessages && !silent) {
   +       setTimeout(scrollToBottom, 50);
   +     }
     };
   ```

4. **Apply stable styles:**
   ```diff
   - <div style={{ ...yourStyles }}>
   + <div style={{ ...yourStyles, ...STABLE_MESSAGE_STYLES.container }}>
   ```

5. **Update scroll behavior:**
   ```diff
   - messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
   + messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
   ```

## Support

For questions or issues with the optimized polling pattern, please:
1. Check this guide first
2. Review existing implementations in the codebase
3. Test in different browsers and scenarios
4. Document any new patterns or improvements

---

**Last Updated**: December 2024
**Maintained By**: Development Team
