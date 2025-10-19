# Profile Flow Diagrams

## Current Flow (PROBLEMATIC - Shows Duplication)

```
┌─────────────────────────────────────────────────────────────────┐
│                    REGISTRATION                                 │
│  User selects: [ ] CLIENT  [ ] FIXER  [ ] BOTH                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Email Verification
                              ↓
                ┌─────────────┴─────────────┐
                ↓                           ↓
        CLIENT ONLY                  FIXER ONLY
                ↓                           ↓
    ┌───────────────────────┐   ┌───────────────────────┐
    │ /client/profile       │   │ /fixer/profile        │
    │ ─────────────────     │   │ ─────────────────     │
    │ • Name                │   │ • Name                │ ← DUPLICATE
    │ • Location            │   │ • Location            │ ← DUPLICATE
    │ • Phones              │   │ • Phones              │ ← DUPLICATE
    │ • Alt Email           │   │ • Alt Email           │ ← DUPLICATE
    │                       │   │ • Years of Service    │
    │                       │   │ • Qualifications      │
    └───────────────────────┘   └───────────────────────┘
                ↓                           ↓
        Client Dashboard            Pending Approval
                                            ↓
                                    Fixer Dashboard

        DUAL-ROLE (CURRENT - PROBLEMATIC):
        ┌─────────────────────────────────────┐
        │ User fills /client/profile          │ ← Step 1
        │ (name, location, phones)            │
        └─────────────────────────────────────┘
                        ↓
        ┌─────────────────────────────────────┐
        │ User fills /fixer/profile           │ ← Step 2
        │ (RE-ENTERS name, location, phones!) │ ← DUPLICATE!
        │ (adds years, qualifications)        │
        └─────────────────────────────────────┘
```

---

## New Unified Flow (SOLUTION - No Duplication)

```
┌─────────────────────────────────────────────────────────────────┐
│                    REGISTRATION                                 │
│  User selects: [ ] CLIENT  [ ] FIXER  [ ] BOTH                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    Email Verification
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                   /profile (UNIFIED FORM)                       │
│                                                                 │
│  BASIC INFORMATION (Always shown)                               │
│  ├─ Full Name              [Pre-filled from registration]      │
│  ├─ Primary Phone          *                                   │
│  ├─ Secondary Phone        (optional)                          │
│  └─ Alternate Email        (optional)                          │
│                                                                 │
│  LOCATION (Always shown)                                        │
│  ├─ Country                *                                   │
│  ├─ State                  *                                   │
│  ├─ Neighbourhood          *                                   │
│  └─ Street Address         (optional)                          │
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ SERVICE PROVIDER DETAILS                                │   │
│  │ (Only shown if FIXER role selected at registration)     │   │
│  │                                                         │   │
│  │ • Years of Service      *                              │   │
│  │ • Qualifications        * (multi-select)               │   │
│  │ • Categories            * (handled in next step)       │   │
│  │ • Service Areas         * (handled in next step)       │   │
│  │                                                         │   │
│  │ [ ] Skip fixer details for now                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Save Profile]                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    ┌─────────┴─────────┐
                    ↓                   ↓
            CLIENT ONLY            FIXER INCLUDED
                    ↓                   ↓
        ┌─────────────────────┐  ┌─────────────────────┐
        │ Client Dashboard    │  │ Pending Approval    │
        │                     │  │ (if fixer filled)   │
        └─────────────────────┘  └─────────────────────┘
                                            ↓
                                    [Admin Approves]
                                            ↓
                              ┌─────────────┴─────────────┐
                              ↓                           ↓
                      CLIENT ONLY                   DUAL ROLE
                              ↓                           ↓
                  Client Dashboard              Unified Dashboard
                                              (CLIENT + FIXER tabs)
```

---

## Upgrade Path: Existing Client → Becomes Fixer

