# Simplify Services Page - Remove Neighborhood Selection

## Current Situation
The `/fixer/services` page currently asks fixers to select:
1. Service categories & subcategories ✅ (keep this)
2. Service neighborhoods ❌ (remove this - redundant)

**Why remove?** Fixers already specified their location/neighborhood in the basic profile. They operate in their home neighborhood.

## Changes Needed

### 1. Update `/app/fixer/services/page.tsx`

**Remove:**
- Line 51: `const [neighborhoods, setNeighborhoods] = useState<Neighborhood[]>([]);`
- Line 58: `neighborhoodIds: [] as string[],` from formData
- Lines 70-71: Fetching neighborhoods API call
- Line 77: `const neighborhoodsData = await neighborhoodsRes.json();`
- Line 81: `setNeighborhoods(neighborhoodsData);`
- Lines 94-101: `handleNeighborhoodToggle` function
- Line 109: Change validation from `|| formData.neighborhoodIds.length === 0` to just check subcategoryId
- Line 110: Change error message to "Please select a service category"
- Line 132: Remove `neighborhoodIds: [],` from form reset
- All UI code that renders neighborhood checkboxes (search for "neighborhood" in the JSX)

**Keep:**
- Service category dropdown
- Subcategory selection
- Description field (optional)
- Base price and price unit (optional)

### 2. Update `/app/api/fixer/services/route.ts`

**Current behavior:** Creates FixerService with selected neighborhoods

**New behavior:** Create FixerService using fixer's home neighborhood from FixerProfile

```typescript
// POST handler - simplified
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { subcategoryId, description, basePrice, priceUnit } = await request.json();

  // Get fixer's home neighborhood from their profile
  const fixerProfile = await prisma.fixerProfile.findUnique({
    where: { fixerId: user.id },
  });

  if (!fixerProfile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  // Find the neighborhood by name/city/state from profile
  const neighborhood = await prisma.neighborhood.findFirst({
    where: {
      name: fixerProfile.neighbourhood,
      city: fixerProfile.city,
      state: fixerProfile.state,
    },
  });

  if (!neighborhood) {
    return NextResponse.json({ error: 'Neighborhood not found' }, { status: 404 });
  }

  // Create service with fixer's home neighborhood
  const service = await prisma.fixerService.create({
    data: {
      fixerId: user.id,
      subcategoryId,
      description: description || null,
      basePrice: basePrice ? parseFloat(basePrice) : null,
      priceUnit: priceUnit || null,
      isActive: true,
      neighborhoods: {
        connect: [{ id: neighborhood.id }], // Use fixer's home neighborhood
      },
    },
    include: {
      subcategory: {
        include: {
          category: true,
        },
      },
      neighborhoods: true,
    },
  });

  return NextResponse.json(service);
}
```

### 3. Simplified User Flow

**Before:**
1. Complete basic profile (including home location)
2. Go to services page
3. Select service categories
4. Select service neighborhoods ← REDUNDANT
5. Submit

**After:**
1. Complete basic profile (including home location)
2. Go to services page
3. Select service categories only
4. Submit (automatically uses home neighborhood)

## Benefits

1. ✅ **Less redundant** - Don't ask for location twice
2. ✅ **Simpler UX** - Fewer fields to fill
3. ✅ **Faster onboarding** - One less step
4. ✅ **Consistent data** - Always uses home neighborhood from profile
5. ✅ **Clearer model** - Fixer operates where they live

## Testing After Changes

1. Complete basic profile with fixi-test3 (sets home neighborhood)
2. Go to /fixer/services
3. Add service category only (no neighborhood selection)
4. Verify FixerService created with fixer's home neighborhood
5. Verify service appears in fixer's dashboard

## Files to Modify

1. `/app/fixer/services/page.tsx` - Remove neighborhood UI and state
2. `/app/api/fixer/services/route.ts` - Use fixer's home neighborhood
3. (Optional) Update any other pages that display services to show they're in the fixer's home area

## Estimated Work

- Time: ~30 minutes
- Lines to remove: ~50-80 lines
- Lines to add: ~20 lines
- Net reduction: ~30-60 lines

## Priority

**HIGH** - This is redundant and confusing for users. Should be simplified before widespread testing.
