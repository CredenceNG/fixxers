# 🚀 Quick Wins Implementation Guide

This guide covers 7 quick features that can be implemented immediately to add value to your **Fixxers** platform.

## 📋 Features Included

1. **Referral Codes** - Unique shareable codes for every user (FIX-ABC123)
2. **Available Now Badge** - Shows which fixers accept instant bookings
3. **Years of Service** - Display how long a fixer has been on the platform
4. **Review Count** - Show total reviews with average rating
5. **Service Area Display** - Show which neighborhoods a fixer serves
6. **Response Time Tracking** - Track and display how fast fixers respond
7. **Jobs Completed Counter** - Show total completed jobs

## 🗄️ Database Changes

### New Fields Added:

**User Table:**

- `referralCode` (String, unique) - Unique referral code per user

**FixerProfile Table:**

- `averageResponseMinutes` (Int, nullable) - Average response time in minutes
- `totalJobsCompleted` (Int, default 0) - Total jobs completed

**Quote Table:**

- `responseTimeMinutes` (Int, nullable) - Time taken to respond to request

## 🚀 Installation

### Step 1: Run the Setup Script

```bash
chmod +x scripts/quick-wins-setup.sh
./scripts/quick-wins-setup.sh
```

This will:

1. Apply Prisma migration
2. Generate Prisma client
3. Generate referral codes for all users
4. (Optional) Calculate response times for existing quotes

### Step 2: Manual Migration (Alternative)

If you prefer manual steps:

```bash
# Apply migration
npx prisma migrate dev --name quick_wins_features

# Generate client
npx prisma generate

# Generate referral codes
npx tsx scripts/generate-referral-codes.ts

# (Optional) Calculate response times
npx tsx scripts/calculate-response-times.ts
```

## 📦 Components Usage

Import the badge components in your files:

```tsx
import {
  AvailableNowBadge,
  YearsOfService,
  ReviewCount,
  ServiceArea,
  ResponseTimeBadge,
  JobsCompleted,
  ReferralCodeDisplay,
} from "@/components/quick-wins/QuickWinBadges";
```

### 1. Available Now Badge

Shows if a fixer accepts instant bookings.

```tsx
<AvailableNowBadge
  allowInstantBooking={gig.allowInstantBooking}
  className="ml-2"
/>
```

**Output:** 🟢 Available Now

---

### 2. Years of Service

Displays how long a user has been on the platform.

```tsx
<YearsOfService createdAt={user.createdAt} className="text-sm" />
```

**Output:**

- "New Member - 2024" (for users joined this year)
- "Member since 2022 • 3 years" (for older users)

---

### 3. Review Count

Shows total reviews with average rating.

```tsx
<ReviewCount count={reviewCount} averageRating={4.8} className="mt-2" />
```

**Output:** ⭐ 4.8 (127 reviews)

---

### 4. Service Area Display

Shows which neighborhoods a fixer serves.

```tsx
<ServiceArea
  neighbourhood={fixerProfile.neighbourhood}
  city={fixerProfile.city}
  state={fixerProfile.state}
  className="mt-2"
/>
```

**Output:** 📍 Serves Lekki, Lagos, Lagos State

---

### 5. Response Time Badge

Displays how quickly a fixer typically responds.

```tsx
<ResponseTimeBadge
  averageResponseMinutes={fixerProfile.averageResponseMinutes}
  className="ml-2"
/>
```

**Output (based on time):**

- ⚡ Responds in ~45 min (< 1 hour - green badge)
- ✓ Responds in ~2 hours (< 3 hours - blue badge)
- ⏱️ Responds in ~5 hours (< 12 hours - yellow badge)
- 📋 Responds in ~1 day (> 12 hours - gray badge)

---

### 6. Jobs Completed

Shows total jobs completed by a fixer.

```tsx
<JobsCompleted count={fixerProfile.totalJobsCompleted} className="mt-2" />
```

**Output:** ✓ 127 jobs completed

---

### 7. Referral Code Display

Shows a user's referral code with copy button.

```tsx
<ReferralCodeDisplay code={user.referralCode} className="mt-4" />
```

**Output:**

```
┌──────────────┐
│ FIX-ABC123 📋│ ← Copy button
└──────────────┘
```

## 🎨 Example: Complete Fixer Card

```tsx
import {
  AvailableNowBadge,
  YearsOfService,
  ReviewCount,
  ServiceArea,
  ResponseTimeBadge,
  JobsCompleted,
} from "@/components/quick-wins/QuickWinBadges";

export function FixerCard({ fixer, gig }) {
  const reviewCount = fixer.reviewsReceived?.length || 0;
  const avgRating = calculateAverageRating(fixer.reviewsReceived);

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <img
            src={fixer.profileImage || "/default-avatar.png"}
            alt={fixer.name}
            className="w-12 h-12 rounded-full"
          />
          <div>
            <h3 className="font-semibold text-lg">{fixer.name}</h3>
            <YearsOfService createdAt={fixer.createdAt} />
          </div>
        </div>
        <AvailableNowBadge allowInstantBooking={gig.allowInstantBooking} />
      </div>

      {/* Metrics */}
      <div className="mt-4 space-y-2">
        <ReviewCount count={reviewCount} averageRating={avgRating} />
        <ResponseTimeBadge
          averageResponseMinutes={fixer.fixerProfile.averageResponseMinutes}
        />
        <JobsCompleted count={fixer.fixerProfile.totalJobsCompleted} />
      </div>

      {/* Service Area */}
      <div className="mt-4">
        <ServiceArea
          neighbourhood={fixer.fixerProfile.neighbourhood}
          city={fixer.fixerProfile.city}
          state={fixer.fixerProfile.state}
        />
      </div>

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          {gig.allowInstantBooking ? "Book Now" : "Request Quote"}
        </button>
        <button className="px-4 py-2 border rounded hover:bg-gray-50">
          View Profile
        </button>
      </div>
    </div>
  );
}
```

