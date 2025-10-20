import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NeighborhoodData {
  name: string;
  city: string; // LGA
  latitude?: number;
  longitude?: number;
}

const riversNeighborhoods: NeighborhoodData[] = [
  // PORT HARCOURT LGA
  { name: 'Old GRA', city: 'Port Harcourt', latitude: 4.8156, longitude: 7.0498 },
  { name: 'New GRA', city: 'Port Harcourt', latitude: 4.8300, longitude: 7.0400 },
  { name: 'Town', city: 'Port Harcourt', latitude: 4.7833, longitude: 7.0167 },
  { name: 'Diobu', city: 'Port Harcourt', latitude: 4.7833, longitude: 7.0333 },
  { name: 'Mile 1', city: 'Port Harcourt', latitude: 4.7900, longitude: 7.0167 },
  { name: 'Mile 2', city: 'Port Harcourt', latitude: 4.7967, longitude: 7.0200 },
  { name: 'Mile 3', city: 'Port Harcourt', latitude: 4.8033, longitude: 7.0233 },
  { name: 'Rumuola', city: 'Port Harcourt', latitude: 4.8333, longitude: 7.0167 },
  { name: 'Rumuokoro', city: 'Port Harcourt', latitude: 4.8500, longitude: 7.0333 },
  { name: 'Eliozu', city: 'Port Harcourt', latitude: 4.8667, longitude: 7.0500 },

  // OBIO/AKPOR LGA
  { name: 'Rumueme', city: 'Obio/Akpor', latitude: 4.8333, longitude: 7.0000 },
  { name: 'Rumuobiakani', city: 'Obio/Akpor', latitude: 4.8167, longitude: 6.9833 },
  { name: 'Rumuigbo', city: 'Obio/Akpor', latitude: 4.8500, longitude: 6.9833 },
  { name: 'Rumukrushi', city: 'Obio/Akpor', latitude: 4.8667, longitude: 7.0167 },
  { name: 'Rumuokwurushi', city: 'Obio/Akpor', latitude: 4.8833, longitude: 7.0333 },
  { name: 'Rumuodara', city: 'Obio/Akpor', latitude: 4.8500, longitude: 7.0000 },
  { name: 'Elelenwo', city: 'Obio/Akpor', latitude: 4.8833, longitude: 7.0667 },
  { name: 'Eleme Junction', city: 'Obio/Akpor', latitude: 4.8667, longitude: 7.0833 },
  { name: 'Choba', city: 'Obio/Akpor', latitude: 4.9000, longitude: 6.9167 },
  { name: 'Alakahia', city: 'Obio/Akpor', latitude: 4.9000, longitude: 6.9000 },

  // ELEME LGA
  { name: 'Eleme', city: 'Eleme', latitude: 4.7667, longitude: 7.1333 },
  { name: 'Aleto', city: 'Eleme', latitude: 4.7833, longitude: 7.1500 },
  { name: 'Akpajo', city: 'Eleme', latitude: 4.7500, longitude: 7.1167 },

  // IKWERRE LGA
  { name: 'Isiokpo', city: 'Ikwerre', latitude: 5.0667, longitude: 6.8833 },

  // OYIGBO LGA
  { name: 'Oyigbo', city: 'Oyigbo', latitude: 4.8833, longitude: 7.1167 },

  // BONNY LGA
  { name: 'Bonny', city: 'Bonny', latitude: 4.4333, longitude: 7.1667 },

  // OPOBO/NKORO LGA
  { name: 'Opobo', city: 'Opobo/Nkoro', latitude: 4.5167, longitude: 7.5500 },

  // OKRIKA LGA
  { name: 'Okrika', city: 'Okrika', latitude: 4.7500, longitude: 7.0833 },

  // DEGEMA LGA
  { name: 'Degema', city: 'Degema', latitude: 4.7500, longitude: 6.7667 },

  // GOKANA LGA
  { name: 'Kpor', city: 'Gokana', latitude: 4.6667, longitude: 7.3667 },

  // Popular Areas
  { name: 'Trans Amadi', city: 'Port Harcourt', latitude: 4.8000, longitude: 7.0500 },
  { name: 'Borikiri', city: 'Port Harcourt', latitude: 4.7667, longitude: 7.0167 },
  { name: 'Woji', city: 'Obio/Akpor', latitude: 4.8167, longitude: 7.0667 },
  { name: 'Peter Odili Road', city: 'Port Harcourt', latitude: 4.8333, longitude: 6.9833 },
  { name: 'East West Road', city: 'Obio/Akpor', latitude: 4.8833, longitude: 7.0000 },
];

export async function seedRiversLocations() {
  console.log('🌍 Starting Rivers State location hierarchy seeding...\n');

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

    // Step 2: Create Rivers State
    console.log('\nStep 2: Creating Rivers State...');
    let riversState = await prisma.state.findFirst({
      where: { name: 'Rivers', countryId: nigeria.id }
    });
    if (!riversState) {
      riversState = await prisma.state.create({
        data: {
          name: 'Rivers',
          code: 'RI',
          countryId: nigeria.id
        }
      });
      console.log('✅ Created Rivers State\n');
    } else {
      console.log('→ Rivers State already exists\n');
    }

    // Step 3: Get unique LGAs from neighborhood data
    const uniqueCities = [...new Set(riversNeighborhoods.map(n => n.city))];
    console.log(`Step 3: Creating ${uniqueCities.length} LGAs...`);

    const cityMap = new Map<string, string>();
    for (const cityName of uniqueCities) {
      let city = await prisma.city.findFirst({
        where: { name: cityName, stateId: riversState.id }
      });

      if (!city) {
        city = await prisma.city.create({
          data: {
            name: cityName,
            stateId: riversState.id
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
    console.log(`Step 4: Creating ${riversNeighborhoods.length} neighborhoods...`);
    let created = 0;
    let skipped = 0;

    for (const neighborhood of riversNeighborhoods) {
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
            legacyState: 'Rivers',
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
    console.log(`   State: Rivers`);
    console.log(`   LGAs: ${uniqueCities.length}`);
    console.log(`   Neighborhoods: ${created} created, ${skipped} skipped`);
    console.log('\n✅ Rivers State location hierarchy seeding completed!\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedRiversLocations()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
