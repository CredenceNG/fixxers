# 🎯 MASTER IMPLEMENTATION PLAN - All Features

## HomeStars & JiffyOnDemand Feature Implementation

**Created:** October 16, 2025  
**Project:** Fixxers Platform Enhancement  
**Goal:** Implement trust signals, verified reviews, and quick wins for marketplace differentiation

---

## 📊 OVERALL PROGRESS TRACKER

| Phase        | Features                | Status         | Progress | ETA      |
| ------------ | ----------------------- | -------------- | -------- | -------- |
| **Option C** | Quick Wins (5 features) | 🟡 In Progress | 80%      | Week 1   |
| **Option A** | Trust Badges System     | 🔴 Not Started | 0%       | Week 2-3 |
| **Option B** | Verified Reviews        | 🔴 Not Started | 0%       | Week 3-4 |

**Overall Completion: 27% (8/30 major features)**

**Latest Update (Oct 16, 2025):** ✅ Referral system complete! Page created, backend integrated, ready for testing.

---

# 🚀 OPTION C: QUICK WINS (Week 1)

**Goal:** Immediate value features for trust & virality  
**Time Estimate:** 3-5 days  
**Status:** 70% Complete ✅

## ✅ Completed Items

### Database & Backend (100% Complete)

- [x] Add `referralCode` field to User model (unique)
- [x] Add `averageResponseMinutes` to FixerProfile
- [x] Add `totalJobsCompleted` to FixerProfile
- [x] Add `responseTimeMinutes` to Quote model
- [x] Run `prisma db push` to sync schema
- [x] Generate Prisma Client v6.17.1
- [x] Create `scripts/generate-referral-codes.ts`
- [x] Create `scripts/calculate-response-times.ts`
- [x] Create `lib/quick-wins/response-time.ts` utilities
- [x] Create `scripts/quick-wins-setup.sh`
- [x] Generate referral codes for all 28 users
- [x] Calculate response times for existing 3 quotes
- [x] Update 1 fixer profile with average response time

### Badge Components (100% Complete)

- [x] Create `components/quick-wins/QuickWinBadges.tsx`
- [x] Implement `AvailableNowBadge` component
- [x] Implement `YearsOfService` component
- [x] Implement `ReviewCount` component
- [x] Implement `ResponseTimeBadge` component
- [x] Implement `JobsCompleted` component
- [x] Implement `ServiceArea` component
- [x] Implement `ReferralCodeDisplay` component
- [x] Convert all components to inline styles
- [x] Standardize icon sizes (12-14px)
- [x] Test badge responsiveness

### UI Implementation - Browse Pages (100% Complete)

- [x] Import badge components in `/app/gigs/page.tsx`
- [x] Update Prisma query to fetch fixer profile data
- [x] Add `AvailableNowBadge` to gig cards
- [x] Add `ReviewCount` to gig cards
- [x] Add `YearsOfService` to gig cards
- [x] Add `ResponseTimeBadge` to gig cards
- [x] Add `JobsCompleted` to gig cards
- [x] Add `ServiceArea` to gig cards
- [x] Test badge display on `/gigs` browse page
- [x] Verify responsive layout on mobile

### UI Implementation - Detail Pages (100% Complete)

- [x] Import badge components in `/app/gigs/[slug]/page.tsx`
- [x] Update Prisma query to fetch seller data
- [x] Add badges to top seller info section
- [x] Add badges to "About The Seller" section
- [x] Test badge display on gig detail page
- [x] Verify conditional badge visibility

### Documentation (100% Complete)

- [x] Create `README-QUICK-WINS.md`
- [x] Create `QUICK-WINS-SUMMARY.md`
- [x] Create `QUICK-WINS-CHECKLIST.md`
- [x] Create `QUICK-WINS-VISUAL-GUIDE.md`
- [x] Create `docs/QUICK-WINS-GUIDE.md`
- [x] Create `SETUP-SUCCESS.md`
- [x] Create `BADGES-ADDED-TO-SEARCH.md`
- [x] Create `BADGE-IMPROVEMENTS.md`
- [x] Create `INLINE-STYLES-FIX.md`
- [x] Create `GIG-DETAIL-BADGES-ADDED.md`

## 🔴 Outstanding Items (30% Remaining)

### High Priority - Complete This Week

#### 1. Referral Page & System (Priority: CRITICAL) ✅ COMPLETE

- [x] Create `/app/settings/referral/page.tsx`
- [x] Import `ReferralCodeDisplay` component
- [x] Display user's referral code with copy button
- [x] Generate and display referral link: `${BASE_URL}/signup?ref=${code}`
- [x] Add instructions for sharing
- [x] Add social sharing buttons (Twitter, WhatsApp, Email)
- [x] Style referral page with theme colors
- [x] Add navigation link to settings menu
- [x] Test referral code display for all users
- [x] **Backend:** Update signup flow to accept `ref` query param
- [x] **Backend:** Store `referredBy` relationship on signup
- [ ] **Backend:** Add referral stats endpoint (optional)
- [ ] Test complete referral flow (share → signup → track)

