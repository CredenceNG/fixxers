import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function linkProfilesToNeighborhoods() {
  console.log('🔗 Starting profile to neighborhood linking...\n');

  try {
    // Step 1: Link FixerProfiles
    console.log('Step 1: Linking fixer profiles to neighborhoods...');
    const fixerProfiles = await prisma.fixerProfile.findMany({
      where: { neighborhoodId: null },
      select: {
        id: true,
        fixerId: true,
        neighbourhood: true,
        city: true,
        state: true,
        country: true
      }
    });

    console.log(`Found ${fixerProfiles.length} fixer profiles to link\n`);

    let fixerLinked = 0;
    let fixerFailed = 0;

    for (const profile of fixerProfiles) {
      if (!profile.neighbourhood || !profile.state) {
        console.log(`  ⚠️  Skipping fixer ${profile.id} - missing neighbourhood or state`);
        fixerFailed++;
        continue;
      }

      // Try to find neighborhood by name and legacy state
      // Handle "Lagos State" vs "Lagos" inconsistency
      const stateName = profile.state === 'Lagos State' ? 'Lagos' : profile.state;
      const neighborhood = await prisma.neighborhood.findFirst({
        where: {
          name: profile.neighbourhood,
          legacyState: stateName,
        },
        include: {
          city: {
            include: {
              state: true
            }
          }
        }
      });

      if (neighborhood) {
        await prisma.fixerProfile.update({
          where: { id: profile.id },
          data: { neighborhoodId: neighborhood.id }
        });
        fixerLinked++;
        console.log(`  ✓ Linked fixer to ${profile.neighbourhood} (${neighborhood.city?.name || 'unknown city'})`);
      } else {
        console.log(`  ⚠️  Could not find neighborhood: ${profile.neighbourhood}, ${profile.state}`);
        fixerFailed++;
      }
    }

    console.log(`\n✅ Linked ${fixerLinked} fixer profiles, ${fixerFailed} failed\n`);

    // Step 2: Link ClientProfiles
    console.log('Step 2: Linking client profiles to neighborhoods...');
    const clientProfiles = await prisma.clientProfile.findMany({
      where: { neighborhoodId: null },
      select: {
        id: true,
        clientId: true,
        neighbourhood: true,
        city: true,
        state: true,
        country: true
      }
    });

    console.log(`Found ${clientProfiles.length} client profiles to link\n`);

    let clientLinked = 0;
    let clientFailed = 0;

    for (const profile of clientProfiles) {
      if (!profile.neighbourhood || !profile.state) {
        console.log(`  ⚠️  Skipping client ${profile.id} - missing neighbourhood or state`);
        clientFailed++;
        continue;
      }

      // Try to find neighborhood by name and legacy state
      // Handle "Lagos State" vs "Lagos" inconsistency
      const stateName = profile.state === 'Lagos State' ? 'Lagos' : profile.state;
      const neighborhood = await prisma.neighborhood.findFirst({
        where: {
          name: profile.neighbourhood,
          legacyState: stateName,
        },
        include: {
          city: {
            include: {
              state: true
            }
          }
        }
      });

      if (neighborhood) {
        await prisma.clientProfile.update({
          where: { id: profile.id },
          data: { neighborhoodId: neighborhood.id }
        });
        clientLinked++;
        console.log(`  ✓ Linked client to ${profile.neighbourhood} (${neighborhood.city?.name || 'unknown city'})`);
      } else {
        console.log(`  ⚠️  Could not find neighborhood: ${profile.neighbourhood}, ${profile.state}`);
        clientFailed++;
      }
    }

    console.log(`\n✅ Linked ${clientLinked} client profiles, ${clientFailed} failed\n`);

    // Summary
    console.log('✨ Summary:');
    console.log(`   Fixer profiles linked: ${fixerLinked}/${fixerProfiles.length}`);
    console.log(`   Client profiles linked: ${clientLinked}/${clientProfiles.length}`);
    console.log(`   Total linked: ${fixerLinked + clientLinked}`);
    console.log(`   Total failed: ${fixerFailed + clientFailed}`);
    console.log('\n✅ Profile linking completed!\n');

  } catch (error) {
    console.error('\n❌ Linking failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

linkProfilesToNeighborhoods()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
