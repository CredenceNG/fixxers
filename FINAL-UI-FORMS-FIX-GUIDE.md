# UI Forms Fix Guide - Neighborhood Cascading Dropdowns

## ✅ What's Already Done

### Backend (100% Complete)
- ✅ All APIs accept `neighborhoodId`
- ✅ Location cascade APIs created (`/api/locations/countries`, `/states`, `/cities`, `/neighborhoods`)
- ✅ Database fully normalized
- ✅ All 19 profiles linked to neighborhoods

### Reusable Component Created
- ✅ **`components/LocationCascadeSelect.tsx`** - Drop-in replacement for manual location selection

## 📋 Forms That Need Updating

### PRIORITY 1: UnifiedProfileForm
**File:** `app/profile/UnifiedProfileForm.tsx`

**Current State:**
- ✅ Already sends `neighbourhoodId` to API (line 125)
- ❌ UI uses manual filtering with legacy neighborhood data (lines 64-101)

**Fix Needed:**
Replace manual location selection (lines 64-101) with:

```tsx
import LocationCascadeSelect from '@/components/LocationCascadeSelect';

// Replace location state and filtering logic with:
const [neighborhoodId, setNeighborhoodId] = useState(existingData.neighborhoodId || '');

// In the form JSX, replace the country/state/neighborhood dropdowns with:
<LocationCascadeSelect
  value={neighborhoodId}
  onChange={setNeighborhoodId}
  required
  label="Location"
/>

// In handleSubmit, already sends neighborhoodId correctly
```

**Impact:** Users can save profiles with proper location selection

---

### PRIORITY 2: Fixer Services Page
**File:** `app/fixer/services/page.tsx`

**Current State:**
- API already accepts `neighborhoodIds` array
- Needs multi-select neighborhood picker

**Fix Needed:**
Create multi-select version of LocationCascadeSelect or use multiple checkboxes after city selection.

```tsx
// Multi-neighborhood selection pattern:
const [selectedNeighborhoods, setSelectedNeighborhoods] = useState<string[]>([]);

// After city selection, show checkboxes:
{neighborhoods.map(n => (
  <label key={n.id}>
    <input
      type="checkbox"
      checked={selectedNeighborhoods.includes(n.id)}
      onChange={(e) => {
        if (e.target.checked) {
          setSelectedNeighborhoods([...selectedNeighborhoods, n.id]);
        } else {
          setSelectedNeighborhoods(selectedNeighborhoods.filter(id => id !== n.id));
        }
      }}
    />
    {n.name}
  </label>
))}

// Submit: neighborhoodIds: selectedNeighborhoods
```

---

### PRIORITY 3: Service Request Forms

#### A. Client Service Request
**File:** `app/client/requests/new/page.tsx`

**Fix Needed:**
```tsx
import LocationCascadeSelect from '@/components/LocationCascadeSelect';

const [neighborhoodId, setNeighborhoodId] = useState('');

// In form:
<LocationCascadeSelect
  value={neighborhoodId}
  onChange={setNeighborhoodId}
  required
  label="Service Location"
/>

// Submit:
await fetch('/api/client/service-requests', {
  method: 'POST',
  body: JSON.stringify({
    ...otherFields,
    neighborhoodId, // Not legacy fields
  }),
});
```

#### B. Agent Create Request for Client
**File:** `app/agent/clients/[id]/request/new/CreateRequestForm.tsx`

Same pattern as above.

---

### PRIORITY 4: Agent Forms

#### A. Agent Application
**File:** `app/agent/application/AgentApplicationForm.tsx`

**Note:** Agent model uses `requestedNeighborhoodIds` (String array)

**Fix Needed:**
Multi-select neighborhoods (similar to fixer services)

```tsx
const [requestedNeighborhoodIds, setRequestedNeighborhoodIds] = useState<string[]>([]);

// After selecting city, show checkboxes for neighborhoods
// Submit: requestedNeighborhoodIds
```

#### B. Register Fixer (by Agent)
**File:** `app/agent/fixers/new/RegisterFixerForm.tsx`

Use LocationCascadeSelect for fixer's location.

#### C. Add Client (by Agent)
**File:** `app/agent/clients/new/AddClientForm.tsx`

Use LocationCascadeSelect for client's location.

---

## 🔧 Implementation Steps