#### 2. Category Pages - Add Badges (Priority: HIGH)

- [ ] Open `/app/categories/[id]/page.tsx`
- [ ] Import badge components
- [ ] Update Prisma query to fetch fixer profile data
- [ ] Add badges to fixer cards/listings
- [ ] Match layout from `/gigs` page
- [ ] Test on multiple categories
- [ ] Verify responsive design

#### 3. Response Time Integration (Priority: HIGH)

- [ ] Locate existing quote creation endpoint/logic
- [ ] Import `calculateQuoteResponseTime` from utilities
- [ ] Add response time calculation on quote submission
- [ ] Save `responseTimeMinutes` to Quote model
- [ ] Trigger async fixer average update
- [ ] Test with new quote submissions
- [ ] Verify response time badges update
- [ ] OR integrate existing `/api/quotes/create-with-tracking` endpoint

#### 4. Cron Job Setup (Priority: HIGH)

- [ ] Create `/app/api/cron/update-response-times/route.ts`
- [ ] Import `batchUpdateAllFixerResponseTimes` utility
- [ ] Add authentication (CRON_SECRET)
- [ ] Implement daily update logic
- [ ] Add to `vercel.json` cron schedule: `0 2 * * *` (2 AM daily)
- [ ] Set `CRON_SECRET` environment variable
- [ ] Test cron endpoint manually
- [ ] Deploy and verify daily execution
- [ ] Set up monitoring/alerts for failures

### Medium Priority - Complete Next Week

#### 5. Jobs Completed Counter Logic

- [ ] Locate order completion flow
- [ ] Add increment logic for `totalJobsCompleted`
- [ ] Update FixerProfile on order status = COMPLETED
- [ ] Create backfill script for existing completed orders
- [ ] Run backfill script once
- [ ] Test counter increments on new completions
- [ ] Verify badge updates automatically

#### 6. Profile Pages - Add Badges

- [ ] Locate fixer profile page (`/app/fixer/[id]/page.tsx` or similar)
- [ ] Import badge components
- [ ] Update Prisma query
- [ ] Add badges to profile header
- [ ] Add badges to profile sidebar/info section
- [ ] Test badge display
- [ ] Verify responsive design

#### 7. Dashboard Pages - Add Badges

- [ ] Locate dashboard pages with fixer listings
- [ ] Add badges to fixer cards in dashboard
- [ ] Test for all user roles (CLIENT, FIXER, ADMIN)

#### 8. Available Now Toggle UI

- [ ] Create UI for fixers to toggle instant booking
- [ ] Add toggle to fixer settings or gig creation
- [ ] Update `Gig.allowInstantBooking` field
- [ ] Verify Available Now badge updates
- [ ] Consider auto-toggle based on time (optional)

### Low Priority - Future Enhancements

#### 9. Testing & Quality

- [ ] Write unit tests for badge components
- [ ] Test edge cases (null, zero, very large numbers)
- [ ] Cross-browser testing (Chrome, Safari, Firefox)
- [ ] Performance testing with 1000+ results
- [ ] Accessibility testing (screen readers)

#### 10. Analytics & Monitoring

- [ ] Track badge click-through rates
- [ ] Measure conversion rate improvements
- [ ] Monitor cron job execution
- [ ] Set up error alerts
- [ ] A/B test badge variations

---

# 🏆 OPTION A: TRUST BADGES SYSTEM (Week 2-3)

**Goal:** Multi-tier badge system with admin approval  
**Time Estimate:** 8-10 days  
**Status:** Not Started

## Database Schema (Estimated: 2 hours)

### Migration File

- [ ] Create migration: `prisma/migrations/[timestamp]_trust_badges/migration.sql`
- [ ] Create `Badge` model with fields:
  - [ ] `id` (String, @id, @default(cuid()))
  - [ ] `name` (String, unique)
  - [ ] `description` (String)
  - [ ] `icon` (String, emoji or icon name)
  - [ ] `tier` (Enum: BRONZE, SILVER, GOLD, PLATINUM)
  - [ ] `category` (Enum: QUALITY, SPEED, RELIABILITY, SPECIALTY)
  - [ ] `criteria` (Json, requirements object)
  - [ ] `isActive` (Boolean, @default(true))
  - [ ] `createdAt` (DateTime, @default(now()))
  - [ ] `updatedAt` (DateTime, @updatedAt)
