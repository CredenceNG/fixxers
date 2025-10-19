import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface NeighborhoodData {
  name: string;
  city: string; // Area Council in FCT
  latitude?: number;
  longitude?: number;
}

const fctNeighborhoods: NeighborhoodData[] = [
  // ABUJA MUNICIPAL AREA COUNCIL (AMAC)
  { name: 'Maitama', city: 'AMAC', latitude: 9.0820, longitude: 7.4951 },
  { name: 'Asokoro', city: 'AMAC', latitude: 9.0385, longitude: 7.5340 },
  { name: 'Garki', city: 'AMAC', latitude: 9.0394, longitude: 7.4913 },
  { name: 'Wuse', city: 'AMAC', latitude: 9.0643, longitude: 7.4820 },
  { name: 'Wuse 2', city: 'AMAC', latitude: 9.0765, longitude: 7.4820 },
  { name: 'Jabi', city: 'AMAC', latitude: 9.0765, longitude: 7.4570 },
  { name: 'Utako', city: 'AMAC', latitude: 9.0765, longitude: 7.4400 },
  { name: 'Gwarinpa', city: 'AMAC', latitude: 9.1176, longitude: 7.4114 },
  { name: 'Kado', city: 'AMAC', latitude: 9.0853, longitude: 7.4386 },
  { name: 'Life Camp', city: 'AMAC', latitude: 9.0765, longitude: 7.4165 },
  { name: 'Jikwoyi', city: 'AMAC', latitude: 9.0294, longitude: 7.6167 },
  { name: 'Karu', city: 'AMAC', latitude: 9.0088, longitude: 7.6309 },
  { name: 'Nyanya', city: 'AMAC', latitude: 8.9931, longitude: 7.5870 },
  { name: 'Mararaba', city: 'AMAC', latitude: 8.9864, longitude: 7.6424 },
  { name: 'Kubwa', city: 'AMAC', latitude: 9.1317, longitude: 7.3444 },
  { name: 'Lokogoma', city: 'AMAC', latitude: 8.9833, longitude: 7.5000 },
  { name: 'Apo', city: 'AMAC', latitude: 9.0030, longitude: 7.5091 },
  { name: 'Lugbe', city: 'AMAC', latitude: 8.9667, longitude: 7.3667 },
  { name: 'Durumi', city: 'AMAC', latitude: 9.0447, longitude: 7.4726 },
  { name: 'Central Business District', city: 'AMAC', latitude: 9.0643, longitude: 7.4892 },
  { name: 'Gudu', city: 'AMAC', latitude: 9.0167, longitude: 7.4500 },

  // GWAGWALADA AREA COUNCIL
  { name: 'Gwagwalada', city: 'Gwagwalada', latitude: 8.9428, longitude: 7.0833 },
  { name: 'Zuba', city: 'Gwagwalada', latitude: 9.1167, longitude: 7.1333 },
  { name: 'Tungan Maje', city: 'Gwagwalada', latitude: 8.9833, longitude: 7.1167 },

  // BWARI AREA COUNCIL
  { name: 'Bwari', city: 'Bwari', latitude: 9.2833, longitude: 7.3833 },
  { name: 'Dutse', city: 'Bwari', latitude: 9.0878, longitude: 7.3942 },
  { name: 'Ushafa', city: 'Bwari', latitude: 9.2167, longitude: 7.2833 },
  { name: 'Kubwa', city: 'Bwari', latitude: 9.1317, longitude: 7.3444 },

  // KUJE AREA COUNCIL
  { name: 'Kuje', city: 'Kuje', latitude: 8.8833, longitude: 7.2333 },

  // ABAJI AREA COUNCIL
  { name: 'Abaji', city: 'Abaji', latitude: 8.6500, longitude: 7.0167 },

  // KWALI AREA COUNCIL
  { name: 'Kwali', city: 'Kwali', latitude: 8.8833, longitude: 7.0167 },
  { name: 'Kilankwa', city: 'Kwali', latitude: 8.8167, longitude: 7.0500 },

  // Popular residential areas
  { name: 'Dawaki', city: 'AMAC', latitude: 9.1062, longitude: 7.3827 },
  { name: 'Galadimawa', city: 'AMAC', latitude: 9.0667, longitude: 7.4167 },
  { name: 'Mpape', city: 'AMAC', latitude: 9.1167, longitude: 7.4333 },
  { name: 'Katampe', city: 'AMAC', latitude: 9.0833, longitude: 7.4667 },
];

export async function seedFCTLocations() {
  console.log('🌍 Starting FCT location hierarchy seeding...\n');

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

    // Step 2: Create FCT
    console.log('\nStep 2: Creating FCT...');
    let fctState = await prisma.state.findFirst({
      where: { name: 'FCT', countryId: nigeria.id }
    });
    if (!fctState) {
      fctState = await prisma.state.create({
        data: {
          name: 'FCT',
          code: 'FC',
          countryId: nigeria.id
        }
      });
      console.log('✅ Created FCT\n');
    } else {
      console.log('→ FCT already exists\n');
    }

    // Step 3: Get unique area councils from neighborhood data
    const uniqueCities = [...new Set(fctNeighborhoods.map(n => n.city))];
    console.log(`Step 3: Creating ${uniqueCities.length} area councils...`);

    const cityMap = new Map<string, string>();
    for (const cityName of uniqueCities) {
      let city = await prisma.city.findFirst({
        where: { name: cityName, stateId: fctState.id }
      });

      if (!city) {
        city = await prisma.city.create({
          data: {
            name: cityName,
            stateId: fctState.id
          }
        });
        console.log(`  ✓ Created area council: ${cityName}`);
      } else {
        console.log(`  → Area council already exists: ${cityName}`);
      }

      cityMap.set(cityName, city.id);
    }
    console.log(`✅ Created/found ${uniqueCities.length} area councils\n`);

    // Step 4: Create neighborhoods
    console.log(`Step 4: Creating ${fctNeighborhoods.length} neighborhoods...`);
    let created = 0;
    let skipped = 0;

    for (const neighborhood of fctNeighborhoods) {
      const cityId = cityMap.get(neighborhood.city);
      if (!cityId) {
        console.log(`  ⚠️  Skipping ${neighborhood.name} - area council ${neighborhood.city} not found`);
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
            legacyState: 'FCT',
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
    console.log(`   State: FCT (Federal Capital Territory)`);
    console.log(`   Area Councils: ${uniqueCities.length}`);
    console.log(`   Neighborhoods: ${created} created, ${skipped} skipped`);
    console.log('\n✅ FCT location hierarchy seeding completed!\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedFCTLocations()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
