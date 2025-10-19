# Unified Profile Design - Analysis & Implementation Plan

## Current Problem

### Field Duplication Analysis

**ClientProfile Fields:**
- streetAddress (optional)
- neighbourhood (required)
- city (required)
- state (required)
- country (required)
- primaryPhone (required)
- secondaryPhone (optional)
- alternateEmail (optional)

**FixerProfile Fields:**
- **ALL ClientProfile fields PLUS:**
- yearsOfService (required)
- qualifications[] (required)
- approvedAt (system field)
- pendingChanges (system field)

### The Problem:
1. **Dual-role users fill the same fields twice** (name, location, phones)
2. **Existing clients upgrading to fixer** must re-enter everything
3. **Data inconsistency risk** if user updates one profile but not the other
4. **Poor UX** - unnecessary repetition

---

## Proposed Solution: Single Unified Profile Form

### Core Principle:
**"One user, one profile form"** - Dynamically show/hide sections based on roles

### Profile Form Structure:

```
┌─────────────────────────────────────────────────┐
│  Complete Your Profile                          │
├─────────────────────────────────────────────────┤
│                                                 │
│  BASIC INFORMATION (All users)                  │
│  ├─ Full Name            [from User.name]       │
│  ├─ Primary Phone        *                      │
│  ├─ Secondary Phone      (optional)             │
│  └─ Alternate Email      (optional)             │
│                                                 │
│  LOCATION (All users)                           │
│  ├─ Country              *                      │
│  ├─ State                *                      │
│  ├─ Neighbourhood        * (dropdown)           │
│  └─ Street Address       (optional)             │
│                                                 │
│  [IF FIXER role included]                       │
│  SERVICE PROVIDER DETAILS                       │
│  ├─ Years of Service     *                      │
│  ├─ Qualifications       * (multi-select)       │
│  ├─ Service Categories   * (handled separately) │
│  └─ Service Areas        * (handled separately) │
│                                                 │
│  [Submit Button]                                │
└─────────────────────────────────────────────────┘
```

---

## User Journey Paths

### Path 1: New Client-Only User
```
Registration (CLIENT role)
    ↓
Email Verification
    ↓
[Unified Profile Form]
  - Basic Information
  - Location
  ↓
Client Dashboard
```

### Path 2: New Fixer-Only User
```
Registration (FIXER role)
    ↓
Email Verification
    ↓
[Unified Profile Form]
  - Basic Information
  - Location
  - Service Provider Details ← Additional section
  ↓
Pending Approval Page (status: PENDING)
    ↓
[Admin approves]
    ↓
Fixer Dashboard (status: ACTIVE)
```

### Path 3: New Dual-Role User (CLIENT + FIXER)
```
Registration (CLIENT + FIXER roles)
    ↓
Email Verification
    ↓
[Unified Profile Form]
  - Basic Information
  - Location
  - Service Provider Details ← Shows because FIXER role present
  ↓
IF Fixer details provided:
    → Pending Approval Page
    → After approval: Unified Dashboard
ELSE (skipped fixer details):
    → Unified Dashboard (client features only until fixer approved)
```

### Path 4: Existing Client Upgrading to Fixer
```
Client Dashboard
    ↓
"Become a Service Provider" button/link
    ↓
[Profile Upgrade Form]
  - Basic Information (pre-filled, read-only)
  - Location (pre-filled, editable if needed)
  - Service Provider Details ← NEW section to fill
  ↓
Update User.roles (add FIXER)
Create FixerProfile (copies shared fields from ClientProfile)
    ↓
Pending Approval Page
    ↓
[Admin approves]
    ↓
Unified Dashboard (now shows both CLIENT and FIXER tabs)
```

### Path 5: Existing Fixer Downgrading/Adding Client Features
```
Fixer Dashboard
    ↓
(Automatic - no action needed)
    ↓
If fixer makes a service request or purchase:
    → System auto-creates ClientProfile from FixerProfile data
    → User.roles updated to include CLIENT
    ↓
Unified Dashboard (now shows both tabs)
```