- [ ] Create `BadgeEarned` model with fields:
  - [ ] `id` (String, @id, @default(cuid()))
  - [ ] `userId` (String, foreign key to User)
  - [ ] `badgeId` (String, foreign key to Badge)
  - [ ] `status` (Enum: PENDING, APPROVED, REJECTED)
  - [ ] `earnedAt` (DateTime, @default(now()))
  - [ ] `approvedAt` (DateTime?, nullable)
  - [ ] `approvedBy` (String?, foreign key to User)
  - [ ] `rejectionReason` (String?, nullable)
  - [ ] `evidenceData` (Json?, supporting metrics)
- [ ] Add relations to User model
- [ ] Add relations to Badge model
- [ ] Run `npx prisma migrate dev --name trust_badges`
- [ ] Run `npx prisma generate`
- [ ] Verify schema in database

### Seed Data

- [ ] Create `prisma/seed-badges.ts`
- [ ] Define Bronze tier badges (5-8 badges):
  - [ ] "Fast Responder" - <1hr average response
  - [ ] "Reliable" - 90%+ completion rate
  - [ ] "Highly Rated" - 4.5+ rating, 10+ reviews
  - [ ] "Experienced" - 50+ completed jobs
  - [ ] "Great Communicator" - 95%+ response rate
- [ ] Define Silver tier badges (5-8 badges):
  - [ ] "Speed Demon" - <30min average response
  - [ ] "Rock Solid" - 95%+ completion rate
  - [ ] "Customer Favorite" - 4.8+ rating, 50+ reviews
  - [ ] "Veteran" - 200+ completed jobs
  - [ ] "Always Available" - 98%+ response rate
- [ ] Define Gold tier badges (4-6 badges):
  - [ ] "Lightning Fast" - <15min average response
  - [ ] "Perfect Track" - 98%+ completion rate
  - [ ] "5-Star Legend" - 4.9+ rating, 100+ reviews
  - [ ] "Master Professional" - 500+ completed jobs
  - [ ] "Instant Responder" - 99%+ response rate
- [ ] Define Platinum tier badges (3-5 badges):
  - [ ] "Platform Elite" - Top 1% overall
  - [ ] "Perfect Rating" - 5.0 rating, 200+ reviews
  - [ ] "Legendary" - 1000+ completed jobs
  - [ ] "Category Expert" - Specialty certification
- [ ] Run seed script: `npx tsx prisma/seed-badges.ts`
- [ ] Verify badges in database

## Badge Service Logic (Estimated: 6-8 hours)

### Core Service

- [ ] Create `lib/services/badge-service.ts`
- [ ] Implement `calculateEligibleBadges(userId: string)`
  - [ ] Fetch user metrics (orders, reviews, response times)
  - [ ] Check each badge's criteria
  - [ ] Return list of eligible badges
- [ ] Implement `requestBadge(userId: string, badgeId: string)`
  - [ ] Validate badge eligibility
  - [ ] Create BadgeEarned record with PENDING status
  - [ ] Store evidence data (metrics snapshot)
  - [ ] Send notification to admins
  - [ ] Return request ID
- [ ] Implement `approveBadge(badgeEarnedId: string, adminId: string)`
  - [ ] Verify admin permissions
  - [ ] Update status to APPROVED
  - [ ] Set approvedAt and approvedBy
  - [ ] Send notification to user
- [ ] Implement `rejectBadge(badgeEarnedId: string, adminId: string, reason: string)`
  - [ ] Verify admin permissions
  - [ ] Update status to REJECTED
  - [ ] Store rejection reason
  - [ ] Send notification to user
- [ ] Implement `revokeBadge(badgeEarnedId: string, adminId: string, reason: string)`
  - [ ] Verify admin permissions
  - [ ] Soft delete or mark as revoked
  - [ ] Send notification to user
- [ ] Implement `getUserBadges(userId: string, status?: 'APPROVED' | 'PENDING' | 'REJECTED')`
  - [ ] Fetch badges with optional status filter
  - [ ] Return sorted by tier and earnedAt

### Criteria Evaluation

- [ ] Create `lib/services/badge-criteria.ts`
- [ ] Implement criteria checkers:
  - [ ] `checkAverageResponseTime(userId: string, maxMinutes: number)`
  - [ ] `checkCompletionRate(userId: string, minRate: number)`
  - [ ] `checkAverageRating(userId: string, minRating: number, minReviews: number)`
  - [ ] `checkTotalJobs(userId: string, minJobs: number)`
  - [ ] `checkResponseRate(userId: string, minRate: number)`
  - [ ] `checkSpecialtyExpertise(userId: string, categoryId: string)`
- [ ] Write unit tests for criteria functions

### Automated Badge Awards