## 🔧 API Integration

### Track Response Time When Creating Quotes

Use the new API endpoint that automatically tracks response time:

```tsx
// In your quote submission form
const submitQuote = async (quoteData) => {
  const response = await fetch("/api/quotes/create-with-tracking", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestId: request.id,
      totalAmount: 50000,
      laborCost: 30000,
      materialCost: 20000,
      description: "Complete electrical rewiring",
      estimatedDuration: "2-3 days",
      // ... other fields
    }),
  });

  const result = await response.json();

  // Result includes response time info:
  // {
  //   success: true,
  //   quote: { ... },
  //   responseTime: {
  //     minutes: 45,
  //     formatted: "45 minutes"
  //   }
  // }
};
```

### Update Jobs Completed Counter

When an order is completed:

```tsx
// In your order completion handler
await prisma.fixerProfile.update({
  where: { fixerId: order.fixerId },
  data: {
    totalJobsCompleted: {
      increment: 1,
    },
  },
});
```

## 📊 Utilities

### Response Time Utilities

```tsx
import {
  calculateQuoteResponseTime,
  updateFixerAverageResponseTime,
  getResponseTimeCategory,
  formatResponseTime,
  batchUpdateAllFixerResponseTimes,
} from "@/lib/quick-wins/response-time";

// Calculate response time for a quote
const minutes = await calculateQuoteResponseTime(quoteId, requestId);

// Update fixer's average
const avgMinutes = await updateFixerAverageResponseTime(fixerId);

// Get display category
const { label, color, icon } = getResponseTimeCategory(45); // "Lightning Fast"

// Format for display
const formatted = formatResponseTime(125); // "2 hours"

// Batch update (run as cron job daily)
await batchUpdateAllFixerResponseTimes();
```

## 🔄 Maintenance

### Daily Cron Job (Recommended)

Update all fixer response times daily:

```typescript
// In your cron job file
import { batchUpdateAllFixerResponseTimes } from "@/lib/quick-wins/response-time";

// Run daily at 2 AM
cron.schedule("0 2 * * *", async () => {
  console.log("Running daily response time update...");
  await batchUpdateAllFixerResponseTimes();
});
```

Or use Vercel Cron:

```typescript
// app/api/cron/update-response-times/route.ts
import { NextResponse } from "next/server";
import { batchUpdateAllFixerResponseTimes } from "@/lib/quick-wins/response-time";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await batchUpdateAllFixerResponseTimes();
  return NextResponse.json(result);
}
```

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/update-response-times",
      "schedule": "0 2 * * *"
    }
  ]
}
```

## 📱 Example Screens

### Search Results Page

```tsx
export default async function SearchPage({ searchParams }) {
  const fixers = await prisma.user.findMany({
    where: {
      roles: { has: "FIXER" },
      // ... your filters
    },
    include: {
      fixerProfile: true,
      reviewsReceived: true,
      gigs: true,
    },
  });

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {fixers.map((fixer) => (
        <FixerCard key={fixer.id} fixer={fixer} />
      ))}
    </div>
  );
}
```

### User Settings - Referral Page

```tsx
export default async function ReferralPage() {
  const session = await getServerSession();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { referralCode: true, name: true },
  });

  const referralLink = `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${user.referralCode}`;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Refer Friends, Earn Rewards!</h1>

      <p className="text-gray-600 mb-6">
        Share your referral code and earn ₦2,000 when your friend completes
        their first booking.
      </p>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold mb-3">Your Referral Code</h3>
        <ReferralCodeDisplay code={user.referralCode} />

        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">Share Link</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={() => navigator.clipboard.writeText(referralLink)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Copy Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## ✅ Testing Checklist

- [ ] Referral codes generated for all users
- [ ] Referral codes are unique (no duplicates)
- [ ] Available Now badge shows for instant booking gigs
- [ ] Years of service calculates correctly
- [ ] Review count displays accurately
- [ ] Service area shows correct location
- [ ] Response time tracks when quotes are created
- [ ] Jobs completed increments on order completion
- [ ] Response time badge shows correct colors/icons
- [ ] Referral code copy button works
- [ ] All badges responsive on mobile

## 🎯 Next Steps

After implementing these quick wins, you're ready for:

1. **Tier 1 Features** - Trust Badges & Verification System
2. **Tier 1 Features** - Instant Booking Calendar
3. **Tier 2 Features** - Advanced Search & Filtering

See the main prioritization document for the full roadmap.

## 🐛 Troubleshooting

### Referral codes not unique

Run the generation script again - it will only update users without codes.

### Response times not calculating

Check that the Quote model has the `responseTimeMinutes` field after migration.

### TypeScript errors

Run `npx prisma generate` to regenerate the Prisma client.

### Badges not showing

Ensure you're importing from the correct path: `@/components/quick-wins/QuickWinBadges`

## 📚 Resources

- [Prisma Documentation](https://www.prisma.io/docs/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Tailwind CSS](https://tailwindcss.com/docs)

---

**Happy coding! 🚀** If you have questions, check the main implementation plan or open an issue.