```
┌───────────────────────────────────────────────────────────┐
│              CLIENT DASHBOARD                             │
│                                                           │
│  ┌─────────────────────────────────────────────────┐     │
│  │  💼 Want to offer services?                     │     │
│  │  [Become a Service Provider] ──────────┐        │     │
│  └─────────────────────────────────────────────────┘     │
│                                            │              │
└────────────────────────────────────────────┼──────────────┘
                                             ↓
┌─────────────────────────────────────────────────────────────────┐
│              UPGRADE TO SERVICE PROVIDER                        │
│                                                                 │
│  BASIC INFORMATION (Read-only - already have)                   │
│  ✓ Name: John Doe                                              │
│  ✓ Location: Lekki Phase 1, Lagos                              │
│  ✓ Phone: +234 801 234 5678                                    │
│                                                                 │
│  ─────────────────────────────────────────────────────          │
│                                                                 │
│  ADDITIONAL INFORMATION (New fields to complete)                │
│  • Years of Service      * [____]                              │
│  • Qualifications        * [Select...]                         │
│  • Service Categories    * [Select...]                         │
│  • Service Areas         * [Select...]                         │
│                                                                 │
│  [ ] I agree to terms for service providers                    │
│                                                                 │
│  [Submit Application]                                           │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    [Submit triggers:]
                    1. Add FIXER to User.roles
                    2. Create FixerProfile (copy shared fields)
                    3. Set status to PENDING
                    4. Send admin notification
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              PENDING APPROVAL PAGE                              │
│  "Your service provider application is under review..."         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    [Admin approves in admin panel]
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              UNIFIED DASHBOARD                                  │
│  [My Requests] [My Jobs] ← Now has both tabs!                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Smart Data Flow: How Profiles Stay in Sync

### When User Fills Unified Profile Form:

```
┌─────────────────────────────────────────────────────────────┐
│  User submits form with:                                    │
│  • name: "John Doe"                                         │
│  • primaryPhone: "+234..."                                  │
│  • location: "Lekki, Lagos"                                 │
│  • yearsOfService: 5 (if FIXER)                            │
│  • qualifications: ["Certified"] (if FIXER)                │
└─────────────────────────────────────────────────────────────┘
                        ↓
            POST /api/profile (unified API)
                        ↓
        ┌───────────────────────────────┐
        │  Check user.roles:            │
        │  • CLIENT in roles? → Yes     │
        │  • FIXER in roles?  → Yes     │
        └───────────────────────────────┘
                        ↓
        ┌───────────────────────────────────────────┐
        │  Create/Update ClientProfile:             │
        │  {                                        │
        │    clientId: userId,                      │
        │    primaryPhone: "+234...",               │
        │    neighbourhood: "Lekki Phase 1",        │
        │    city: "Lagos",                         │
        │    state: "Lagos",                        │
        │    country: "Nigeria",                    │
        │    alternateEmail: "..."                  │
        │  }                                        │
        └───────────────────────────────────────────┘
                        ↓
        ┌───────────────────────────────────────────┐
        │  Create/Update FixerProfile:              │
        │  {                                        │
        │    fixerId: userId,                       │
        │    primaryPhone: "+234...",    ← SAME    │
        │    neighbourhood: "Lekki...",  ← SAME    │
        │    city: "Lagos",              ← SAME    │
        │    state: "Lagos",             ← SAME    │
        │    country: "Nigeria",         ← SAME    │
        │    yearsOfService: 5,          ← UNIQUE  │
        │    qualifications: ["..."]     ← UNIQUE  │
        │  }                                        │
        └───────────────────────────────────────────┘
                        ↓
        ┌───────────────────────────────┐
        │  Update JWT token:            │
        │  • hasClientProfile: true     │
        │  • hasProfile: true           │
        └───────────────────────────────┘
```

### When Existing Client Upgrades:

```
┌─────────────────────────────────────────────────────────┐
│  BEFORE UPGRADE:                                        │
│  User.roles = ['CLIENT']                                │
│  ClientProfile exists with all data                     │
│  FixerProfile = null                                    │
└─────────────────────────────────────────────────────────┘
                        ↓
            User clicks "Become a Fixer"
                        ↓
┌─────────────────────────────────────────────────────────┐
│  Shows form with:                                       │
│  • Basic info (read-only, from ClientProfile)           │
│  • Fixer-specific fields (empty, to fill)              │
└─────────────────────────────────────────────────────────┘
                        ↓
            POST /api/user/upgrade-to-fixer
                        ↓
┌─────────────────────────────────────────────────────────┐
│  1. Update User.roles = ['CLIENT', 'FIXER']            │
│  2. Create FixerProfile {                              │
│      fixerId: userId,                                  │
│      primaryPhone: clientProfile.primaryPhone, ←COPY   │
│      neighbourhood: clientProfile.neighbourhood,←COPY  │
│      city: clientProfile.city,                  ←COPY  │
│      state: clientProfile.state,                ←COPY  │
│      country: clientProfile.country,            ←COPY  │
│      yearsOfService: form.yearsOfService,       ←NEW   │
│      qualifications: form.qualifications,       ←NEW   │
│      pendingChanges: true                       ←NEW   │
│    }                                                   │
│  3. Send admin notification                            │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│  AFTER UPGRADE:                                         │
│  User.roles = ['CLIENT', 'FIXER']                      │
│  ClientProfile exists (unchanged)                       │
│  FixerProfile exists (created, status PENDING)          │
└─────────────────────────────────────────────────────────┘
```

---

## Field Mapping Matrix

| Field            | ClientProfile | FixerProfile | Source              |
|------------------|---------------|--------------|---------------------|
| name             | ✓ (display)   | ✓ (display)  | User.name           |
| primaryPhone     | ✓ stored      | ✓ stored     | Unified form        |
| secondaryPhone   | ✓ stored      | ✓ stored     | Unified form        |
| alternateEmail   | ✓ stored      | ✗ not stored | Unified form        |
| streetAddress    | ✓ stored      | ✓ stored     | Unified form        |
| neighbourhood    | ✓ stored      | ✓ stored     | Unified form        |
| city             | ✓ stored      | ✓ stored     | Unified form        |
| state            | ✓ stored      | ✓ stored     | Unified form        |
| country          | ✓ stored      | ✓ stored     | Unified form        |
| yearsOfService   | ✗             | ✓ stored     | Fixer-only section  |
| qualifications   | ✗             | ✓ stored     | Fixer-only section  |
| approvedAt       | ✗             | ✓ system     | Admin action        |
| pendingChanges   | ✗             | ✓ system     | Auto-set            |

---

## Summary of Benefits

### ✅ User Experience
- **One form** instead of two
- **No re-entering** the same information
- **Smooth upgrades** from client to fixer
- **Clear progress** indication

### ✅ Data Integrity
- **Single source of truth** during data entry
- **Automatic syncing** between profiles
- **Consistent data** across both roles
- **No conflicts** or mismatches

### ✅ Development
- **Backward compatible** - old routes work
- **Gradual migration** - no big bang
- **No schema changes** - use existing tables
- **Easy to test** - clear separation of concerns

### ✅ Business Logic
- **Flexible role management** - easy to add/remove roles
- **Clear approval flow** - only fixer features need approval
- **Proper permissions** - client features work immediately
- **Admin control** - fixer approval stays with admin