- [ ] Create `lib/services/auto-badge-award.ts`
- [ ] Implement `evaluateAndAwardBadges(userId: string)`
  - [ ] Called after order completion, review submission
  - [ ] Check all bronze tier badges (auto-award if eligible)
  - [ ] Create PENDING requests for silver+ tiers
- [ ] Add trigger points:
  - [ ] After order marked as completed
  - [ ] After review submitted
  - [ ] After quote responded to
- [ ] Add daily cron job to re-evaluate all users

## API Endpoints (Estimated: 4-6 hours)

### Public Endpoints

- [ ] Create `/app/api/badges/route.ts`
  - [ ] GET - List all active badges
  - [ ] Returns badge list with criteria
- [ ] Create `/app/api/badges/[userId]/route.ts`
  - [ ] GET - Get user's approved badges
  - [ ] Public endpoint for displaying badges

### Protected Endpoints (Fixer Only)

- [ ] Create `/app/api/badges/eligible/route.ts`
  - [ ] GET - Get eligible badges for current user
  - [ ] Requires authentication
- [ ] Create `/app/api/badges/request/route.ts`
  - [ ] POST - Request a badge
  - [ ] Body: `{ badgeId: string }`
  - [ ] Requires authentication
- [ ] Create `/app/api/badges/my-badges/route.ts`
  - [ ] GET - Get current user's badges (all statuses)
  - [ ] Requires authentication

### Admin Endpoints

- [ ] Create `/app/api/admin/badges/pending/route.ts`
  - [ ] GET - List all pending badge requests
  - [ ] Requires ADMIN role
- [ ] Create `/app/api/admin/badges/approve/route.ts`
  - [ ] POST - Approve badge request
  - [ ] Body: `{ badgeEarnedId: string }`
  - [ ] Requires ADMIN role
- [ ] Create `/app/api/admin/badges/reject/route.ts`
  - [ ] POST - Reject badge request
  - [ ] Body: `{ badgeEarnedId: string, reason: string }`
  - [ ] Requires ADMIN role
- [ ] Create `/app/api/admin/badges/revoke/route.ts`
  - [ ] POST - Revoke approved badge
  - [ ] Body: `{ badgeEarnedId: string, reason: string }`
  - [ ] Requires ADMIN role

## Admin UI (Estimated: 6-8 hours)

### Badge Management Dashboard

- [ ] Create `/app/admin/badges/page.tsx`
- [ ] Display pending badge requests table
  - [ ] Columns: User, Badge, Tier, Requested Date, Evidence
  - [ ] Action buttons: Approve, Reject
- [ ] Add filters: Tier, Status, Date range
- [ ] Add search by user name or badge name
- [ ] Display badge statistics:
  - [ ] Total badges awarded
  - [ ] Pending requests count
  - [ ] Approval rate
  - [ ] Badges by tier breakdown

### Badge Request Detail Modal

- [ ] Create modal component for request details
- [ ] Display user information:
  - [ ] Name, avatar, join date
  - [ ] Total orders, rating, response time
- [ ] Display badge information:
  - [ ] Badge name, tier, criteria
  - [ ] Evidence data (metrics snapshot)
- [ ] Add approve/reject actions with reason input
- [ ] Show approval history if applicable

### Badge Configuration (Optional)

- [ ] Create `/app/admin/badges/config/page.tsx`
- [ ] List all badges with edit/delete options
- [ ] Add form to create new badge:
  - [ ] Name, description, icon picker
  - [ ] Tier selector
  - [ ] Category selector
  - [ ] Criteria builder (JSON editor or form)
- [ ] Toggle badge active/inactive status

## Fixer UI (Estimated: 4-6 hours)

### Badge Dashboard

- [ ] Create `/app/fixer/badges/page.tsx`
- [ ] Display current user's approved badges
  - [ ] Group by tier (Platinum, Gold, Silver, Bronze)
  - [ ] Show badge icon, name, earned date
- [ ] Display pending requests
  - [ ] Show status, requested date
  - [ ] Show rejection reason if applicable
- [ ] Display eligible badges
  - [ ] Show badges user can request
  - [ ] Show current progress vs. criteria
  - [ ] Add "Request Badge" button

### Badge Request Flow

- [ ] Create request confirmation modal
- [ ] Show badge details and criteria
- [ ] Display user's current metrics
- [ ] Add "Confirm Request" button
- [ ] Show success/error feedback
- [ ] Send user to pending requests section

## Display Components (Estimated: 3-4 hours)

### Badge Display Component

- [ ] Create `components/TrustBadge.tsx`
- [ ] Props: badge, size (sm, md, lg), showTooltip
- [ ] Display badge icon with tier color:
  - [ ] Bronze: #CD7F32
  - [ ] Silver: #C0C0C0
  - [ ] Gold: #FFD700
  - [ ] Platinum: #E5E4E2
