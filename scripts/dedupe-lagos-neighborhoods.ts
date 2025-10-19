import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Deduplication Script for Lagos Neighborhoods
 * Merges "Lagos State" into "Lagos" and removes duplicates
 */

async function dedupeNeighborhoods() {
  console.log('🔍 Starting Lagos neighborhoods deduplication...\n');

  // Step 1: Get all "Lagos State" neighborhoods
  const lagosStateNeighborhoods = await prisma.neighborhood.findMany({
    where: { state: 'Lagos State' },
  });

  console.log(`Found ${lagosStateNeighborhoods.length} neighborhoods with state = "Lagos State"`);
  lagosStateNeighborhoods.forEach(n => {
    console.log(`  - ${n.name}, ${n.city}`);
  });
  console.log('');

  let deleted = 0;
  let updated = 0;

  for (const neighborhood of lagosStateNeighborhoods) {
    // Check if a neighborhood with the same name exists in "Lagos"
    const duplicate = await prisma.neighborhood.findFirst({
      where: {
        name: neighborhood.name,
        state: 'Lagos',
      },
    });

    if (duplicate) {
      // First, update all references to point to the "Lagos" version
      const serviceRequestsCount = await prisma.serviceRequest.count({
        where: { neighborhoodId: neighborhood.id },
      });

      if (serviceRequestsCount > 0) {
        await prisma.serviceRequest.updateMany({
          where: { neighborhoodId: neighborhood.id },
          data: { neighborhoodId: duplicate.id },
        });
        console.log(`  📝 Migrated ${serviceRequestsCount} service request(s) to Lagos version`);
      }

      // Now delete the "Lagos State" duplicate
      await prisma.neighborhood.delete({
        where: { id: neighborhood.id },
      });
      console.log(`❌ Deleted duplicate: ${neighborhood.name} (Lagos State) - keeping Lagos version in ${duplicate.city}`);
      deleted++;
    } else {
      // Update to "Lagos" state (for unique ones like "Downtown")
      await prisma.neighborhood.update({
        where: { id: neighborhood.id },
        data: { state: 'Lagos' },
      });
      console.log(`✅ Updated: ${neighborhood.name} - changed state from "Lagos State" to "Lagos"`);
      updated++;
    }
  }

  console.log('');
  console.log('📊 Summary:');
  console.log(`  ❌ Deleted duplicates: ${deleted}`);
  console.log(`  ✅ Updated to "Lagos": ${updated}`);
  console.log('');

  // Step 2: Verify final state
  const finalStates = await prisma.neighborhood.groupBy({
    by: ['state'],
    _count: true,
  });

  console.log('✅ Final state distribution:');
  finalStates.forEach(s => {
    console.log(`  ${s.state}: ${s._count} neighborhoods`);
  });

  console.log('');
  console.log('🎉 Deduplication completed successfully!');
}

// Run the deduplication
dedupeNeighborhoods()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
