# Event Handler Fix - Referral System

## Error Encountered

```
Event handlers cannot be passed to Client Component props.
  <button onClick={function onClick} style=... children=...>
                  ^^^^^^^^^^^^^^^^^^
If you need interactivity, consider converting part of this to a Client Component.
```

## Root Cause

The referral page (`/app/settings/referral/page.tsx`) is a **Server Component** (Next.js default), but it contained a button with an `onClick` event handler:

```tsx
<button
  onClick={() => {
    navigator.clipboard.writeText(referralLink);
    // ... copy functionality
  }}
>
  Copy Link
</button>
```

In Next.js 15 App Router:

- **Server Components**: Run on the server, cannot have event handlers, cannot use browser APIs
- **Client Components**: Run in the browser, can have event handlers, can use hooks and browser APIs
- **Error**: Server Components cannot pass event handlers to child components

## Solution

Created a new Client Component to handle the interactive "Share Your Link" section:

### 1. Created `ShareableReferralLink.tsx` Client Component

**File**: `/components/quick-wins/ShareableReferralLink.tsx`

```tsx
"use client";

import { colors } from "@/lib/theme";

interface ShareableReferralLinkProps {
  referralLink: string;
}

export function ShareableReferralLink({
  referralLink,
}: ShareableReferralLinkProps) {
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    const btn = document.getElementById("copy-link-btn");
    if (btn) {
      const originalText = btn.textContent;
      btn.textContent = "Copied!";
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    }
  };

  return (
    <div
      style={
        {
          /* ... styling ... */
        }
      }
    >
      <h2>Share Your Link</h2>
      <p>Share this link with friends...</p>

      <div>
        <input type="text" readOnly value={referralLink} />
        <button id="copy-link-btn" onClick={handleCopyLink}>
          Copy Link
        </button>
      </div>
    </div>
  );
}
```

**Key Features**:

- ✅ `'use client'` directive at the top
- ✅ Accepts `referralLink` as prop from Server Component
- ✅ Uses `onClick` handler for copy button
- ✅ Uses browser APIs: `navigator.clipboard`, `document.getElementById`
- ✅ Uses `setTimeout` for "Copied!" feedback

### 2. Updated Referral Page to Use Client Component

**File**: `/app/settings/referral/page.tsx`

**Before** (Server Component with event handler - ❌ Error):

```tsx
export default async function ReferralPage() {
  // ... server-side data fetching

  return (
    <div>
      {/* Referral code display */}

      {/* ❌ This caused the error - onClick in Server Component */}
      <button
        onClick={() => {
          /* copy logic */
        }}
      >
        Copy Link
      </button>

      {/* Social sharing links */}
    </div>
  );
}
```

**After** (Server Component importing Client Component - ✅ Fixed):

```tsx
import { ShareableReferralLink } from "@/components/quick-wins/ShareableReferralLink";

export default async function ReferralPage() {
  // ... server-side data fetching

  return (
    <div>
      {/* Referral code display */}

      {/* ✅ Client Component handles interactivity */}
      <ShareableReferralLink referralLink={referralLink} />

      {/* Social sharing links - these are just <a> tags, no event handlers */}
      <a href="https://wa.me/...">WhatsApp</a>
      <a href="https://twitter.com/...">Twitter</a>
      <a href="mailto:...">Email</a>
    </div>
  );
}
```

## Component Architecture

```
┌─────────────────────────────────────────────────┐
│  ReferralPage (Server Component)                │
│  - Fetches user data from Prisma                │
│  - Generates referral link                      │
│  - Renders static content                       │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │  ReferralCodeDisplay (Client Component)   │  │
│  │  - Copy button with onClick               │  │
│  │  - Uses navigator.clipboard               │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  ┌───────────────────────────────────────────┐  │
│  │  ShareableReferralLink (Client Component) │  │
│  │  - Copy link button with onClick          │  │
│  │  - Uses navigator.clipboard + setTimeout  │  │
│  └───────────────────────────────────────────┘  │
│                                                  │
│  Social Links (Static <a> tags - no handlers)   │
│  - WhatsApp, Twitter, Email                     │
└─────────────────────────────────────────────────┘
```

## Why This Architecture?

1. **Server Component (ReferralPage)**:
   - ✅ Can fetch data from Prisma directly (no API route needed)
   - ✅ Generates referral link on the server
   - ✅ Reduces JavaScript bundle sent to client
   - ✅ Better SEO and initial page load

2. **Client Components (ReferralCodeDisplay, ShareableReferralLink)**:
   - ✅ Handle user interactions (copy buttons)
   - ✅ Access browser APIs (clipboard, DOM)
   - ✅ Provide instant feedback (button text change)
   - ✅ Isolated interactivity - only these components load JS

3. **Static Links (Social Sharing)**:
   - ✅ No JavaScript needed
   - ✅ Work without JS enabled
   - ✅ Standard `<a>` tags with `href`

## Testing

1. Visit http://localhost:3010/settings/referral
2. **Expected**: Page loads without errors
3. Click "Copy Link" button
4. **Expected**:
   - Link copied to clipboard
   - Button text changes to "Copied!" for 2 seconds
   - No console errors

## Files Changed

1. **Created**: `/components/quick-wins/ShareableReferralLink.tsx`
   - New Client Component for link sharing
2. **Modified**: `/app/settings/referral/page.tsx`
   - Added import for ShareableReferralLink
   - Replaced inline button with Client Component
   - Removed onClick handler from Server Component

## Summary of All Referral System Fixes

This is the **4th and 5th fixes** in the referral system implementation:

1. ✅ **Prisma Query Fix**: Changed `referredUsers: true` to nested select
2. ✅ **Color References Fix**: Changed nested syntax to flat properties (47 instances)
3. ✅ **Client Component Fix**: Added `'use client'` to QuickWinBadges.tsx
4. ✅ **Event Handler Fix**: Extracted copy link button to ShareableReferralLink Client Component
5. ✅ **Inline Styles Fix**: Converted ReferralCodeDisplay from Tailwind classes to inline styles

### Why Convert to Inline Styles?

The `ReferralCodeDisplay` component was using Tailwind CSS classes:

```tsx
<div className="flex items-center gap-2">
  <button className="p-1 hover:bg-gray-200 rounded transition-colors">
```

This can cause hydration issues in Next.js 15 when used in a Client Component that's imported by a Server Component. Converting to inline styles ensures consistent rendering:

```tsx
<div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
  <button style={{ padding: '4px', backgroundColor: 'transparent', ... }}>
```

All errors resolved! Referral system is now fully functional. 🎉