### Step 1: Update UnifiedProfileForm (30 min)
1. Import LocationCascadeSelect
2. Replace manual filtering logic
3. Test profile save

### Step 2: Update Fixer Services (45 min)
1. Add city selection
2. Show neighborhood checkboxes
3. Test service area save

### Step 3: Update Service Request Forms (30 min each)
1. Import LocationCascadeSelect
2. Replace location fields
3. Update API calls
4. Test request creation

### Step 4: Update Agent Forms (1 hour)
1. Multi-select for agent application
2. Single-select for fixer/client registration
3. Test all flows

---

## 🎯 Testing Checklist

### Profile Management
- [ ] CLIENT can save profile with neighborhood
- [ ] FIXER can save profile with neighborhood
- [ ] Profile displays correct location (Nigeria → Lagos → Ikeja → Ikeja GRA)
- [ ] Editing profile pre-selects correct location

### Fixer Services
- [ ] Fixer can select multiple neighborhoods
- [ ] Service areas save correctly
- [ ] Can edit and update service areas
- [ ] Neighborhoods properly linked to FixerService records

### Service Requests
- [ ] Client can create request with neighborhood
- [ ] Agent can create request for client
- [ ] Request shows correct neighborhood details
- [ ] Fixers in matching neighborhoods see the request

### Agent Territory
- [ ] Agent can select multiple neighborhoods in application
- [ ] Admin can see requested neighborhoods
- [ ] Approved neighborhoods link correctly
- [ ] Agent dashboard filters by territory

---

## 📊 Migration Progress

| Component | Backend | Frontend | Status |
|-----------|---------|----------|--------|
| Database Schema | ✅ | N/A | Complete |
| Location APIs | ✅ | N/A | Complete |
| Profile API | ✅ | ⚠️ | API ready, UI needs update |
| Fixer Services API | ✅ | ⚠️ | API ready, UI needs update |
| Service Request API | ✅ | ⚠️ | API ready, UI needs update |
| Agent APIs | ✅ | ⚠️ | API ready, UI needs update |
| LocationCascadeSelect | N/A | ✅ | Component ready |
| UnifiedProfileForm | ✅ | ❌ | Needs dropdown replacement |
| Fixer Services Form | ✅ | ❌ | Needs multi-select |
| Service Request Forms | ✅ | ❌ | Needs dropdown |
| Agent Forms | ✅ | ❌ | Needs multi-select |

---

## 🚀 Quick Start Example

Here's the complete pattern for any single-location form:

```tsx
'use client';

import { useState } from 'react';
import LocationCascadeSelect from '@/components/LocationCascadeSelect';

export default function MyForm() {
  const [neighborhoodId, setNeighborhoodId] = useState('');
  const [formData, setFormData] = useState({ name: '', phone: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const response = await fetch('/api/my-endpoint', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        neighborhoodId, // This is all you need!
      }),
    });

    if (response.ok) {
      // Success!
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
      />

      <LocationCascadeSelect
        value={neighborhoodId}
        onChange={setNeighborhoodId}
        required
        label="Location"
      />

      <button type="submit">Save</button>
    </form>
  );
}
```

---

## 📝 Notes

1. **Existing Data:** UnifiedProfileForm already has `existingData.neighborhoodId` from the API
2. **Validation:** LocationCascadeSelect has built-in required validation
3. **Nigeria Default:** Component auto-selects Nigeria as the default country
4. **Multi-select:** For fixer services and agent territory, show checkboxes after city selection
5. **Legacy Fields:** Backend still saves legacy fields for backward compatibility

---

## ⚡ Estimated Total Time

- UnifiedProfileForm: 30 minutes
- Fixer Services: 45 minutes
- Service Request Forms (2): 1 hour
- Agent Forms (3): 1.5 hours
- Testing: 1 hour

**Total: ~4.5 hours to complete all UI forms**

---

## 🎉 Expected Outcome

After completing all form updates:

1. ✅ Users can select location via cascading dropdowns
2. ✅ All forms submit `neighborhoodId` to backend
3. ✅ Profiles, services, and requests save correctly
4. ✅ Matching algorithm works (fixers matched to requests in their neighborhoods)
5. ✅ Complete flow works: Profile → Services → Request → Quote → Order
6. ✅ Agent territory management functional
7. ✅ Search and filtering by neighborhood works

**Platform will be fully functional with normalized location data!**
