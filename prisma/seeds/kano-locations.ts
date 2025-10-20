import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NeighborhoodData {
  name: string;
  city: string; // LGA
  latitude?: number;
  longitude?: number;
}

const kanoNeighborhoods: NeighborhoodData[] = [
  // KANO MUNICIPAL LGA
  { name: 'Sabon Gari', city: 'Kano Municipal', latitude: 12.0022, longitude: 8.5919 },
  { name: 'Fagge', city: 'Kano Municipal', latitude: 12.0167, longitude: 8.5167 },
  { name: 'Kofar Wambai', city: 'Kano Municipal', latitude: 12.0000, longitude: 8.5167 },
  { name: 'Kofar Mazugal', city: 'Kano Municipal', latitude: 11.9833, longitude: 8.5333 },
  { name: 'Kwari', city: 'Kano Municipal', latitude: 11.9833, longitude: 8.5167 },
  { name: 'Kurmi Market', city: 'Kano Municipal', latitude: 12.0000, longitude: 8.5167 },

  // NASSARAWA LGA
  { name: 'Nassarawa GRA', city: 'Nassarawa', latitude: 12.0500, longitude: 8.5500 },
  { name: 'Bompai', city: 'Nassarawa', latitude: 12.0333, longitude: 8.5667 },
  { name: 'Zoo Road', city: 'Nassarawa', latitude: 12.0167, longitude: 8.5833 },
  { name: 'Hotoro', city: 'Nassarawa', latitude: 12.0667, longitude: 8.5333 },

  // GWALE LGA
  { name: 'Gwale', city: 'Gwale', latitude: 11.9833, longitude: 8.5000 },
  { name: 'Gyadi-Gyadi', city: 'Gwale', latitude: 11.9667, longitude: 8.4833 },

  // DALA LGA
  { name: 'Dala', city: 'Dala', latitude: 11.9667, longitude: 8.5333 },
  { name: 'Yan Kaba', city: 'Dala', latitude: 11.9500, longitude: 8.5167 },

  // TARAUNI LGA
  { name: 'Tarauni', city: 'Tarauni', latitude: 12.0333, longitude: 8.4833 },
  { name: 'Dakata', city: 'Tarauni', latitude: 12.0500, longitude: 8.4667 },
  { name: 'Yan Awaki', city: 'Tarauni', latitude: 12.0167, longitude: 8.4667 },

  // UNGOGO LGA
  { name: 'Ungogo', city: 'Ungogo', latitude: 12.0833, longitude: 8.4833 },
  { name: 'Rijiyar Lemo', city: 'Ungogo', latitude: 12.0667, longitude: 8.5000 },
  { name: 'Gabasawa', city: 'Ungogo', latitude: 12.1000, longitude: 8.4667 },

  // KUMBOTSO LGA
  { name: 'Kumbotso', city: 'Kumbotso', latitude: 11.9333, longitude: 8.5333 },
  { name: 'Challawa', city: 'Kumbotso', latitude: 11.9167, longitude: 8.5500 },

  // BUK (Bayero University Area)
  { name: 'BUK New Site', city: 'Nassarawa', latitude: 12.0000, longitude: 8.5333 },
  { name: 'BUK Old Site', city: 'Kano Municipal', latitude: 12.0022, longitude: 8.5500 },
];

export async function seedKanoLocations() {
  console.log('🌍 Starting Kano State location hierarchy seeding...\n');

  try {
    // Step 1: Get Nigeria
    console.log('Step 1: Getting Nigeria...');
    let nigeria = await prisma.country.findUnique({ where: { code: 'NG' } });
    if (!nigeria) {
      nigeria = await prisma.country.create({
        data: { name: 'Nigeria', code: 'NG' }
      });
      console.log('✅ Created Nigeria');
    } else {
      console.log('→ Nigeria already exists');
    }

    // Step 2: Create Kano State
    console.log('\nStep 2: Creating Kano State...');
    let kanoState = await prisma.state.findFirst({
      where: { name: 'Kano', countryId: nigeria.id }
    });
    if (!kanoState) {
      kanoState = await prisma.state.create({
        data: {
          name: 'Kano',
          code: 'KN',
          countryId: nigeria.id
        }
      });
      console.log('✅ Created Kano State\n');
    } else {
      console.log('→ Kano State already exists\n');
    }

    // Step 3: Get unique LGAs from neighborhood data
    const uniqueCities = [...new Set(kanoNeighborhoods.map(n => n.city))];
    console.log(`Step 3: Creating ${uniqueCities.length} LGAs...`);

    const cityMap = new Map<string, string>();
    for (const cityName of uniqueCities) {
      let city = await prisma.city.findFirst({
        where: { name: cityName, stateId: kanoState.id }
      });

      if (!city) {
        city = await prisma.city.create({
          data: {
            name: cityName,
            stateId: kanoState.id
          }
        });
        console.log(`  ✓ Created LGA: ${cityName}`);
      } else {
        console.log(`  → LGA already exists: ${cityName}`);
      }

      cityMap.set(cityName, city.id);
    }
    console.log(`✅ Created/found ${uniqueCities.length} LGAs\n`);

    // Step 4: Create neighborhoods
    console.log(`Step 4: Creating ${kanoNeighborhoods.length} neighborhoods...`);
    let created = 0;
    let skipped = 0;

    for (const neighborhood of kanoNeighborhoods) {
      const cityId = cityMap.get(neighborhood.city);
      if (!cityId) {
        console.log(`  ⚠️  Skipping ${neighborhood.name} - LGA ${neighborhood.city} not found`);
        skipped++;
        continue;
      }

      const existing = await prisma.neighborhood.findFirst({
        where: { name: neighborhood.name, cityId }
      });

      if (!existing) {
        await prisma.neighborhood.create({
          data: {
            name: neighborhood.name,
            cityId,
            legacyCity: neighborhood.city,
            legacyState: 'Kano',
            legacyCountry: 'Nigeria',
            latitude: neighborhood.latitude,
            longitude: neighborhood.longitude
          }
        });
        created++;
      } else {
        skipped++;
      }
    }

    console.log(`✅ Created ${created} neighborhoods (${skipped} already existed)\n`);

    console.log('✨ Summary:');
    console.log(`   Country: Nigeria (NG)`);
    console.log(`   State: Kano`);
    console.log(`   LGAs: ${uniqueCities.length}`);
    console.log(`   Neighborhoods: ${created} created, ${skipped} skipped`);
    console.log('\n✅ Kano State location hierarchy seeding completed!\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedKanoLocations()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
