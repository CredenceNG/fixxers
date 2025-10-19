import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Update FixerProfile records from "Lagos State" to "Lagos"
 * This is needed after merging neighborhoods from "Lagos State" to "Lagos"
 */

async function updateFixerProfiles() {
  console.log('🔄 Starting FixerProfile state update...\n');

  // Find all fixer profiles with state = "Lagos State"
  const profilesWithLagosState = await prisma.fixerProfile.findMany({
    where: { state: 'Lagos State' },
    select: {
      id: true,
      neighbourhood: true,
      city: true,
      state: true,
    },
  });

  console.log(`Found ${profilesWithLagosState.length} fixer profiles with state = "Lagos State"`);

  if (profilesWithLagosState.length === 0) {
    console.log('✅ No profiles to update!');
    return;
  }

  profilesWithLagosState.forEach((profile) => {
    console.log(`  - ${profile.neighbourhood}, ${profile.city}, ${profile.state}`);
  });
  console.log('');

  // Update all profiles to use "Lagos"
  const updateResult = await prisma.fixerProfile.updateMany({
    where: { state: 'Lagos State' },
    data: { state: 'Lagos' },
  });

  console.log(`✅ Updated ${updateResult.count} fixer profile(s) from "Lagos State" to "Lagos"`);
  console.log('');

  // Verify the update
  const remainingLagosState = await prisma.fixerProfile.count({
    where: { state: 'Lagos State' },
  });

  const lagosCount = await prisma.fixerProfile.count({
    where: { state: 'Lagos' },
  });

  console.log('📊 Final state distribution:');
  console.log(`  Lagos: ${lagosCount} profiles`);
  console.log(`  Lagos State: ${remainingLagosState} profiles`);
  console.log('');

  if (remainingLagosState === 0) {
    console.log('🎉 All FixerProfile records successfully updated!');
  } else {
    console.warn(`⚠️  Still have ${remainingLagosState} profiles with "Lagos State"`);
  }
}

// Run the update
updateFixerProfiles()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