- [ ] Add hover tooltip with badge description
- [ ] Add animation on hover (optional)

### Badge Collection Component

- [ ] Create `components/BadgeCollection.tsx`
- [ ] Props: userId or badges array
- [ ] Display badges in grid layout
- [ ] Sort by tier (highest first)
- [ ] Add "View All" expansion if > 4 badges
- [ ] Responsive design (2-col mobile, 4-col desktop)

### Integration Points

- [ ] Add badges to fixer profile pages
  - [ ] Header section (top 3-4 badges)
  - [ ] Full collection in sidebar
- [ ] Add badges to search/browse cards
  - [ ] Show top 2-3 badges on cards
- [ ] Add badges to gig detail pages
  - [ ] Next to seller name
- [ ] Add badge indicator in messages/chat

## Notifications (Estimated: 2-3 hours)

### Badge Notifications

- [ ] Add notification types to system:
  - [ ] BADGE_ELIGIBLE - "You're eligible for [Badge]!"
  - [ ] BADGE_APPROVED - "Your [Badge] request was approved!"
  - [ ] BADGE_REJECTED - "Your [Badge] request was rejected"
  - [ ] BADGE_REVOKED - "Your [Badge] was revoked"
- [ ] Create email templates for each type
- [ ] Create in-app notification UI
- [ ] Add notification preferences

## Testing & QA (Estimated: 3-4 hours)

- [ ] Test badge eligibility calculations
- [ ] Test badge request flow (fixer perspective)
- [ ] Test admin approval flow
- [ ] Test admin rejection flow
- [ ] Test badge display on all pages
- [ ] Test badge revocation
- [ ] Test automated badge awards
- [ ] Test notifications
- [ ] Test edge cases (ties, metric changes)
- [ ] Performance test with 1000+ badges

## Documentation (Estimated: 2-3 hours)

- [ ] Create `TRUST-BADGES-GUIDE.md`
- [ ] Document badge tiers and criteria
- [ ] Document admin workflows
- [ ] Document fixer workflows
- [ ] Create FAQ for users
- [ ] Add API documentation
- [ ] Create video tutorial (optional)

---

# 📸 OPTION B: VERIFIED REVIEWS WITH PHOTOS (Week 3-4)

**Goal:** Photo reviews with 30-day window and response system  
**Time Estimate:** 8-10 days  
**Status:** Not Started

## Database Schema (Estimated: 2 hours)

### Migration File

- [ ] Create migration: `prisma/migrations/[timestamp]_verified_reviews/migration.sql`
- [ ] Update `Review` model:
  - [ ] Add `photos` (String[], array of photo URLs)
  - [ ] Add `isVerified` (Boolean, true if from completed order)
  - [ ] Add `orderId` (String?, foreign key to Order)
  - [ ] Add `responseText` (String?, seller response)
  - [ ] Add `respondedAt` (DateTime?, when seller responded)
  - [ ] Add `isEdited` (Boolean, @default(false))
  - [ ] Add `editedAt` (DateTime?, last edit timestamp)
  - [ ] Add `helpfulCount` (Int, @default(0))
  - [ ] Add `reportCount` (Int, @default(0))
- [ ] Create `ReviewHelpful` model:
  - [ ] `id` (String, @id, @default(cuid()))
  - [ ] `reviewId` (String, foreign key to Review)
  - [ ] `userId` (String, foreign key to User)
  - [ ] `createdAt` (DateTime, @default(now()))
- [ ] Create `ReviewReport` model:
  - [ ] `id` (String, @id, @default(cuid()))
  - [ ] `reviewId` (String, foreign key to Review)
  - [ ] `reportedBy` (String, foreign key to User)
  - [ ] `reason` (String)
  - [ ] `status` (Enum: PENDING, REVIEWED, ACTIONED)
  - [ ] `createdAt` (DateTime, @default(now()))
- [ ] Add constraints:
  - [ ] Unique constraint on ReviewHelpful [reviewId, userId]
  - [ ] Max 5 photos per review (app-level validation)
- [ ] Run `npx prisma migrate dev --name verified_reviews`
- [ ] Run `npx prisma generate`

## Photo Upload Infrastructure (Estimated: 3-4 hours)

### UploadThing Configuration

- [ ] Verify UploadThing is installed and configured
- [ ] Create dedicated route for review photos
- [ ] Create `/app/api/uploadthing/route.ts` (if not exists)
- [ ] Configure file size limits (5MB per photo)
- [ ] Configure file type restrictions (jpg, png, webp)
- [ ] Configure max files per upload (5 photos)
- [ ] Set up photo optimization (resize to max 1200px width)

### Upload Component

