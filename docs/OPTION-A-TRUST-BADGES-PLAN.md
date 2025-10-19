# 🏆 Option A: Trust Badges System - Implementation Plan

**Project:** Professional Verification Badge System  
**Start Date:** October 16, 2025  
**Estimated Duration:** 40-50 hours  
**Status:** Planning Phase

---

## 📋 Executive Summary

Build a comprehensive trust badge system that allows fixers to earn and display verification badges, increasing client trust and conversion rates. Badges verify identity, insurance, background checks, skills, and quality metrics.

---

## 🎯 Goals & Objectives

### Primary Goals

1. **Increase Trust** - Visual verification signals for clients
2. **Differentiate Fixers** - Premium fixers stand out
3. **Revenue Stream** - Monetize badge verification process
4. **Quality Control** - Encourage higher standards

### Success Metrics

- 40%+ of active fixers request at least one badge
- 15-20% increase in quote acceptance for badged fixers
- 25%+ of badge requests result in paid verifications
- <48 hour admin approval turnaround time

---

## 🏅 Badge System Architecture

### Badge Categories (5 Types)

#### 1. Identity Verification Badge 🆔

**Purpose:** Verify fixer's identity  
**Requirements:**

- Government-issued ID (Driver's License, National ID, Passport)
- Selfie with ID
- Address verification document

**Verification Method:** Manual admin review + automated ID check  
**Cost:** ₦2,000 one-time  
**Expiry:** Annual renewal  
**Impact:** 10-15% conversion lift

---

#### 2. Insurance Verification Badge 🛡️

**Purpose:** Prove liability insurance coverage  
**Requirements:**

- Valid liability insurance certificate
- Policy number and coverage amount
- Insurance company contact

**Verification Method:** Manual admin review + insurance company confirmation  
**Cost:** ₦3,000 one-time  
**Expiry:** Matches policy expiry (typically 1 year)  
**Impact:** 20-25% conversion lift (especially for high-value jobs)

---

#### 3. Background Check Badge ✅

**Purpose:** Criminal background screening  
**Requirements:**

- Police clearance certificate
- Character references (2)
- Employment history

**Verification Method:** Manual admin review + reference checks  
**Cost:** ₦5,000 one-time  
**Expiry:** Annual renewal  
**Impact:** 15-20% conversion lift

---

#### 4. Skill Certification Badge 📜

**Purpose:** Professional qualifications and training  
**Requirements:**

- Trade certification documents
- Training certificates
- Professional licenses (where applicable)

**Verification Method:** Manual admin review + issuing body verification  
**Cost:** ₦2,500 per certification  
**Expiry:** Matches certificate expiry or 2 years  
**Impact:** 12-18% conversion lift

---

#### 5. Quality Performance Badge ⭐

**Purpose:** Earned through platform performance  
**Requirements:**

- Minimum 20 completed jobs
- Average rating ≥ 4.5 stars
- <5% cancellation rate
- <2% complaint rate
- Average response time < 2 hours

**Verification Method:** Automated based on platform metrics  
**Cost:** FREE (earned, not purchased)  
**Expiry:** Quarterly re-evaluation  
**Impact:** 18-22% conversion lift

---

### Badge Tiers (4 Levels)

#### 🥉 Bronze Tier

**Requirements:** 1-2 badges  
**Display:** Bronze badge icon with subtle glow  
**Benefits:**

- "Verified" label on profile
- Badge display on search results
- Priority in "Featured" sections (low priority)

#### 🥈 Silver Tier

**Requirements:** 3-4 badges  
**Display:** Silver badge icon with medium glow  
**Benefits:**

- All Bronze benefits
- "Trusted Professional" label
- 10% boost in search ranking
- Featured in "Top Rated" category

#### 🥇 Gold Tier

**Requirements:** All 5 badges  
**Display:** Gold badge icon with bright glow  
**Benefits:**

- All Silver benefits
- "Premium Verified" label
- 20% boost in search ranking
- Exclusive "Gold Verified" badge on all content
- Priority customer support

#### 💎 Platinum Tier

**Requirements:** All 5 badges + Top 5% performer  
**Display:** Platinum badge icon with animated glow  
**Benefits:**

- All Gold benefits
- "Elite Professional" label
- 30% boost in search ranking
- Featured prominently on homepage
- Dedicated account manager
- Promotional opportunities

**Top 5% Criteria:**

- Within top 5% of fixers by:
  - Total jobs completed (weighted 30%)
  - Average rating (weighted 25%)
  - Response time (weighted 20%)
  - Client satisfaction score (weighted 15%)
  - Platform tenure (weighted 10%)

---

## 📊 Database Schema

### New Models

#### Badge Model

```prisma
model Badge {
  id          String   @id @default(cuid())
  type        BadgeType
  name        String   // "Identity Verification", "Insurance Verified", etc.
  description String
  icon        String   // Emoji or image URL
  cost        Int      // Cost in Naira
  isActive    Boolean  @default(true)

  // Requirements
  requiredDocuments String[]  // List of required document types
  expiryMonths      Int?      // How many months until renewal needed
  isAutomatic       Boolean   @default(false) // Can be earned automatically

  // Automatic badge criteria (for Quality Performance)
  minJobsRequired      Int?
  minAverageRating     Float?
  maxCancellationRate  Float?
  maxComplaintRate     Float?
  maxResponseMinutes   Int?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  requests    BadgeRequest[]
  assignments BadgeAssignment[]
}

enum BadgeType {
  IDENTITY_VERIFICATION
  INSURANCE_VERIFICATION
  BACKGROUND_CHECK
  SKILL_CERTIFICATION
  QUALITY_PERFORMANCE
}
```

#### BadgeRequest Model

```prisma
model BadgeRequest {
  id          String   @id @default(cuid())
  fixerId     String
  badgeId     String

  status      BadgeRequestStatus @default(PENDING)

  // Submitted documents
  documents   Json  // Array of { type: string, url: string, name: string }
  notes       String?  // Fixer's additional notes

  // Admin review
  reviewedBy      String?  // Admin user ID
  reviewedAt      DateTime?
  rejectionReason String?
  adminNotes      String?

  // Payment
  paymentStatus   PaymentStatus @default(PENDING)
  paymentAmount   Int
  paymentRef      String?
  paidAt          DateTime?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  fixer       User   @relation("FixerBadgeRequests", fields: [fixerId], references: [id], onDelete: Cascade)
  badge       Badge  @relation(fields: [badgeId], references: [id])
  reviewer    User?  @relation("ReviewedBadgeRequests", fields: [reviewedBy], references: [id])
  assignment  BadgeAssignment?

  @@index([fixerId])
  @@index([badgeId])
  @@index([status])
}

enum BadgeRequestStatus {
  PENDING           // Awaiting payment
  PAYMENT_RECEIVED  // Paid, awaiting review
  UNDER_REVIEW      // Admin is reviewing
  APPROVED          // Approved, badge assigned
  REJECTED          // Rejected
  EXPIRED           // Request expired (30 days unpaid)
}

enum PaymentStatus {
  PENDING
  PAID
  REFUNDED
}
```

#### BadgeAssignment Model

```prisma
model BadgeAssignment {
  id          String   @id @default(cuid())
  fixerId     String
  badgeId     String
  requestId   String?  @unique  // Null for automatic badges

  status      BadgeStatus @default(ACTIVE)

  // Validity
  assignedAt  DateTime @default(now())
  expiresAt   DateTime?
  revokedAt   DateTime?
  revokedBy   String?  // Admin user ID
  revokeReason String?

  // Verification details
  verificationDate DateTime?
  verificationNotes String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  fixer       User   @relation("FixerBadges", fields: [fixerId], references: [id], onDelete: Cascade)
  badge       Badge  @relation(fields: [badgeId], references: [id])
  request     BadgeRequest? @relation(fields: [requestId], references: [id])
  revoker     User?  @relation("RevokedBadges", fields: [revokedBy], references: [id])

  @@unique([fixerId, badgeId])
  @@index([fixerId])
  @@index([status])
  @@index([expiresAt])
}

enum BadgeStatus {
  ACTIVE
  EXPIRED
  REVOKED
}
```

#### User Model Updates

```prisma
// Add to User model
badgeRequests    BadgeRequest[] @relation("FixerBadgeRequests")
badges           BadgeAssignment[] @relation("FixerBadges")
reviewedRequests BadgeRequest[] @relation("ReviewedBadgeRequests")
revokedBadges    BadgeAssignment[] @relation("RevokedBadges")

badgeTier        BadgeTier?  // Calculated field
lastTierUpdate   DateTime?
```

```prisma
enum BadgeTier {
  BRONZE
  SILVER
  GOLD
  PLATINUM
}
```

---

## 🔄 Workflows

### Workflow 1: Badge Request (Fixer)

```
1. Fixer browses available badges
   ↓
2. Clicks "Request Badge"
   ↓
3. Reviews requirements and cost
   ↓
4. Uploads required documents
   ↓
5. Makes payment (₦2,000-5,000)
   ↓
6. Request submitted
   ↓
7. Receives confirmation email
   ↓
8. Waits for admin review (24-48 hours)
   ↓
9. Receives approval/rejection notification
   ↓
10. Badge appears on profile (if approved)
```

---

### Workflow 2: Admin Review

```
1. Admin sees pending requests dashboard
   ↓
2. Opens request details
   ↓
3. Reviews submitted documents
   ↓
4. Performs external verification (if needed)
   ↓
5. Makes decision:

   APPROVE:
   - Creates BadgeAssignment
   - Sets expiry date
   - Sends approval email
   - Fixer gets badge

   REJECT:
   - Provides rejection reason
   - Offers refund/resubmission
   - Sends rejection email
   - Fixer can resubmit
```

---

### Workflow 3: Automatic Badge Award (Quality Performance)

```
1. Daily cron job runs
   ↓
2. Query all fixers with ≥20 completed jobs
   ↓
3. For each fixer, calculate metrics:
   - Average rating
   - Cancellation rate
   - Complaint rate
   - Response time
   ↓
4. Check if meets Quality Performance criteria
   ↓
5. If YES:
   - Create BadgeAssignment (automatic)
   - Send congratulations email

   If NO (but previously had badge):
   - Revoke badge
   - Send performance warning email
```

---

### Workflow 4: Badge Renewal

```
30 days before expiry:
- Send renewal reminder email
- Show renewal notice on dashboard

On expiry date:
- Badge status → EXPIRED
- Remove from profile display
- Keep in history
- Send "Badge Expired" email
- Offer renewal process
```

---

## 🎨 UI/UX Design

### Fixer Dashboard - "My Badges" Section

```
┌─────────────────────────────────────────────┐
│ 🏅 My Badges                    [View All] │
├─────────────────────────────────────────────┤
│                                             │
│  Current Tier: 🥈 SILVER                   │
│  Active Badges: 3/5                         │
│  Next Tier: 🥇 Gold (Need 2 more badges)   │
│                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ 🆔 ✓    │  │ 🛡️ ✓    │  │ ✅ ✓     │ │
│  │ Identity │  │ Insurance│  │Background │ │
│  │ Verified │  │ Verified │  │ Check    │ │
│  │ ────────  │  │ ────────  │  │ ────────  │ │
│  │Expires:  │  │Expires:  │  │Expires:   │ │
│  │Jan 2026  │  │Mar 2026  │  │Dec 2025   │ │
│  └──────────┘  └──────────┘  └──────────┘ │
│                                             │
│  Available Badges:                          │
│  ┌──────────┐  ┌──────────┐               │
│  │ 📜       │  │ ⭐       │               │
│  │   Skill  │  │ Quality  │               │
│  │Certifica-│  │Performa- │               │
│  │tion      │  │ nce      │               │
│  │ ────────  │  │ ────────  │               │
│  │₦2,500    │  │FREE      │               │
│  │[Request] │  │[Auto]    │               │
│  └──────────┘  └──────────┘               │
└─────────────────────────────────────────────┘
```

---

### Badge Request Form

```
┌─────────────────────────────────────────────┐
│ Request: 🆔 Identity Verification Badge     │
├─────────────────────────────────────────────┤
│                                             │
│ Requirements:                               │
│ • Government-issued ID                      │
│ • Selfie with ID                            │
│ • Address verification                      │
│                                             │
│ Upload Documents:                           │
│ ┌─────────────────────────────────────────┐│
│ │ Government ID                            ││
│ │ [📎 Upload PDF/Image] ▢ government-id.jpg││
│ └─────────────────────────────────────────┘│
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ Selfie with ID                           ││
│ │ [📎 Upload Image] ▢ selfie.jpg          ││
│ └─────────────────────────────────────────┘│
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ Address Verification                     ││
│ │ [📎 Upload PDF/Image] ▢ utility-bill.pdf││
│ └─────────────────────────────────────────┘│
│                                             │
│ Additional Notes (Optional):                │
│ ┌─────────────────────────────────────────┐│
│ │                                          ││
│ │                                          ││
│ └─────────────────────────────────────────┘│
│                                             │
│ Cost: ₦2,000 (one-time)                    │
│ Estimated Review Time: 24-48 hours          │
│                                             │
│        [Cancel]  [Submit & Pay ₦2,000]     │
└─────────────────────────────────────────────┘
```

---

### Admin Review Dashboard

```
┌─────────────────────────────────────────────┐
│ 🏅 Badge Requests - Admin Review            │
├─────────────────────────────────────────────┤
│ Filters: [All] [Pending] [Under Review]    │
│          [Approved] [Rejected]              │
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ John Doe - 🆔 Identity Verification     ││
│ │ Submitted: 2 hours ago | Paid: ₦2,000   ││
│ │ Status: PAYMENT_RECEIVED                 ││
│ │ Documents: 3 uploaded                    ││
│ │                         [Review Request] ││
│ ├─────────────────────────────────────────┤│
│ │ Jane Smith - 🛡️ Insurance Verification  ││
│ │ Submitted: 1 day ago | Paid: ₦3,000     ││
│ │ Status: UNDER_REVIEW (by Admin Sarah)   ││
│ │ Documents: 2 uploaded                    ││
│ │                         [View Details]   ││
│ └─────────────────────────────────────────┘│
└─────────────────────────────────────────────┘
```

---

### Public Profile Badge Display

```
┌─────────────────────────────────────────────┐
│ John Doe                    💎 PLATINUM     │
│ Professional Plumber                        │
│                                             │
│ Badges: 🆔 🛡️ ✅ 📜 ⭐                     │
│ "Elite Professional"                        │
│                                             │
│ ⭐ 4.9 (234 reviews)                        │
│ 📅 Member 5 years                           │
│ ⚡ Responds in ~20 min                      │
│ ✓ 567 jobs completed                        │
│ 📍 Lekki, Lagos                             │
└─────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
/app
  /api
    /badges
      /route.ts                      # List all badges
      /[badgeId]
        /route.ts                    # Badge details
        /request
          /route.ts                  # Create badge request
    /badge-requests
      /route.ts                      # Fixer's requests
      /[requestId]
        /route.ts                    # Request details
        /payment
          /route.ts                  # Process payment
    /admin
      /badge-requests
        /route.ts                    # List all requests
        /[requestId]
          /approve
            /route.ts                # Approve request
          /reject
            /route.ts                # Reject request
      /badges
        /route.ts                    # Manage badges
    /cron
      /update-quality-badges
        /route.ts                    # Auto-assign quality badges
      /check-badge-expiry
        /route.ts                    # Mark expired badges
  /fixer
    /badges
      /page.tsx                      # My Badges dashboard
      /request
        /[badgeId]
          /page.tsx                  # Badge request form
  /admin
    /badges
      /page.tsx                      # Badge management
      /requests
        /page.tsx                    # Review requests
        /[requestId]
          /page.tsx                  # Review details

/components
  /badges
    /BadgeDisplay.tsx                # Single badge display
    /BadgeTierDisplay.tsx            # Tier badge (Bronze/Silver/Gold/Platinum)
    /BadgeGrid.tsx                   # Grid of badges
    /BadgeRequestCard.tsx            # Request card (admin)
    /BadgeRequestForm.tsx            # Request form (fixer)
    /BadgeUploadField.tsx            # Document upload

/lib
  /badges
    /badge-utils.ts                  # Utility functions
    /tier-calculator.ts              # Calculate fixer tier
    /quality-checker.ts              # Check quality criteria

/prisma
  /migrations
    /YYYYMMDD_trust_badges
      /migration.sql                 # Database schema
```

---

## 🔧 Technical Implementation Details

### Payment Integration

```typescript
// Badge request payment flow
1. Fixer submits badge request
2. Create BadgeRequest with status=PENDING
3. Generate payment link (Paystack/Flutterwave)
4. Redirect to payment page
5. On payment success callback:
   - Update paymentStatus=PAID
   - Update status=PAYMENT_RECEIVED
   - Send confirmation email
   - Notify admins
```

### Document Upload

```typescript
// Using UploadThing (already configured)
1. Fixer clicks upload
2. UploadThing handles file upload
3. Returns file URL
4. Store in BadgeRequest.documents as JSON:
   {
     documents: [
       { type: "government_id", url: "...", name: "id.jpg" },
       { type: "selfie", url: "...", name: "selfie.jpg" },
       { type: "address_proof", url: "...", name: "bill.pdf" }
     ]
   }
```

### Tier Calculation

```typescript
// Calculate badge tier based on active badges
function calculateBadgeTier(activeBadges: number): BadgeTier | null {
  if (activeBadges >= 5) {
    // Check if top 5% performer for Platinum
    if (isTopPerformer()) return "PLATINUM";
    return "GOLD";
  }
  if (activeBadges >= 3) return "SILVER";
  if (activeBadges >= 1) return "BRONZE";
  return null;
}
```

### Quality Badge Auto-Assignment

```typescript
// Daily cron job
async function assignQualityBadges() {
  const fixers = await prisma.user.findMany({
    where: {
      roles: { has: "FIXER" },
      fixerProfile: {
        totalJobsCompleted: { gte: 20 },
      },
    },
    include: {
      fixerProfile: true,
      orders: { where: { status: "COMPLETED" } },
    },
  });

  for (const fixer of fixers) {
    const metrics = calculateMetrics(fixer);

    if (meetsQualityCriteria(metrics)) {
      await assignBadge(fixer.id, "QUALITY_PERFORMANCE");
    } else {
      await revokeBadge(fixer.id, "QUALITY_PERFORMANCE");
    }
  }
}
```

---

## 📅 Implementation Phases

### Phase 1: Foundation (Week 1) - 12 hours

- ✅ Database schema design
- ✅ Prisma migrations
- ✅ Seed initial badges
- ✅ Basic badge models and types

### Phase 2: Fixer Badge Request (Week 2) - 10 hours

- ✅ Badge browsing UI
- ✅ Request form with document upload
- ✅ Payment integration
- ✅ Request submission API

### Phase 3: Admin Review System (Week 2-3) - 12 hours

- ✅ Admin dashboard
- ✅ Request review UI
- ✅ Approve/reject workflows
- ✅ Document viewer
- ✅ Admin APIs

### Phase 4: Badge Display (Week 3) - 8 hours

- ✅ Badge display components
- ✅ Tier badge components
- ✅ Integrate on profiles
- ✅ Integrate on search/gigs
- ✅ Integrate on category pages

### Phase 5: Automation & Polish (Week 4) - 8 hours

- ✅ Quality badge cron job
- ✅ Expiry checker cron job
- ✅ Email notifications
- ✅ Tier calculation
- ✅ Search ranking boost

**Total:** 50 hours over 4 weeks

---

## 🎯 Success Criteria

### Must Have (MVP)

- ✅ All 5 badge types created
- ✅ Fixer can request badges
- ✅ Document upload works
- ✅ Payment integration
- ✅ Admin can approve/reject
- ✅ Badges display on profile
- ✅ Tier system works
- ✅ Quality badge auto-assignment

### Should Have

- ✅ Email notifications
- ✅ Expiry tracking
- ✅ Renewal flow
- ✅ Badge revocation
- ✅ Search ranking boost

### Nice to Have

- ⏳ Badge analytics
- ⏳ Badge marketplace insights
- ⏳ Batch admin operations
- ⏳ Badge dispute system

---

## 💰 Revenue Projections

### Assumptions

- 500 active fixers
- 40% adoption rate = 200 fixers
- Average 2.5 badges per fixer = 500 badge requests
- Average badge cost = ₦3,000

### Revenue

- **Year 1:** 500 requests × ₦3,000 = ₦1,500,000
- **Renewals (Year 2):** ~60% = ₦900,000/year
- **Total 2-Year:** ₦2,400,000 (~$3,000 USD)

---

## 📊 KPIs & Metrics

### Adoption Metrics

- % of fixers with at least 1 badge
- Average badges per fixer
- Most popular badge type
- Time to first badge request

### Performance Metrics

- Badge approval rate
- Average review time
- Rejection reasons (most common)
- Renewal rate

### Business Metrics

- Total badge revenue
- Revenue per badge type
- Conversion rate (request → payment)
- Client trust score increase

---

## 🚀 Next Steps

1. **Review & Approve Plan** ✅
2. **Create Database Schema**
3. **Build Foundation (Phase 1)**
4. **Implement Fixer Flow (Phase 2)**
5. **Build Admin System (Phase 3)**
6. **Display Integration (Phase 4)**
7. **Automation & Launch (Phase 5)**

---

**Ready to start implementation!**  
**First Task:** Database Schema Design & Migration

**Estimated Completion:** 4 weeks from start  
**High Priority:** Yes  
**Impact:** High (trust + revenue)