---

## Implementation Strategy

### Phase 1: Create Unified Profile Form Component

**New File:** `app/profile/page.tsx`

```typescript
export default async function UnifiedProfilePage() {
  const user = await getCurrentUser();

  // Check what profiles exist
  const clientProfile = await getClientProfile(user.id);
  const fixerProfile = await getFixerProfile(user.id);

  // Determine what to show
  const hasClientRole = user.roles.includes('CLIENT');
  const hasFixerRole = user.roles.includes('FIXER');

  return <UnifiedProfileForm
    user={user}
    existingData={{
      client: clientProfile,
      fixer: fixerProfile
    }}
    showFixerSection={hasFixerRole}
  />;
}
```

### Phase 2: Update Profile API

**New Endpoint:** `POST /api/profile` (replaces separate client/fixer endpoints)

```typescript
// Handles both client and fixer data in one request
// Creates/updates ClientProfile and FixerProfile as needed
// Copies shared fields between profiles automatically
```

### Phase 3: Migration Strategy

**For Existing Users:**
1. Keep existing `/client/profile` and `/fixer/profile` routes (backward compatibility)
2. New registrations use `/profile`
3. Redirect old profile routes to new unified route with query param
4. Run migration script to sync existing profile data

### Phase 4: Add "Become a Fixer" Feature

**New Component:** "Upgrade to Service Provider" button in Client Dashboard

**Flow:**
1. Button opens modal/page
2. Shows only the additional fixer-specific fields
3. Basic info pre-filled (not editable)
4. On submit:
   - Add FIXER to User.roles
   - Create FixerProfile (copy shared fields from ClientProfile)
   - Set status to PENDING
   - Notify admins

---

## Database Schema Changes

### Option A: Keep Separate Tables (Recommended)
**Pros:**
- No breaking changes
- Clear separation of concerns
- Easy to query role-specific data

**Cons:**
- Duplicate fields in schema
- Need sync logic

**Implementation:**
```typescript
// When saving unified profile:
async function saveUnifiedProfile(userId, data) {
  const user = await prisma.user.findUnique({ where: { id: userId }});

  // Always save client profile if CLIENT role
  if (user.roles.includes('CLIENT')) {
    await prisma.clientProfile.upsert({
      where: { clientId: userId },
      update: { ...data.basicFields, ...data.locationFields },
      create: { ...data.basicFields, ...data.locationFields, clientId: userId }
    });
  }

  // Save fixer profile if FIXER role
  if (user.roles.includes('FIXER')) {
    await prisma.fixerProfile.upsert({
      where: { fixerId: userId },
      update: {
        ...data.basicFields,
        ...data.locationFields,
        ...data.fixerSpecificFields
      },
      create: {
        ...data.basicFields,
        ...data.locationFields,
        ...data.fixerSpecificFields,
        fixerId: userId
      }
    });
  }
}
```

### Option B: Create Shared Profile Table
**Not recommended** - requires major refactoring of existing code

---

## Middleware Updates

### Current Logic (Line 68-75):
```typescript
// Redirect to profile completion if profile not completed
if (roles.includes('FIXER') && !payload.hasProfile) {
  return NextResponse.redirect(new URL('/fixer/profile', request.url));
}

if (roles.includes('CLIENT') && !payload.hasClientProfile) {
  return NextResponse.redirect(new URL('/client/profile', request.url));
}
```

### New Logic:
```typescript
// Single redirect for all incomplete profiles
if (!payload.hasProfile || !payload.hasClientProfile) {
  return NextResponse.redirect(new URL('/profile', request.url));
}
```

---

## JWT Token Updates

### Current Token Payload:
```typescript
{
  userId: string;
  role: string;           // Primary role
  roles: string[];        // All roles
  hasProfile: boolean;    // For FIXER
  hasClientProfile: boolean;  // For CLIENT
}
```

