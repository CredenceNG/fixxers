# Critical Neighborhood Compliance Audit

## Database Schema Analysis

### ✅ FULLY COMPLIANT (Using Normalized Structure)

#### 1. ServiceRequest (Line 451-489)
```prisma
neighborhoodId    String
neighborhood      Neighborhood  @relation(fields: [neighborhoodId], references: [id])
```
**Status:** ✅ PERFECT - Using proper foreign key relationship
**Impact:** Service requests are properly linked to neighborhoods
**No Action Required**

#### 2. FixerService (Line 428-449)
```prisma
neighborhoods   Neighborhood[]  // Many-to-many relationship
```
**Status:** ✅ PERFECT - Using proper many-to-many relationship
**Impact:** Fixers can serve multiple neighborhoods
**No Action Required**

#### 3. Agent (Line 1071-1121)
```prisma
approvedNeighborhoods Neighborhood[]  @relation("AgentNeighborhoods")
requestedNeighborhoodIds String[]      @default([])
```
**Status:** ⚠️ HYBRID - Uses both normalized and legacy approaches
**Issue:** `requestedNeighborhoodIds` is a String array (legacy)
**Impact:** Agent applications and territory management
**Action Required:** Update agent application flow to use `approvedNeighborhoods` relation

#### 4. Quote (Line 491-537)
**Status:** ✅ COMPLIANT - Inherits neighborhood from ServiceRequest
**Flow:** Quote → ServiceRequest → Neighborhood
**No Action Required**

#### 5. Order (Line 539-625)
**Status:** ✅ COMPLIANT - Inherits neighborhood from ServiceRequest or Gig
**Flow:** Order → ServiceRequest/Gig → Neighborhood
**No Action Required**

---

## API Endpoints Audit

### ❌ BROKEN - Need Immediate Fix

#### 1. Service Request Creation
**Files:**
- `app/client/requests/new/page.tsx` - Client creates service request
- `app/agent/clients/[id]/request/new/CreateRequestForm.tsx` - Agent creates for client
- `app/api/client/service-requests/route.ts` - API endpoint

**Issue:** Forms likely use legacy string fields, API expects `neighborhoodId`
**Impact:** 🔴 **CRITICAL** - Users cannot create service requests
**Fix Required:**
1. Update forms to use cascading dropdowns (Country → State → City → Neighborhood)
2. Submit `neighborhoodId` instead of legacy fields
3. Update API to validate `neighborhoodId` exists

#### 2. Fixer Profile & Services
**Files:**
- `app/fixer/services/page.tsx` - Fixer manages service areas
- `app/api/fixer/services/route.ts` - API endpoint
- `app/api/fixer/profile/route.ts` - Profile API

**Issue:** Forms use legacy fields, need to save `neighborhoodId` to profile
**Impact:** 🔴 **CRITICAL** - Fixers cannot set service areas
**Fix Required:**
1. Update UnifiedProfileForm to save `neighborhoodId`
2. Update FixerService creation to use neighborhood many-to-many
3. Fix matching algorithm to use normalized neighborhoods

#### 3. Client Profile
**Files:**
- `app/profile/UnifiedProfileForm.tsx` - Profile form
- `app/api/client/profile/route.ts` - API endpoint
- `app/api/profile/route.ts` - Unified profile API

**Issue:** Forms submit legacy fields (neighbourhood, city, state, country)
**Impact:** 🟡 **HIGH** - Clients cannot save location properly
**Fix Required:**
1. Update form to use cascading dropdowns
2. Submit `neighborhoodId`
3. Update API to save to `neighborhoodId` field

#### 4. Agent Registration & Territory
**Files:**
- `app/agent/application/AgentApplicationForm.tsx` - Agent applies
- `app/api/agent/application/route.ts` - Application API
- `app/admin/agents/[agentId]/approve/route.ts` - Approval API

**Issue:** Uses `requestedNeighborhoodIds` (String array) instead of relation
**Impact:** 🟡 **HIGH** - Agent territory management broken
**Fix Required:**
1. Update Agent schema to use `requestedNeighborhoods` relation
2. Update application form to select from normalized neighborhoods
3. Update approval flow to link `approvedNeighborhoods`

---

## Matching & Search Algorithms

### ❌ CRITICAL ISSUES

#### 1. Fixer-Request Matching
**File:** `lib/matching.ts` or wherever AI matching happens
**Issue:** Matching algorithm likely compares string-based locations
**Impact:** 🔴 **CRITICAL** - Fixers not matched to requests in their area
**Fix Required:**
```typescript
// OLD (Broken)
fixer.neighbourhood === request.neighbourhood

// NEW (Fixed)
fixerService.neighborhoods.some(n => n.id === request.neighborhoodId)
```

#### 2. Search & Filtering
**Files:**
- `app/gigs/page.tsx` - Gig search
- `app/admin/requests/page.tsx` - Admin request search
- Any search/filter components

