/**
 * Quick Win: Generate Referral Codes for All Users
 *
 * This script generates unique referral codes for all existing users
 * who don't already have one.
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function generateReferralCode(): string {
  // Generate a readable 8-character code (e.g., FIX-ABC123)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars
  const numbers = "0123456789";

  let code = "FIX-";

  // 3 letters
  for (let i = 0; i < 3; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }

  // 3 numbers
  for (let i = 0; i < 3; i++) {
    code += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }

  return code;
}

async function generateReferralCodes() {
  console.log("🚀 Starting referral code generation...\n");

  try {
    // Get all users without referral codes
    const users = await prisma.user.findMany({
      where: {
        referralCode: null,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    console.log(`📊 Found ${users.length} users without referral codes\n`);

    if (users.length === 0) {
      console.log("✅ All users already have referral codes!");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        let code = generateReferralCode();
        let isUnique = false;
        let attempts = 0;

        // Ensure uniqueness (max 10 attempts)
        while (!isUnique && attempts < 10) {
          const existing = await prisma.user.findUnique({
            where: { referralCode: code },
          });

          if (!existing) {
            isUnique = true;
          } else {
            code = generateReferralCode();
            attempts++;
          }
        }

        if (!isUnique) {
          console.log(
            `❌ Failed to generate unique code for ${user.email} after 10 attempts`
          );
          errorCount++;
          continue;
        }

        // Update user with referral code
        await prisma.user.update({
          where: { id: user.id },
          data: { referralCode: code },
        });

        console.log(`✅ ${user.name || user.email}: ${code}`);
        successCount++;
      } catch (error) {
        console.error(`❌ Error updating ${user.email}:`, error);
        errorCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ Successfully generated ${successCount} referral codes`);
    if (errorCount > 0) {
      console.log(`❌ Failed to generate ${errorCount} referral codes`);
    }
    console.log("=".repeat(50));
  } catch (error) {
    console.error("❌ Fatal error:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
generateReferralCodes()
  .then(() => {
    console.log("\n🎉 Script completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Script failed:", error);
    process.exit(1);
  });
