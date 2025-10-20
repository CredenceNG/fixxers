import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NeighborhoodData {
  name: string;
  city: string; // LGA
  latitude?: number;
  longitude?: number;
}

const kadunaNeighborhoods: NeighborhoodData[] = [
  // KADUNA NORTH LGA
  { name: 'Ungwan Rimi', city: 'Kaduna North', latitude: 10.5225, longitude: 7.4383 },
  { name: 'Kawo', city: 'Kaduna North', latitude: 10.5833, longitude: 7.4333 },
  { name: 'Ungwan Sanusi', city: 'Kaduna North', latitude: 10.5167, longitude: 7.4333 },
  { name: 'Barnawa', city: 'Kaduna North', latitude: 10.5500, longitude: 7.4500 },
  { name: 'Malali', city: 'Kaduna North', latitude: 10.5667, longitude: 7.4167 },
  { name: 'Doka', city: 'Kaduna North', latitude: 10.5833, longitude: 7.4667 },
  { name: 'Hayin Banki', city: 'Kaduna North', latitude: 10.5500, longitude: 7.4333 },

  // KADUNA SOUTH LGA
  { name: 'Tudun Wada', city: 'Kaduna South', latitude: 10.4833, longitude: 7.4333 },
  { name: 'Kakuri', city: 'Kaduna South', latitude: 10.4667, longitude: 7.4500 },
  { name: 'Sabon Tasha', city: 'Kaduna South', latitude: 10.4500, longitude: 7.4333 },
  { name: 'Makera', city: 'Kaduna South', latitude: 10.4833, longitude: 7.4167 },
  { name: 'Television', city: 'Kaduna South', latitude: 10.4667, longitude: 7.4167 },
  { name: 'Gonin Gora', city: 'Kaduna South', latitude: 10.4333, longitude: 7.4500 },
  { name: 'Narayi', city: 'Kaduna South', latitude: 10.4500, longitude: 7.4667 },

  // CHIKUN LGA
  { name: 'Ungwan Rimi GRA', city: 'Chikun', latitude: 10.5333, longitude: 7.4167 },
  { name: 'Nasarawa', city: 'Chikun', latitude: 10.5500, longitude: 7.3833 },
  { name: 'Ungwan Sarki', city: 'Chikun', latitude: 10.5667, longitude: 7.3667 },
  { name: 'Rigasa', city: 'Chikun', latitude: 10.6167, longitude: 7.4000 },

  // IGABI LGA
  { name: 'Rigachikun', city: 'Igabi', latitude: 10.6333, longitude: 7.4500 },
  { name: 'Turunku', city: 'Igabi', latitude: 10.6500, longitude: 7.4333 },

  // ZARIA LGA
  { name: 'Samaru', city: 'Zaria', latitude: 11.1167, longitude: 7.6833 },
  { name: 'Sabon Gari', city: 'Zaria', latitude: 11.1000, longitude: 7.7000 },
  { name: 'Zaria City', city: 'Zaria', latitude: 11.0833, longitude: 7.7167 },
  { name: 'Tudun Wada', city: 'Zaria', latitude: 11.0667, longitude: 7.7000 },

  // KAFANCHAN (Jema'a LGA)
  { name: 'Kafanchan', city: "Jema'a", latitude: 9.5833, longitude: 8.3000 },
];

export async function seedKadunaLocations() {
  console.log('🌍 Starting Kaduna State location hierarchy seeding...\n');

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

    // Step 2: Create Kaduna State
    console.log('\nStep 2: Creating Kaduna State...');
    let kadunaState = await prisma.state.findFirst({
      where: { name: 'Kaduna', countryId: nigeria.id }
    });
    if (!kadunaState) {
      kadunaState = await prisma.state.create({
        data: {
          name: 'Kaduna',
          code: 'KD',
          countryId: nigeria.id
        }
      });
      console.log('✅ Created Kaduna State\n');
    } else {
      console.log('→ Kaduna State already exists\n');
    }

    // Step 3: Get unique LGAs from neighborhood data
    const uniqueCities = [...new Set(kadunaNeighborhoods.map(n => n.city))];
    console.log(`Step 3: Creating ${uniqueCities.length} LGAs...`);

    const cityMap = new Map<string, string>();
    for (const cityName of uniqueCities) {
      let city = await prisma.city.findFirst({
        where: { name: cityName, stateId: kadunaState.id }
      });

      if (!city) {
        city = await prisma.city.create({
          data: {
            name: cityName,
            stateId: kadunaState.id
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
    console.log(`Step 4: Creating ${kadunaNeighborhoods.length} neighborhoods...`);
    let created = 0;
    let skipped = 0;

    for (const neighborhood of kadunaNeighborhoods) {
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
            legacyState: 'Kaduna',
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
    console.log(`   State: Kaduna`);
    console.log(`   LGAs: ${uniqueCities.length}`);
    console.log(`   Neighborhoods: ${created} created, ${skipped} skipped`);
    console.log('\n✅ Kaduna State location hierarchy seeding completed!\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedKadunaLocations()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