- [ ] Create `components/ReviewPhotoUpload.tsx`
- [ ] Use UploadThing's `useUploadThing` hook
- [ ] Implement drag-and-drop interface
- [ ] Show photo preview grid
- [ ] Add remove photo button
- [ ] Display upload progress
- [ ] Show error states (too large, wrong format, etc.)
- [ ] Add photo reordering (drag to reorder)
- [ ] Maximum 5 photos validation
- [ ] Responsive design (mobile-friendly)

### Photo Display Component

- [ ] Create `components/ReviewPhotoGallery.tsx`
- [ ] Display photos in grid (2-3 cols)
- [ ] Click to open lightbox/modal
- [ ] Add image zoom functionality
- [ ] Add navigation (prev/next)
- [ ] Lazy load images for performance
- [ ] Add loading skeletons

## Review Submission (Estimated: 4-5 hours)

### 30-Day Window Enforcement

- [ ] Create utility: `lib/utils/review-window.ts`
- [ ] Implement `canLeaveReview(orderId: string)`
  - [ ] Check if order is completed
  - [ ] Check if within 30 days of completion
  - [ ] Check if review already submitted
  - [ ] Return boolean + error message
- [ ] Implement `getReviewWindowExpiry(orderId: string)`
  - [ ] Calculate days remaining
  - [ ] Return expiry date

### Review Form

- [ ] Create `/app/orders/[orderId]/review/page.tsx`
- [ ] Fetch order details (verify ownership and completion)
- [ ] Verify 30-day window (redirect if expired)
- [ ] Display order summary:
  - [ ] Fixer name
  - [ ] Service provided
  - [ ] Completion date
  - [ ] Days remaining to review
- [ ] Create review form:
  - [ ] Star rating (1-5) - required
  - [ ] Review text (min 50 chars, max 2000) - required
  - [ ] Photo upload (0-5 photos) - optional
  - [ ] Anonymous option checkbox - optional
- [ ] Add real-time character count
- [ ] Add form validation
- [ ] Show preview before submit
- [ ] Handle form submission

### Review Creation API

- [ ] Create `/app/api/reviews/create/route.ts`
- [ ] POST endpoint:
  - [ ] Authenticate user
  - [ ] Validate order ownership
  - [ ] Validate 30-day window
  - [ ] Validate no existing review
  - [ ] Validate rating (1-5)
  - [ ] Validate text length (50-2000 chars)
  - [ ] Validate photo count (max 5)
  - [ ] Create review record with `isVerified: true`
  - [ ] Link to orderId
  - [ ] Update order reviewSubmitted flag
  - [ ] Send notification to fixer
  - [ ] Send thank you email to reviewer
  - [ ] Return review data

### Review Access Control

- [ ] Update review query to only show verified reviews by default
- [ ] Add "Verified Purchase" badge to verified reviews
- [ ] Filter out reviews > 30 days old for submission
- [ ] Allow editing within 48 hours of submission

## Email Notifications (Estimated: 3-4 hours)

### Review Request Email

- [ ] Create template: `emails/review-request.tsx`
- [ ] Trigger: 3 days after order completion
- [ ] Content:
  - [ ] Friendly reminder to leave review
  - [ ] Direct link to review page
  - [ ] Mention 30-day window
  - [ ] Mention photo upload option
  - [ ] Expiry countdown
- [ ] Add to email service (Resend)

### Review Window Reminder Email

- [ ] Create template: `emails/review-expiring.tsx`
- [ ] Trigger: 3 days before 30-day window closes
- [ ] Content:
  - [ ] Urgent reminder
  - [ ] Days remaining
  - [ ] Direct link to review page
- [ ] Add to email service

### Review Submitted Email (to Fixer)

- [ ] Create template: `emails/review-received.tsx`
- [ ] Trigger: Immediately after review submission
- [ ] Content:
  - [ ] Notification of new review
  - [ ] Star rating preview
  - [ ] Link to view full review
  - [ ] Link to respond
- [ ] Add to email service

### Email Service Integration

- [ ] Create email utilities in `lib/email/review-emails.ts`
- [ ] Implement `sendReviewRequest(orderId: string)`
- [ ] Implement `sendReviewExpiring(orderId: string)`
- [ ] Implement `sendReviewReceived(reviewId: string)`
- [ ] Add cron job for automated sends

## Fixer Response System (Estimated: 3-4 hours)

### Response Form

- [ ] Create `/app/reviews/[reviewId]/respond/page.tsx`
- [ ] Verify fixer ownership
- [ ] Display original review (read-only):
  - [ ] Client name (if not anonymous)
  - [ ] Rating
  - [ ] Review text
  - [ ] Photos
- [ ] Create response form:
  - [ ] Response text (min 20 chars, max 1000)
  - [ ] Professional tone guidelines
  - [ ] Character count
- [ ] Show preview before submit
- [ ] Handle submission

