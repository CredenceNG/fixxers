import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function reseedLocations() {
  console.log('🗑️  Dropping all location data...\n');

  try {
    // Delete in correct order (respecting foreign key constraints)
    console.log('Deleting neighborhoods...');
    await prisma.neighborhood.deleteMany({});

    console.log('Deleting cities...');
    await prisma.city.deleteMany({});

    console.log('Deleting states...');
    await prisma.state.deleteMany({});

    console.log('Deleting countries...');
    await prisma.country.deleteMany({});

    console.log('✅ All location data deleted\n');

    // Now run the normalized locations seed
    console.log('🌱 Seeding normalized location data...\n');

    // Import and run the seed
    const { seedNormalizedLagosLocations } = await import('../prisma/seeds/normalized-lagos-locations');
    await seedNormalizedLagosLocations();

    console.log('\n✅ Location data reseeded successfully!');

    // Verify
    const counts = {
      countries: await prisma.country.count(),
      states: await prisma.state.count(),
      cities: await prisma.city.count(),
      neighborhoods: await prisma.neighborhood.count(),
    };

    console.log('\n📊 Final counts:');
    console.log(`  Countries: ${counts.countries}`);
    console.log(`  States: ${counts.states}`);
    console.log(`  Cities (LGAs): ${counts.cities}`);
    console.log(`  Neighborhoods: ${counts.neighborhoods}`);

  } catch (error) {
    console.error('❌ Reseed failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

reseedLocations();