**Issue:** Filters likely use legacy string fields
**Impact:** 🟡 **HIGH** - Search results incorrect
**Fix Required:** Update filters to use neighborhood relationships

---

## Quote & Order Flow Analysis

### ✅ Quote Flow (Compliant)
```
Client creates ServiceRequest with neighborhoodId
  ↓
Fixer sees request (matched by neighborhood)
  ↓
Fixer creates Quote for ServiceRequest
  ↓
Quote inherits neighborhood from ServiceRequest
```
**Status:** ✅ Will work once ServiceRequest creation is fixed

### ✅ Order Flow (Compliant)
```
Client accepts Quote
  ↓
Order created with reference to Quote/ServiceRequest
  ↓
Order inherits neighborhood through relationships
```
**Status:** ✅ Will work once ServiceRequest creation is fixed

---

## Critical Fix Priority

### 🔴 PRIORITY 1 (Blocking Core Features)
1. **ServiceRequest Creation API** - Users cannot create requests
   - Fix: `app/api/client/service-requests/route.ts`
   - Fix: `app/client/requests/new/page.tsx`
   - Fix: `app/agent/clients/[id]/request/new/CreateRequestForm.tsx`

2. **Fixer Profile & Services** - Fixers cannot set service areas
   - Fix: `app/api/fixer/profile/route.ts`
   - Fix: `app/api/fixer/services/route.ts`
   - Fix: `app/fixer/services/page.tsx`

3. **Matching Algorithm** - Requests not matched to fixers
   - Fix: AI matching logic to use normalized neighborhoods
   - Fix: Quote generation to respect neighborhood boundaries

### 🟡 PRIORITY 2 (High Impact)
4. **Client Profile** - Clients cannot save location
   - Fix: `app/api/profile/route.ts`
   - Fix: `app/profile/UnifiedProfileForm.tsx`

5. **Agent Territory** - Agents cannot manage territory
   - Fix: Agent schema to use `requestedNeighborhoods` relation
   - Fix: `app/agent/application/AgentApplicationForm.tsx`
   - Fix: Admin approval flow

### 🟢 PRIORITY 3 (Lower Impact)
6. **Search & Filters** - Results may be inaccurate
7. **Admin Tools** - Legacy field cleanup

---

## Files Requiring Updates (Complete List)

### API Endpoints (8 files)
1. ❌ `app/api/client/service-requests/route.ts`
2. ❌ `app/api/fixer/profile/route.ts`
3. ❌ `app/api/fixer/services/route.ts`
4. ❌ `app/api/profile/route.ts`
5. ❌ `app/api/client/profile/route.ts`
6. ❌ `app/api/agent/application/route.ts`
7. ⚠️  `app/api/cities/route.ts` (may need deprecation)
8. ⚠️  `app/api/admin/seed/route.ts` (check for legacy refs)

### Frontend Forms (7 files)
1. ❌ `app/client/requests/new/page.tsx`
2. ❌ `app/agent/clients/[id]/request/new/CreateRequestForm.tsx`
3. ❌ `app/fixer/services/page.tsx`
4. ❌ `app/profile/UnifiedProfileForm.tsx`
5. ❌ `app/agent/application/AgentApplicationForm.tsx`
6. ❌ `app/agent/fixers/new/RegisterFixerForm.tsx`
7. ❌ `app/agent/clients/new/AddClientForm.tsx`

### Business Logic (3 files)
1. ❌ Matching algorithm (`lib/matching.ts` or similar)
2. ❌ Search/filter logic
3. ⚠️  Quote generation logic

---

## Testing Checklist

### ServiceRequest Flow
- [ ] Client can create service request with neighborhood
- [ ] Agent can create request for client with neighborhood
- [ ] Request shows correct neighborhood details
- [ ] Fixers in matching neighborhoods see the request

### Quote & Order Flow
- [ ] Fixer can create quote for request
- [ ] Quote inherits neighborhood from request
- [ ] Order created with proper neighborhood reference
- [ ] Commission calculated for agent in territory

### Profile Management
- [ ] Fixer can save profile with neighborhood
- [ ] Fixer can set service areas (multiple neighborhoods)
- [ ] Client can save profile with neighborhood
- [ ] Profiles display correct location hierarchy

### Agent Management
- [ ] Agent can apply with requested neighborhoods
- [ ] Admin can approve agent with specific neighborhoods
- [ ] Agent sees requests only in approved territory
- [ ] Agent commission tracks to correct neighborhoods

---

## Immediate Action Items

1. ✅ Fix `/api/neighborhoods` endpoint (DONE)
2. ✅ Create location cascade APIs (DONE)
3. ❌ Update ServiceRequest creation API
4. ❌ Update ServiceRequest creation forms
5. ❌ Update Fixer profile/services API
6. ❌ Update Fixer services form
7. ❌ Fix matching algorithm
8. ❌ Test complete flow: Profile → Request → Quote → Order