### Response API

- [ ] Create `/app/api/reviews/[reviewId]/respond/route.ts`
- [ ] POST endpoint:
  - [ ] Authenticate fixer
  - [ ] Verify review is for fixer's service
  - [ ] Validate response text (20-1000 chars)
  - [ ] Update review with responseText and respondedAt
  - [ ] Send notification to reviewer
  - [ ] Return updated review

### Response Display

- [ ] Update review display component
- [ ] Show fixer response below review
- [ ] Add "Response from seller" label
- [ ] Display response timestamp
- [ ] Style differently from review (indented, lighter bg)

## Review Display & Filtering (Estimated: 4-5 hours)

### Enhanced Review Card

- [ ] Create `components/VerifiedReviewCard.tsx`
- [ ] Display "Verified Purchase" badge
- [ ] Display star rating
- [ ] Display review text (expand/collapse if long)
- [ ] Display photo gallery (if photos exist)
- [ ] Display reviewer name or "Anonymous"
- [ ] Display review date
- [ ] Display fixer response (if exists)
- [ ] Add "Helpful" button with count
- [ ] Add "Report" button
- [ ] Show edit indicator if edited

### Review List Component

- [ ] Create `components/ReviewList.tsx`
- [ ] Fetch reviews with pagination (10 per page)
- [ ] Display reviews in list
- [ ] Add loading skeleton
- [ ] Add empty state
- [ ] Implement infinite scroll or pagination
- [ ] Show review summary stats at top:
  - [ ] Average rating
  - [ ] Total reviews
  - [ ] Rating distribution (5-star, 4-star, etc.)

### Review Filters

- [ ] Create filter sidebar/dropdown
- [ ] Filter by rating (5-star, 4-star, etc.)
- [ ] Filter by verified only
- [ ] Filter by with photos only
- [ ] Filter by with response
- [ ] Sort by: Most recent, Most helpful, Highest rated, Lowest rated
- [ ] Update URL params for shareable filtered views

### Integration Points

- [ ] Add reviews to fixer profile page
- [ ] Add reviews to gig detail page
- [ ] Add review summary to search cards
- [ ] Add review count to fixer dashboard

## Helpful & Report Features (Estimated: 2-3 hours)

### Helpful Button

- [ ] Create `/app/api/reviews/[reviewId]/helpful/route.ts`
- [ ] POST endpoint:
  - [ ] Authenticate user
  - [ ] Create ReviewHelpful record (or delete if already helpful)
  - [ ] Increment/decrement review helpfulCount
  - [ ] Return updated count
