# Settings Page Client Component Fix

## Error Encountered

```
You're importing a component that needs "next/headers". That only works in a Server Component which is not supported in the pages/ directory.

Import traces:
  Client Component Browser:
    ./lib/auth.ts [Client Component Browser]
    ./components/Header.tsx [Client Component Browser]
    ./components/DashboardLayoutWithHeader.tsx [Client Component Browser]
    ./app/settings/page.tsx [Client Component Browser]
```

## Root Cause

The Settings page was a **Client Component** (`'use client'`) because it needed:

- `useState` for managing toggle states
- `useEffect` for fetching settings
- Event handlers for save/toggle buttons

However, it was also importing `DashboardLayoutWithHeader`, which includes the `Header` component that uses `next/headers` (a server-only API via `cookies()`).

**The Conflict**:

- Client Components can't use server-only APIs like `next/headers`
- But the page needed client-side interactivity

## Solution

Extracted interactive parts into a separate Client Component and converted the main page to a Server Component:

### 1. Created `SettingsForm.tsx` (Client Component)

**File**: `/app/settings/SettingsForm.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
// ... imports

export default function SettingsForm() {
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [settings, setSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
  });

  // All interactive logic here:
  // - useEffect to fetch settings
  // - handleToggle for switches
  // - handleSave for saving

  return (
    // Form UI with toggles and save button
  );
}
```

**Contains**:

- ✅ All `useState` hooks
- ✅ All `useEffect` hooks
- ✅ All event handlers (`onClick`)
- ✅ Loading states and API calls
- ✅ Toast notifications

### 2. Converted `page.tsx` to Server Component

**File**: `/app/settings/page.tsx`

**Before** (Client Component - ❌ Error):

```tsx
"use client"; // ❌ Can't use DashboardLayoutWithHeader

import { useState, useEffect } from "react";
import DashboardLayoutWithHeader from "@/components/DashboardLayoutWithHeader";

export default function SettingsPage() {
  // ... all interactive logic

  return <DashboardLayoutWithHeader>// ... form UI</DashboardLayoutWithHeader>;
}
```

**After** (Server Component - ✅ Fixed):

```tsx
// No 'use client' directive - Server Component by default

import Link from "next/link";
import DashboardLayoutWithHeader from "@/components/DashboardLayoutWithHeader";
import SettingsForm from "./SettingsForm"; // Client Component

export default function SettingsPage() {
  return (
    <DashboardLayoutWithHeader
      title="Settings"
      subtitle="Manage your notification preferences and account settings"
      actions={<Link href="/settings/referral">🎁 View Referrals</Link>}
    >
      <div>
        {/* Referral banner */}
        <SettingsForm /> {/* Client Component handles interactivity */}
      </div>
    </DashboardLayoutWithHeader>
  );
}
```

## Component Architecture

```
┌─────────────────────────────────────────────────────┐
│  SettingsPage (Server Component)                    │
│  - Uses DashboardLayoutWithHeader                   │
│  - Renders static content (banner, links)           │
│  - Can access server-only APIs                      │
│                                                      │
│  ┌───────────────────────────────────────────────┐  │
│  │  SettingsForm (Client Component)              │  │
│  │  - useState for settings state                │  │
│  │  - useEffect for fetching data                │  │
│  │  - onClick handlers for toggles/save          │  │
│  │  - Toast notifications                        │  │
│  └───────────────────────────────────────────────┘  │
│                                                      │
│  DashboardLayoutWithHeader (Server Component)       │
│  ├── Header (uses next/headers)                     │
│  └── DashboardLayout                                │
└─────────────────────────────────────────────────────┘
```

## Why This Architecture?

### Server Component (SettingsPage)

- ✅ Can use `DashboardLayoutWithHeader` (which uses `next/headers`)
- ✅ Renders SEO-friendly static content
- ✅ Reduces JavaScript bundle sent to client
- ✅ Can access server-only APIs if needed

### Client Component (SettingsForm)

- ✅ Handles user interactions (toggles, save)
- ✅ Manages local state (settings, loading)
- ✅ Makes API calls to `/api/settings`
- ✅ Shows toast notifications
- ✅ Isolated interactivity - only this part loads JS

## Pattern: Server + Client Components

This is a common Next.js 15 pattern:

```tsx
// page.tsx (Server Component)
import ClientComponent from "./ClientComponent";

export default function Page() {
  // Server-side logic, data fetching, etc.

  return (
    <ServerLayoutComponent>
      <StaticContent />
      <ClientComponent /> {/* Interactive parts */}
    </ServerLayoutComponent>
  );
}
```

```tsx
// ClientComponent.tsx (Client Component)
"use client";

export default function ClientComponent() {
  const [state, setState] = useState();

  return <InteractiveUI />;
}
```

## Benefits

1. **Best of Both Worlds**:
   - Server Components for layout/structure
   - Client Components for interactivity

2. **Performance**:
   - Less JavaScript shipped to browser
   - Only interactive parts are hydrated

3. **Developer Experience**:
   - Clear separation of concerns
   - Easy to identify what runs where

4. **Maintainability**:
   - Interactive logic isolated in one file
   - Layout/structure in another

## Testing

1. Visit http://localhost:3010/settings
2. **Expected**:
   - ✅ Page loads with dashboard header
   - ✅ Settings form renders
   - ✅ Toggles work (click to switch)
   - ✅ Save button functional
   - ✅ Toast notifications appear
   - ✅ No console errors

## Files Created/Modified

1. **Created**: `/app/settings/SettingsForm.tsx`
   - New Client Component for interactive form
2. **Modified**: `/app/settings/page.tsx`
   - Removed `'use client'` directive
   - Removed all interactive logic
   - Now imports and renders `SettingsForm`
   - Simplified to layout and static content

## Summary

Converted Settings page from a monolithic Client Component to a hybrid Server + Client Component architecture:

- **Server Component** (`page.tsx`): Layout, structure, header
- **Client Component** (`SettingsForm.tsx`): Interactive form

This resolves the `next/headers` conflict while maintaining all functionality. ✅
