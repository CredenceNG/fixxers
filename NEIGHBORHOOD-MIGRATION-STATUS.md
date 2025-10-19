# Neighborhood Migration - What's Broken & Fixes

## Critical Issues (Blocking Features)

### 1. ❌ `/api/neighborhoods` - 500 Error
**File:** `app/api/neighborhoods/route.ts:26-32`
**Issue:** Trying to include `city.state` but state relation needs to be nested properly
**Impact:** Fixer services page can't load neighborhood dropdown
**Fix:** Update include to properly nest city → state relationship

### 2. ⚠️ Legacy Field References (14 files)

#### API Endpoints (Need normalization)
1. **`app/api/client/profile/route.ts`** - References `.neighbourhood`, `.city`, `.state`, `.country`
2. **`app/api/fixer/profile/route.ts`** - References `.neighbourhood`, `.city`, `.state`, `.country`
3. **`app/api/profile/route.ts`** - References `.neighbourhood`, `.city`, `.state`, `.country`
4. **`app/api/cities/route.ts`** - Likely needs complete rewrite for normalized structure
5. **`app/api/admin/seed/route.ts`** - May reference old structure
6. **`app/api/debug/quote-issue/route.ts`** - Debug endpoint

#### Frontend Components (Need cascading dropdowns)
7. **`app/profile/UnifiedProfileForm.tsx`** - Profile form with location fields
8. **`app/agent/application/AgentApplicationForm.tsx`** - Agent application
9. **`app/agent/fixers/new/RegisterFixerForm.tsx`** - Fixer registration
10. **`app/agent/clients/new/AddClientForm.tsx`** - Client registration
11. **`app/agent/clients/[id]/request/new/CreateRequestForm.tsx`** - Service request
12. **`app/client/requests/new/page.tsx`** - Client service request
13. **`app/fixer/services/page.tsx`** - Fixer services (already failing)
14. **`app/admin/neighborhoods/page.tsx`** - Admin neighborhoods page

## Database Schema Status

### ✅ Completed
- Country, State, City, Neighborhood models created
- Foreign key relationships established
- Legacy fields preserved for backward compatibility
- All 19 profiles (5 fixers + 14 clients) linked to neighborhoods
- 136 neighborhoods seeded (100 Lagos + 36 FCT)
- 25 cities/LGAs created
- 2 states created (Lagos, FCT)
- 1 country created (Nigeria)

### ⏳ Remaining
- Update all API endpoints to use normalized structure
- Update all forms to use cascading dropdowns (Country → State → City → Neighborhood)
- Remove legacy fields after full migration
- Update search/filter logic for new structure

## Recommended Fix Order

1. **Fix `/api/neighborhoods`** (blocking fixer services)
2. **Create new location API endpoints:**
   - `/api/locations/countries` - List countries
   - `/api/locations/states?countryId=X` - List states for country
   - `/api/locations/cities?stateId=X` - List cities for state
   - `/api/locations/neighborhoods?cityId=X` - List neighborhoods for city
3. **Update profile APIs** to accept `neighborhoodId` instead of legacy fields
4. **Update all forms** to use cascading dropdowns
5. **Test complete flow**: Registration → Profile → Service Request → Quote
6. **Remove legacy fields** from schema after validation

## Key Breaking Changes

### Old Structure (String-based)
```typescript
{
  neighbourhood: "Ikeja GRA",
  city: "Ikeja",
  state: "Lagos",
  country: "Nigeria"
}
```

### New Structure (Normalized)
```typescript
{
  neighborhoodId: "cm123...",  // Foreign key to Neighborhood
  neighborhood: {
    id: "cm123...",
    name: "Ikeja GRA",
    city: {
      id: "cm456...",
      name: "Ikeja",
      state: {
        id: "cm789...",
        name: "Lagos",
        country: {
          id: "cm012...",
          name: "Nigeria",
          code: "NG"
        }
      }
    }
  }
}
```

## Testing Checklist

- [ ] Fixer can select neighborhood during profile setup
- [ ] Client can select neighborhood during profile setup
- [ ] Agent can select neighborhoods for territory
- [ ] Service requests show correct neighborhood
- [ ] Quotes are matched to correct neighborhood
- [ ] Search by neighborhood works
- [ ] Admin can view/edit neighborhoods
- [ ] Legacy data is preserved
- [ ] No 500 errors on neighborhood-dependent pages
