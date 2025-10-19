#!/bin/bash

# Quick Wins Implementation Script
# Run this to apply all quick win features

echo "🚀 Quick Wins Implementation Script"
echo "===================================="
echo ""

# Step 1: Run Prisma Migration
echo "📦 Step 1: Applying Prisma migration..."
npx prisma migrate dev --name quick_wins_features
if [ $? -ne 0 ]; then
    echo "❌ Migration failed. Please check your database connection."
    exit 1
fi
echo "✅ Migration completed!"
echo ""

# Step 2: Generate Prisma Client
echo "🔄 Step 2: Generating Prisma client..."
npx prisma generate
if [ $? -ne 0 ]; then
    echo "❌ Prisma generate failed."
    exit 1
fi
echo "✅ Prisma client generated!"
echo ""

# Step 3: Generate Referral Codes
echo "🎁 Step 3: Generating referral codes for all users..."
npx tsx scripts/generate-referral-codes.ts
if [ $? -ne 0 ]; then
    echo "⚠️  Referral code generation had issues. Check logs above."
else
    echo "✅ Referral codes generated!"
fi
echo ""

# Step 4: Calculate Response Times (optional, can be skipped if no quotes exist)
echo "⏱️  Step 4: Calculating response times (optional)..."
read -p "Do you want to calculate response times for existing quotes? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npx tsx scripts/calculate-response-times.ts
    echo "✅ Response times calculated!"
else
    echo "⏭️  Skipped response time calculation."
fi
echo ""

echo "🎉 Quick Wins Implementation Complete!"
echo "======================================"
echo ""
echo "✅ What was added:"
echo "  1. Referral codes for all users (FIX-XXX123 format)"
echo "  2. Response time tracking for quotes"
echo "  3. Average response time calculation for fixers"
echo "  4. Jobs completed counter for fixers"
echo ""
echo "📝 Next Steps:"
echo "  1. Import badges from components/quick-wins/QuickWinBadges.tsx"
echo "  2. Add badges to your fixer cards/profiles:"
echo "     - <AvailableNowBadge />"
echo "     - <YearsOfService createdAt={user.createdAt} />"
echo "     - <ReviewCount count={reviewCount} />"
echo "     - <ServiceArea neighbourhood={...} city={...} />"
echo "     - <ResponseTimeBadge averageResponseMinutes={...} />"
echo "     - <JobsCompleted count={totalJobsCompleted} />"
echo ""
echo "  3. Display referral codes in user settings:"
echo "     - <ReferralCodeDisplay code={user.referralCode} />"
echo ""
echo "  4. Use the new API endpoint for quote creation:"
echo "     - POST /api/quotes/create-with-tracking"
echo ""
echo "Happy coding! 🚀"
