# Badge Management System - Complete Guide

## Overview

Complete admin interface for managing trust badge requirements, costs, and verification criteria.

## 📂 Files Created/Modified

### Admin Pages

1. **`/app/admin/badges/page.tsx`** (NEW)
   - Lists all badges with stats (requests, assignments)
   - Shows badge details: cost, expiry, requirements
   - Links to edit page for each badge
   - Displays active/inactive status

2. **`/app/admin/badges/[badgeId]/edit/page.tsx`** (NEW)
   - Edit individual badge settings
   - Modify requirements, cost, documents, expiry
   - Update performance criteria for automatic badges

### Components

3. **`/components/badges/BadgeEditForm.tsx`** (NEW)
   - Client component for badge editing
   - Form validation and submission
   - Handles both manual and automatic badges
   - Success/error messaging

4. **`/components/badges/BadgeReviewActions.tsx`** (ENABLED)
   - Approve, Request Info, Reject buttons now active
   - Modal dialogs for each action
   - Full API integration

### API Routes

5. **`/app/api/admin/badges/[badgeId]/route.ts`** (NEW)
   - `PATCH` - Update badge settings
   - `GET` - Fetch single badge with stats
   - Admin-only access control

### Dashboard Updates

6. **`/app/admin/dashboard/page.tsx`** (MODIFIED)
   - Added "🏅 Manage Badges" button in header
   - Fixed prismaAny cast for badgeRequest

## 🎯 How to Use

### Access Badge Management

1. Navigate to **http://localhost:3010/admin/dashboard**
2. Click **"🏅 Manage Badges"** in the header
3. OR click **"Review Badges"** in the pending badge requests alert

### View All Badges

- **URL**: `/admin/badges`
- Shows all badges with:
  - Badge icon, name, and type
  - Cost and expiry period
  - Number of requests and assignments
  - Active/inactive status
  - Required documents or performance criteria

### Edit Badge Requirements

1. Click **"✏️ Edit Badge Settings"** on any badge card
2. Modify any of the following:
   - **Basic Info**: Name, description, icon, cost, expiry
   - **Status**: Active/inactive toggle
   - **Manual Badges**: Required documents list
   - **Automatic Badges**: Performance criteria (jobs, rating, cancellation rate, etc.)
3. Click **"Save Changes"**

### Badge Types

#### Manual Verification Badges

These require document uploads:

- **Identity Verified** (₦2,000)
  - government_id
  - selfie_with_id
  - address_proof
- **Insurance Verified** (₦3,000)
  - insurance_certificate
  - policy_document
- **Background Verified** (₦5,000)
  - police_clearance
  - character_reference_1
  - character_reference_2
  - employment_history
- **Certified Professional** (₦2,500)
  - trade_certification
  - training_certificate
  - professional_license

#### Automatic Performance Badge

- **Top Performer** (FREE)
  - Earned automatically based on:
  - Min 20 jobs completed
  - 4.5+ star rating
  - <5% cancellation rate
  - <2% complaint rate
  - <120 min response time

## 🔧 Modifying Badge Requirements

### Via Admin UI (Recommended)

1. Go to `/admin/badges`
2. Click "Edit Badge Settings" on the badge
3. Modify requirements:
   - For **document badges**: Edit the text area (one document type per line)
   - For **performance badges**: Update the numeric criteria
4. Save changes

### Via Seed File

1. Edit `/prisma/seeds/badges.ts`
2. Modify the badge object in the `badges` array:

```typescript
{
  type: "IDENTITY_VERIFICATION",
  name: "Identity Verified",
  cost: 200000, // in kobo (₦2,000)
  requiredDocuments: ["government_id", "selfie_with_id", "address_proof"],
  expiryMonths: 12,
  // ... other fields
}
```

3. Run: `npx prisma db seed`

### Via Direct Database Query

```sql
UPDATE "Badge"
SET "requiredDocuments" = ARRAY['new_doc_1', 'new_doc_2'],
    "cost" = 250000
WHERE "type" = 'IDENTITY_VERIFICATION';
```

## 📋 Badge Schema Reference

```prisma
model Badge {
  id          String   @id @default(cuid())
  type        BadgeType
  name        String
  description String
  icon        String   // Emoji
  cost        Int      // Cost in kobo
  isActive    Boolean  @default(true)

  // Requirements
  requiredDocuments String[]  // Document types needed
  expiryMonths      Int?      // Renewal period (null = no expiry)
  isAutomatic       Boolean   // Can be earned automatically

  // Automatic badge criteria
  minJobsRequired      Int?
  minAverageRating     Float?
  maxCancellationRate  Float?
  maxComplaintRate     Float?
  maxResponseMinutes   Int?
}
```

## 🔄 Badge Request Workflow

1. **Fixer Applies**: Uploads required documents at `/fixer/badges/request/[badgeId]`
2. **Payment**: Fixer pays badge verification fee
3. **Admin Reviews**: Navigate to `/admin/badges/requests/[requestId]`
4. **Actions Available**:
   - ✅ **Approve**: Assigns badge to fixer with expiry date
   - 📝 **Request Info**: Ask fixer for additional documents/clarification
   - ❌ **Reject**: Decline badge request with reason

## 🎨 UI Features

- **DashboardLayoutWithHeader** theme consistency
- **Inline styles** with theme colors from `lib/theme.ts`
- **Responsive grid layout** using CSS Grid auto-fit
- **Client components** for interactive elements (buttons, modals)
- **Real-time validation** in edit form
- **Success/error messaging** with visual feedback

## 🔐 Security

- All routes require `ADMIN` role
- Server-side authentication checks
- Input validation on API routes
- Cost stored in kobo (integer) to avoid floating-point issues

## 📊 Statistics Tracked

For each badge:

- Total requests received
- Total assignments (active badges)
- Displayed on badge list and edit pages

## 🚀 Next Steps

1. Test badge editing at `/admin/badges`
2. Modify a badge's requirements and verify changes persist
3. Test badge request approval workflow
4. Consider adding:
   - Badge assignment history view
   - Bulk badge operations
   - Badge analytics dashboard
   - Email notifications for badge status changes

## 📖 Related Documentation

- `prisma/seeds/badges.ts` - Badge seed data
- `prisma/schema.prisma` - Badge model definition (lines 835-867)
- `app/admin/badges/requests/` - Badge request review pages
- `app/fixer/badges/` - Fixer badge application pages

---

**Status**: ✅ Complete and ready to use
**Created**: Current session
**Tested**: All pages compile with 0 errors