### Keep As-Is (No changes needed)
- `hasProfile` tracks FixerProfile completion
- `hasClientProfile` tracks ClientProfile completion
- Both flags work independently

---

## UI Components to Create/Update

### 1. New: `UnifiedProfileForm.tsx`
- Smart form that shows/hides sections
- Pre-fills data from existing profiles
- Validates based on active roles
- Handles submission to unified API

### 2. New: `BecomeFixer.tsx`
- Modal or page for existing clients
- Only shows fixer-specific fields
- Triggers role upgrade

### 3. Update: `middleware.ts`
- Redirect to `/profile` instead of role-specific routes

### 4. Update: Client Dashboard
- Add "Become a Service Provider" button/card

### 5. Update: Registration Flow
- Update redirect to `/profile` instead of `/client/profile` or `/fixer/profile`

---

## Migration Script

```typescript
// scripts/migrate-profiles.ts
async function migrateExistingProfiles() {
  // For users with both CLIENT and FIXER roles:
  const dualRoleUsers = await prisma.user.findMany({
    where: {
      roles: { hasEvery: ['CLIENT', 'FIXER'] }
    },
    include: {
      clientProfile: true,
      fixerProfile: true
    }
  });

  for (const user of dualRoleUsers) {
    // Sync shared fields from fixer profile to client profile
    // (Fixer profile is likely more complete)
    if (user.fixerProfile && user.clientProfile) {
      await prisma.clientProfile.update({
        where: { id: user.clientProfile.id },
        data: {
          primaryPhone: user.fixerProfile.primaryPhone,
          secondaryPhone: user.fixerProfile.secondaryPhone,
          neighbourhood: user.fixerProfile.neighbourhood,
          city: user.fixerProfile.city,
          state: user.fixerProfile.state,
          country: user.fixerProfile.country,
          streetAddress: user.fixerProfile.streetAddress,
        }
      });
    }
  }
}
```

---

## Benefits of This Approach

1. ✅ **No duplicate data entry** - users fill form once
2. ✅ **Seamless upgrades** - clients can become fixers easily
3. ✅ **Data consistency** - single source of truth
4. ✅ **Better UX** - one form adapts to user's roles
5. ✅ **Backward compatible** - old routes still work
6. ✅ **Gradual migration** - can deploy incrementally
7. ✅ **No schema changes** - works with existing database

---

## Implementation Checklist

### Phase 1: Core Unified Profile
- [ ] Create `/app/profile/page.tsx` (server component)
- [ ] Create `/app/profile/UnifiedProfileForm.tsx` (client component)
- [ ] Create `/app/api/profile/route.ts` (unified API)
- [ ] Update middleware to redirect to `/profile`
- [ ] Update registration flow to use `/profile`
- [ ] Test with new users (client-only, fixer-only, dual-role)

### Phase 2: Upgrade Flow
- [ ] Add "Become a Service Provider" button to client dashboard
- [ ] Create `/app/client/upgrade-to-fixer/page.tsx`
- [ ] Create `/app/api/user/upgrade-to-fixer/route.ts`
- [ ] Add admin notification for new fixer applications
- [ ] Test upgrade flow with existing client

### Phase 3: Migration & Cleanup
- [ ] Run migration script to sync existing dual-role profiles
- [ ] Add deprecation notice to old profile routes
- [ ] Update all links to point to `/profile`
- [ ] Create redirect from old routes to new route
- [ ] Update tests

### Phase 4: Polish
- [ ] Add profile completion progress indicator
- [ ] Add "Skip for now" option for fixer section (if dual-role)
- [ ] Add field validation messages
- [ ] Add success/error states
- [ ] Update documentation

---

## Next Steps

1. Review this design with team
2. Prioritize phases
3. Start with Phase 1 implementation
4. Test thoroughly before deploying
5. Plan migration for existing users

