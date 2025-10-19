import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function seedBadges() {
  console.log("🏅 Seeding badges...");

  const badges = [
    {
      type: "IDENTITY_VERIFICATION" as const,
      name: "Identity Verified",
      description:
        "Fixer has verified their identity with government-issued ID, selfie verification, and address proof.",
      icon: "🆔",
      cost: 200000, // ₦2,000 in kobo
      requiredDocuments: ["government_id", "selfie_with_id", "address_proof"],
      expiryMonths: 12, // Renew annually
      isAutomatic: false,
      minJobsRequired: null,
      minAverageRating: null,
      maxCancellationRate: null,
      maxComplaintRate: null,
      maxResponseMinutes: null,
      isActive: true,
    },
    {
      type: "INSURANCE_VERIFICATION" as const,
      name: "Insurance Verified",
      description:
        "Fixer has valid liability insurance coverage. This protects both the fixer and clients in case of accidents or damages.",
      icon: "🛡️",
      cost: 300000, // ₦3,000 in kobo
      requiredDocuments: ["insurance_certificate", "policy_document"],
      expiryMonths: 12, // Match typical insurance policy duration
      isAutomatic: false,
      minJobsRequired: null,
      minAverageRating: null,
      maxCancellationRate: null,
      maxComplaintRate: null,
      maxResponseMinutes: null,
      isActive: true,
    },
    {
      type: "BACKGROUND_CHECK" as const,
      name: "Background Verified",
      description:
        "Fixer has passed a comprehensive background check including police clearance and character references.",
      icon: "✅",
      cost: 500000, // ₦5,000 in kobo
      requiredDocuments: [
        "police_clearance",
        "character_reference_1",
        "character_reference_2",
        "employment_history",
      ],
      expiryMonths: 12, // Renew annually
      isAutomatic: false,
      minJobsRequired: null,
      minAverageRating: null,
      maxCancellationRate: null,
      maxComplaintRate: null,
      maxResponseMinutes: null,
      isActive: true,
    },
    {
      type: "SKILL_CERTIFICATION" as const,
      name: "Certified Professional",
      description:
        "Fixer has verified professional certifications, training certificates, or trade licenses.",
      icon: "📜",
      cost: 250000, // ₦2,500 in kobo
      requiredDocuments: [
        "trade_certification",
        "training_certificate",
        "professional_license",
      ],
      expiryMonths: 24, // 2 years or match certificate expiry
      isAutomatic: false,
      minJobsRequired: null,
      minAverageRating: null,
      maxCancellationRate: null,
      maxComplaintRate: null,
      maxResponseMinutes: null,
      isActive: true,
    },
    {
      type: "QUALITY_PERFORMANCE" as const,
      name: "Top Performer",
      description:
        "Automatically earned by maintaining exceptional performance metrics on the platform. Requires 20+ jobs, 4.5+ star rating, low cancellation rate, and fast response times.",
      icon: "⭐",
      cost: 0, // FREE - earned, not purchased
      requiredDocuments: [],
      expiryMonths: 3, // Re-evaluated quarterly
      isAutomatic: true,
      minJobsRequired: 20,
      minAverageRating: 4.5,
      maxCancellationRate: 0.05, // 5%
      maxComplaintRate: 0.02, // 2%
      maxResponseMinutes: 120, // 2 hours
      isActive: true,
    },
  ];

  // Check if badge type exists first, then create if not
  for (const badgeData of badges) {
    const existing = await prisma.badge.findFirst({
      where: { type: badgeData.type },
    });

    if (!existing) {
      const badge = await prisma.badge.create({
        data: badgeData,
      });
      console.log(`✓ Created badge: ${badge.name} (${badge.icon})`);
    } else {
      console.log(`⊘ Badge already exists: ${existing.name}`);
    }
  }

  console.log("✅ Badge seeding complete!");
}

// Run if called directly
if (require.main === module) {
  seedBadges()
    .catch((e) => {
      console.error("❌ Error seeding badges:", e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
