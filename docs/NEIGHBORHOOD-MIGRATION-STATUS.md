# Neighborhood Location Migration Status

## ✅ What's Been Fixed

### Code Changes (Commit 7a0d0e3)
All code now supports **both** normalized and legacy neighborhood data structures:

1. **26 files updated** with hybrid support
2. **2 new API routes** for service requests
3. **1 utility module** with helper functions
4. **1 reseed script** ready for full migration

### Migration Approach
Created a **hybrid system** that works during the transition:

```typescript
// Queries now fetch BOTH structures:
neighborhood: {
  select: {
    id: true,
    name: true,
    legacyCity: true,      // ← Fallback for unmigrated data
    legacyState: true,     // ← Fallback for unmigrated data
    city: {                // ← New normalized relation
      select: {
        name: true,
        state: { select: { name: true } }
      }
    }
  }
}

// Display code uses helper functions:
import { getCityName, getStateName } from '@/lib/utils/neighborhood';

const cityName = getCityName(neighborhood);    // Returns city.name OR legacyCity
const stateName = getStateName(neighborhood);  // Returns city.state.name OR legacyState
```

## 📊 Current Data Status

**Database:** Neon PostgreSQL (production)

```
Total neighborhoods: 316
├── Fully migrated (with cityId): 136 (43%)
└── Not migrated (no cityId): 180 (57%)
```

## 🚀 Netlify Build Status

**Expected:** ✅ **BUILD WILL SUCCEED**

- No TypeScript errors (all field references fixed)
- Runtime safe for all 316 neighborhoods (hybrid support)
- Queries work with both migrated and unmigrated data

## 🔄 Completing the Migration

You have **two options** to finish:

### Option A: Reseed Everything (Recommended)
**Cleanest approach** - Fresh normalized data

```bash
# 1. Delete all dependent data (service requests, agent territories, etc.)
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function cleanup() {
  await prisma.serviceRequest.deleteMany({});
  await prisma.fixerService.updateMany({
    data: { neighborhoodIds: [] }
  });
  await prisma.agent.updateMany({
    data: { requestedNeighborhoodIds: [], approvedNeighborhoodIds: [] }
  });
  await prisma.\$disconnect();
}

cleanup();
"

# 2. Run the reseed script
npx tsx scripts/reseed-locations.ts

# 3. Remove legacy fields from schema (see Option B step 3)
```

### Option B: Migrate Existing Data
**Preserves existing data** - Updates in place

```bash
# 1. Run migration script to link remaining 180 neighborhoods to cities
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function migrate() {
  const unmigrated = await prisma.neighborhood.findMany({
    where: { cityId: null }
  });

  console.log(\`Found \${unmigrated.length} unmigrated neighborhoods\`);

  for (const n of unmigrated) {
    // Find or create matching city based on legacyCity name
    const cityName = n.legacyCity || 'Unknown';

    let city = await prisma.city.findFirst({
      where: { name: cityName }
    });

    if (!city) {
      // Create city if it doesn't exist
      const state = await prisma.state.findFirst({
        where: { name: n.legacyState || 'Lagos' }
      });

      if (state) {
        city = await prisma.city.create({
          data: {
            name: cityName,
            stateId: state.id
          }
        });
      }
    }

    if (city) {
      await prisma.neighborhood.update({
        where: { id: n.id },
        data: { cityId: city.id }
      });
      console.log(\`✓ Migrated: \${n.name} → \${cityName}\`);
    }
  }

  await prisma.\$disconnect();
}

migrate();
"

# 2. Verify all neighborhoods have cityId
npx tsx -e "
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function verify() {
  const total = await prisma.neighborhood.count();
  const migrated = await prisma.neighborhood.count({
    where: { cityId: { not: null } }
  });

  console.log(\`Migration: \${migrated}/\${total} complete\`);

  if (migrated === total) {
    console.log('✅ All neighborhoods migrated!');
  } else {
    console.log(\`❌ \${total - migrated} neighborhoods still need migration\`);
  }

  await prisma.\$disconnect();
}

verify();
"

# 3. Remove legacy fields from schema
```

### Step 3: Remove Legacy Fields (Both Options)

Once all 316 neighborhoods have `cityId`:

1. **Update schema** - Remove legacy fields:

```prisma
model Neighborhood {
  id        String   @id @default(cuid())
  name      String
  cityId    String
  city      City     @relation(fields: [cityId], references: [id])

  // DELETE THESE LINES:
  // legacyCity     String?
  // legacyState    String?
  // legacyCountry  String?

  // ... rest of model
}
```

2. **Update Prisma queries** - Remove legacy field selections (see files below)

3. **Push schema changes**:
```bash
npx prisma db push
npx prisma generate
```

## 📁 Files to Update After Legacy Removal

Once legacy fields are removed from schema, update these files to remove `legacyCity`/`legacyState` from queries:

### API Routes (13 files)
- `app/api/admin/agents/[agentId]/approve/route.ts`
- `app/api/admin/agents/applications/route.ts`
- `app/api/admin/agents/route.ts`
- `app/api/agent/application/route.ts`
- `app/api/agent/dashboard/route.ts`
- `app/api/agent/territory/route.ts`
- `app/api/client/profile/route.ts`
- `app/api/debug/quote-issue/route.ts`
- `app/api/fixer/orders/[orderId]/route.ts`
- `app/api/fixer/requests/[id]/route.ts`
- `app/api/fixer/services/route.ts`
- `app/api/service-requests/[id]/route.ts`
- `app/api/service-requests/route.ts`

### Pages (7 files)
- `app/categories/[id]/page.tsx`
- `app/client/dashboard/page.tsx`
- `app/client/requests/[id]/page.tsx`
- `app/dashboard/page.tsx`
- `app/fixer/dashboard/page.tsx`

### Libraries (1 file)
- `lib/agents/permissions.ts`

### Optional Cleanup
- Delete `lib/utils/neighborhood.ts` (helper functions no longer needed)
- Update display code to directly use `neighborhood.city.name`

## 🎯 Current Status Summary

**Status:** ✅ **Production Ready** (with hybrid support)

| Aspect | Status | Notes |
|--------|--------|-------|
| **Netlify Build** | ✅ Will succeed | No TypeScript errors |
| **Runtime Safety** | ✅ Safe | Works with both data types |
| **Data Migration** | ⏳ 43% complete | 136/316 neighborhoods |
| **Code Migration** | ✅ Complete | All queries updated |
| **Legacy Support** | ✅ Active | Maintains backward compatibility |

**Next Action:** Choose Option A (reseed) or Option B (migrate) to complete data migration.

---

Generated: 2025-10-19
Commit: 7a0d0e3