- [ ] Add optimistic UI update
- [ ] Prevent self-helpful (can't mark own review)

### Report Button

- [ ] Create report modal component
- [ ] Add report reasons dropdown:
  - [ ] Inappropriate content
  - [ ] Spam
  - [ ] Fake review
  - [ ] Harassment
  - [ ] Other
- [ ] Add details textarea
- [ ] Create `/app/api/reviews/[reviewId]/report/route.ts`
- [ ] POST endpoint:
  - [ ] Authenticate user
  - [ ] Create ReviewReport record
  - [ ] Increment review reportCount
  - [ ] Send notification to admin
  - [ ] Return success

## Admin Review Moderation (Estimated: 3-4 hours)

### Moderation Dashboard

- [ ] Create `/app/admin/reviews/page.tsx`
- [ ] Display reported reviews table
  - [ ] Columns: Review, Reporter, Reason, Status, Actions
  - [ ] Filter by status (PENDING, REVIEWED, ACTIONED)
- [ ] Add quick actions:
  - [ ] View review in context
  - [ ] Delete review
  - [ ] Ban user
  - [ ] Mark as reviewed (no action)
  - [ ] Respond to reporter

### Moderation Actions API

- [ ] Create `/app/api/admin/reviews/[reviewId]/delete/route.ts`
- [ ] Create `/app/api/admin/reviews/[reviewId]/hide/route.ts`
- [ ] Create `/app/api/admin/reviews/report/[reportId]/resolve/route.ts`
- [ ] Implement soft delete for reviews
- [ ] Send notifications on moderation actions

## Review Analytics (Estimated: 2-3 hours)

### Fixer Analytics

- [ ] Create review analytics in fixer dashboard
- [ ] Display metrics:
  - [ ] Average rating (last 30 days, all time)
  - [ ] Total reviews
  - [ ] Reviews with photos percentage
  - [ ] Response rate to reviews
  - [ ] Average response time
- [ ] Display rating trend chart
- [ ] Display recent reviews

### Platform Analytics (Admin)

- [ ] Add review metrics to admin dashboard
- [ ] Total reviews submitted
- [ ] Verified review percentage
- [ ] Reviews with photos percentage
- [ ] Average rating across platform
- [ ] Review submission rate

## Testing & QA (Estimated: 3-4 hours)

- [ ] Test 30-day window enforcement
- [ ] Test review submission with 0-5 photos
- [ ] Test photo upload (size limits, format validation)
- [ ] Test review editing within 48 hours
- [ ] Test fixer response flow
- [ ] Test helpful button (logged in/out)
- [ ] Test report flow
- [ ] Test email notifications
- [ ] Test review filtering and sorting
- [ ] Test mobile responsiveness
- [ ] Test admin moderation
- [ ] Performance test with 1000+ reviews

## Documentation (Estimated: 2 hours)

- [ ] Create `VERIFIED-REVIEWS-GUIDE.md`
- [ ] Document review submission process
- [ ] Document photo upload requirements
- [ ] Document 30-day window policy
- [ ] Document fixer response guidelines
- [ ] Create user FAQ
- [ ] Create admin moderation guide

---

# 🎯 EXECUTION STRATEGY

## Week 1: Complete Quick Wins (Option C)

**Days 1-2:**

- [ ] Create referral page
- [ ] Add badges to category pages
- [ ] Test both features

**Days 3-4:**

- [ ] Integrate response time tracking
- [ ] Set up cron job
- [ ] Add jobs counter logic

**Day 5:**

- [ ] Add badges to profile pages
- [ ] Testing and bug fixes
- [ ] Deploy to production

## Week 2: Trust Badges System (Option A) - Foundation

**Days 1-2:**

- [ ] Database schema and migration
- [ ] Seed badge data
- [ ] Badge service logic

**Days 3-4:**

- [ ] API endpoints (all)
- [ ] Admin UI (badge management)

**Day 5:**

- [ ] Fixer UI (badge dashboard)
- [ ] Testing

## Week 3: Trust Badges System (Option A) - Polish

**Days 1-2:**

- [ ] Display components
- [ ] Integration with existing pages
- [ ] Badge notifications

**Days 3-4:**

- [ ] Automated badge awards
- [ ] Cron jobs
- [ ] Testing

**Day 5:**

- [ ] Documentation
- [ ] Deploy to production

## Week 4: Verified Reviews (Option B) - Core

**Days 1-2:**

- [ ] Database schema and migration
- [ ] Photo upload infrastructure
- [ ] Review submission form

**Days 3-4:**

- [ ] 30-day window enforcement
- [ ] Email notifications
- [ ] Review display components

**Day 5:**

- [ ] Fixer response system
- [ ] Testing

## Week 5: Verified Reviews (Option B) - Polish

**Days 1-2:**

- [ ] Helpful & report features
- [ ] Admin moderation
- [ ] Review analytics

**Days 3-4:**

- [ ] Filters and sorting
- [ ] Mobile optimization
- [ ] Performance optimization

**Day 5:**

- [ ] Final testing
- [ ] Documentation
- [ ] Deploy to production

---

# 📋 DAILY STANDUP TEMPLATE

## Today's Focus

- [ ] Task 1
- [ ] Task 2
- [ ] Task 3

## Completed Yesterday

- [x] Task 1
- [x] Task 2

## Blockers

- None / List blockers

## Notes

- Any important observations

---

# ✅ COMPLETION CRITERIA

## Option C: Quick Wins

- [ ] All badges displaying on browse, detail, category, and profile pages
- [ ] Referral page live with working share functionality
- [ ] Response time tracking integrated into quote flow
- [ ] Cron job running daily
- [ ] Jobs counter incrementing on order completion
- [ ] All 30+ features tested and working
- [ ] Documentation complete

## Option A: Trust Badges System

- [ ] All badge tiers defined and seeded
- [ ] Badge eligibility calculations working
- [ ] Admin can approve/reject/revoke badges
- [ ] Fixers can view and request badges
- [ ] Badges displaying on all relevant pages
- [ ] Automated awards working for bronze tier
- [ ] Notifications working
- [ ] Documentation complete

## Option B: Verified Reviews

- [ ] Clients can submit reviews with up to 5 photos
- [ ] 30-day window enforced
- [ ] Fixers receive notifications and can respond
- [ ] Email reminders sent automatically
- [ ] Reviews display with photos and responses
- [ ] Helpful and report features working
- [ ] Admin can moderate reported reviews
- [ ] Analytics tracking review metrics
- [ ] Documentation complete

---

# 🚀 START HERE

**Current Status:** Option C (Quick Wins) is 70% complete.

**Next Immediate Action:**

1. Create referral page (`/app/settings/referral/page.tsx`)
2. Add badges to category pages
3. Integrate response time tracking

**Ready to begin?** Let me know which task you'd like to tackle first!

---

**Last Updated:** October 16, 2025  
**Progress:** 7/30 major features complete (23%)
