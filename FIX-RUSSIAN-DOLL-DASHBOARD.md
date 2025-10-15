# 🚨 CRITICAL: Fix Russian Doll Dashboard Issue

## Problem
The unified dashboard at `/dashboard` uses iframes to embed `/client/dashboard` and `/fixer/dashboard`. Each of these dashboards also has the full page layout (header, etc.), creating a nested "Russian doll" effect with multiple headers/layouts stacked.

## Root Cause
**File:** `app/dashboard/UnifiedDashboard.tsx`
**Lines 89-90 and 103-104:**
```tsx
<iframe src="/client/dashboard" ... />
<iframe src="/fixer/dashboard" ... />
```

This loads the FULL dashboard pages (with layouts) inside iframes, which themselves have layouts, creating infinite nesting.

## Solution
**DON'T use iframes.** Instead, extract the dashboard content and render it directly.

### Approach 1: Simple Redirect (Quick Fix)
For dual-role users, just redirect them to one dashboard (e.g., client) and add a link to switch to fixer mode.

**Modify:** `app/dashboard/page.tsx`
```tsx
export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/auth/login');

  const roles = user.roles || [user.role];

  // For dual-role users, default to client dashboard with switch option
  if (roles.includes('CLIENT')) {
    redirect('/client/dashboard');
  } else if (roles.includes('FIXER')) {
    redirect('/fixer/dashboard');
  } else if (roles.includes('ADMIN')) {
    redirect('/admin/dashboard');
  }

  redirect('/');
}
```

**Add to client/fixer dashboards:** A "Switch to Fixer/Client Mode" button in the header if user has both roles.

### Approach 2: Proper Unified Dashboard (Better UX)
Extract the dashboard CONTENT (not the full pages) and render tabs properly.

**Steps:**
1. Create `app/client/dashboard/DashboardContent.tsx` - Just the content, no layout
2. Create `app/fixer/dashboard/DashboardContent.tsx` - Just the content, no layout
3. Update `app/dashboard/UnifiedDashboard.tsx` to import and render these content components directly

**Example:**

```tsx
// app/client/dashboard/DashboardContent.tsx
'use client';
export default function ClientDashboardContent({ requests }: { requests: any[] }) {
  return (
    <div>
      {/* All the client dashboard UI - requests list, stats, etc. */}
      {/* NO header, NO layout wrapper */}
    </div>
  );
}

// app/dashboard/UnifiedDashboard.tsx
import ClientDashboardContent from '@/app/client/dashboard/DashboardContent';
import FixerDashboardContent from '@/app/fixer/dashboard/DashboardContent';

export default function UnifiedDashboard({ user, clientData, fixerData }) {
  const [activeTab, setActiveTab] = useState('CLIENT');

  return (
    <div>
      {/* Tabs */}
      <div>
        <button onClick={() => setActiveTab('CLIENT')}>My Requests</button>
        <button onClick={() => setActiveTab('FIXER')}>My Jobs</button>
      </div>

      {/* Content - NO IFRAMES! */}
      {activeTab === 'CLIENT' && <ClientDashboardContent requests={clientData} />}
      {activeTab === 'FIXER' && <FixerDashboardContent jobs={fixerData} />}
    </div>
  );
}

// app/dashboard/page.tsx (server component)
export default async function DashboardPage() {
  const user = await getCurrentUser();

  // Fetch data for both dashboards
  const clientData = await fetchClientData(user.id);
  const fixerData = await fetchFixerData(user.id);

  return (
    <DashboardLayoutWithHeader>
      <UnifiedDashboard user={user} clientData={clientData} fixerData={fixerData} />
    </DashboardLayoutWithHeader>
  );
}
```

## Recommended Fix
**Use Approach 1 (Simple Redirect)** for now - it's fastest and safest.

Then, if you want tabs later, implement Approach 2 properly by extracting content components.

## Files to Modify

### Immediate Fix (Approach 1):
1. `app/dashboard/page.tsx` - Change to redirect based on primary role
2. Delete or archive `app/dashboard/UnifiedDashboard.tsx` - Not needed
3. `app/client/dashboard/page.tsx` - Add "Switch to Fixer Mode" button if user has FIXER role
4. `app/fixer/dashboard/page.tsx` - Add "Switch to Client Mode" button if user has CLIENT role

### Proper Fix (Approach 2):
1. Extract `app/client/dashboard/page.tsx` content to `DashboardContent.tsx`
2. Extract `app/fixer/dashboard/page.tsx` content to `DashboardContent.tsx`
3. Update `app/dashboard/UnifiedDashboard.tsx` to use content components (not iframes)
4. Update `app/dashboard/page.tsx` to fetch data and pass to UnifiedDashboard

## Testing
After fix:
1. Login as dual-role user (fixi-test3)
2. Go to `/dashboard`
3. Should see ONE header, ONE layout
4. NO nested iframes
5. Clean, simple dashboard

## Priority
**CRITICAL** - This breaks the UX and creates performance issues with nested iframes.

## Estimated Time
- Approach 1: 15 minutes
- Approach 2: 1-2 hours
