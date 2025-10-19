import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed script for normalized location hierarchy
 * Creates: Country → State → City → Neighborhood
 */

interface NeighborhoodData {
  name: string;
  city: string; // LGA
  latitude?: number;
  longitude?: number;
}

const lagosNeighborhoods: NeighborhoodData[] = [
  // ALIMOSHO LGA
  { name: 'Ikotun', city: 'Alimosho', latitude: 6.5487, longitude: 3.2620 },
  { name: 'Egbeda', city: 'Alimosho', latitude: 6.5692, longitude: 3.2889 },
  { name: 'Idimu', city: 'Alimosho', latitude: 6.5699, longitude: 3.2611 },
  { name: 'Ipaja', city: 'Alimosho', latitude: 6.5531, longitude: 3.2564 },
  { name: 'Akowonjo', city: 'Alimosho', latitude: 6.5531, longitude: 3.2564 },
  { name: 'Isheri Olofin', city: 'Alimosho', latitude: 6.5800, longitude: 3.2900 },
  { name: 'Iyana Ipaja', city: 'Alimosho', latitude: 6.6177, longitude: 3.2564 },
  { name: 'Pleasure', city: 'Alimosho' },
  { name: 'Abule Egba', city: 'Alimosho', latitude: 6.5671, longitude: 3.2964 },

  // AJEROMI-IFELODUN LGA
  { name: 'Ajegunle', city: 'Ajeromi-Ifelodun', latitude: 6.4582, longitude: 3.3318 },
  { name: 'Boundary', city: 'Ajeromi-Ifelodun' },
  { name: 'Olodi Apapa', city: 'Ajeromi-Ifelodun' },
  { name: 'Tolu', city: 'Ajeromi-Ifelodun' },
  { name: 'Temidire', city: 'Ajeromi-Ifelodun' },

  // AMUWO-ODOFIN LGA
  { name: 'Festac Town', city: 'Amuwo-Odofin', latitude: 6.4641, longitude: 3.2801 },
  { name: 'Apple Junction', city: 'Amuwo-Odofin' },
  { name: 'Mile 2', city: 'Amuwo-Odofin', latitude: 6.4667, longitude: 3.3167 },
  { name: 'Satellite Town', city: 'Amuwo-Odofin', latitude: 6.4667, longitude: 3.3167 },
  { name: 'Kirikiri', city: 'Amuwo-Odofin' },

  // APAPA LGA
  { name: 'Apapa', city: 'Apapa', latitude: 6.4489, longitude: 3.3594 },
  { name: 'Liverpool', city: 'Apapa' },
  { name: 'Suru Alaba', city: 'Apapa' },
  { name: 'Warehouse', city: 'Apapa' },

  // BADAGRY LGA
  { name: 'Badagry', city: 'Badagry', latitude: 6.4195, longitude: 2.8794 },
  { name: 'Ajara', city: 'Badagry' },
  { name: 'Akarakumo', city: 'Badagry' },

  // EPE LGA
  { name: 'Epe', city: 'Epe', latitude: 6.5833, longitude: 3.9833 },
  { name: 'Ejinrin', city: 'Epe' },
  { name: 'Oriba', city: 'Epe' },

  // ETI-OSA LGA
  { name: 'Lekki Phase 1', city: 'Eti-Osa', latitude: 6.4444, longitude: 3.4732 },
  { name: 'Lekki Phase 2', city: 'Eti-Osa' },
  { name: 'Victoria Island', city: 'Eti-Osa', latitude: 6.4281, longitude: 3.4219 },
  { name: 'Ikoyi', city: 'Eti-Osa', latitude: 6.4541, longitude: 3.4316 },
  { name: 'Ajah', city: 'Eti-Osa', latitude: 6.4698, longitude: 3.5691 },
  { name: 'Ado', city: 'Eti-Osa' },
  { name: 'Ilasan', city: 'Eti-Osa' },
  { name: 'Ikate', city: 'Eti-Osa' },
  { name: 'Oniru', city: 'Eti-Osa' },
  { name: 'Banana Island', city: 'Eti-Osa' },

  // IBEJU-LEKKI LGA
  { name: 'Ibeju', city: 'Ibeju-Lekki' },
  { name: 'Awoyaya', city: 'Ibeju-Lekki', latitude: 6.4865, longitude: 3.6667 },
  { name: 'Lakowe', city: 'Ibeju-Lekki' },
  { name: 'Abijo', city: 'Ibeju-Lekki' },

  // IFAKO-IJAIYE LGA
  { name: 'Ifako', city: 'Ifako-Ijaiye', latitude: 6.6385, longitude: 3.2802 },
  { name: 'Agege', city: 'Ifako-Ijaiye', latitude: 6.6167, longitude: 3.3167 },
  { name: 'Iju', city: 'Ifako-Ijaiye' },
  { name: 'Fagba', city: 'Ifako-Ijaiye' },

  // IKEJA LGA
  { name: 'Ikeja GRA', city: 'Ikeja', latitude: 6.5987, longitude: 3.3569 },
  { name: 'Allen', city: 'Ikeja' },
  { name: 'Alausa', city: 'Ikeja' },
  { name: 'Oregun', city: 'Ikeja' },
  { name: 'Ojodu', city: 'Ikeja', latitude: 6.6500, longitude: 3.3667 },
  { name: 'Magodo', city: 'Ikeja', latitude: 6.6333, longitude: 3.3833 },
  { name: 'Berger', city: 'Ikeja' },
  { name: 'Ogba', city: 'Ikeja', latitude: 6.6333, longitude: 3.3500 },
  { name: 'Omole', city: 'Ikeja' },

  // IKORODU LGA
  { name: 'Ikorodu Town', city: 'Ikorodu', latitude: 6.6150, longitude: 3.5089 },
  { name: 'Igbogbo', city: 'Ikorodu' },
  { name: 'Imota', city: 'Ikorodu' },
  { name: 'Ijede', city: 'Ikorodu' },
  { name: 'Agura', city: 'Ikorodu' },
  { name: 'Isiu', city: 'Ikorodu' },

  // KOSOFE LGA
  { name: 'Ketu', city: 'Kosofe', latitude: 6.5967, longitude: 3.3917 },
  { name: 'Ojota', city: 'Kosofe', latitude: 6.5833, longitude: 3.3833 },
  { name: 'Mile 12', city: 'Kosofe' },
  { name: 'Owode', city: 'Kosofe' },
  { name: 'Ogudu', city: 'Kosofe' },
  { name: 'Agboyi', city: 'Kosofe' },

  // LAGOS ISLAND LGA
  { name: 'Lagos Island', city: 'Lagos Island', latitude: 6.4541, longitude: 3.3947 },
  { name: 'CMS', city: 'Lagos Island' },
  { name: 'Marina', city: 'Lagos Island' },
  { name: 'Broad Street', city: 'Lagos Island' },

  // LAGOS MAINLAND LGA
  { name: 'Yaba', city: 'Lagos Mainland', latitude: 6.5050, longitude: 3.3782 },
  { name: 'Ebute Metta', city: 'Lagos Mainland', latitude: 6.4917, longitude: 3.3750 },
  { name: 'Sabo', city: 'Lagos Mainland' },
  { name: 'Jibowu', city: 'Lagos Mainland' },

  // MUSHIN LGA
  { name: 'Mushin', city: 'Mushin', latitude: 6.5279, longitude: 3.3587 },
  { name: 'Odi Olowo', city: 'Mushin' },
  { name: 'Papa Ajao', city: 'Mushin' },
  { name: 'Idi Araba', city: 'Mushin' },

  // OJO LGA
  { name: 'Ojo', city: 'Ojo', latitude: 6.4593, longitude: 3.1588 },
  { name: 'Okokomaiko', city: 'Ojo' },
  { name: 'Ijanikin', city: 'Ojo' },
  { name: 'Alaba', city: 'Ojo' },
  { name: 'Iyana Iba', city: 'Ojo' },

  // OSHODI-ISOLO LGA
  { name: 'Oshodi', city: 'Oshodi-Isolo', latitude: 6.5449, longitude: 3.3358 },
  { name: 'Isolo', city: 'Oshodi-Isolo', latitude: 6.5372, longitude: 3.3333 },
  { name: 'Okota', city: 'Oshodi-Isolo' },
  { name: 'Mafoluku', city: 'Oshodi-Isolo' },
  { name: 'Ejigbo', city: 'Oshodi-Isolo', latitude: 6.5546, longitude: 3.3051 },

  // SHOMOLU LGA
  { name: 'Shomolu', city: 'Shomolu', latitude: 6.5393, longitude: 3.3850 },
  { name: 'Bariga', city: 'Shomolu', latitude: 6.5333, longitude: 3.3833 },
  { name: 'Akoka', city: 'Shomolu', latitude: 6.5167, longitude: 3.3889 },
  { name: 'Palmgrove', city: 'Shomolu' },

  // SURULERE LGA
  { name: 'Surulere', city: 'Surulere', latitude: 6.4969, longitude: 3.3553 },
  { name: 'Ijesha', city: 'Surulere' },
  { name: 'Itire', city: 'Surulere' },
  { name: 'Ojuelegba', city: 'Surulere' },
  { name: 'Iponri', city: 'Surulere' },
  { name: 'Adeniran Ogunsanya', city: 'Surulere' },
];

export async function seedNormalizedLagosLocations() {
  console.log('🌍 Starting normalized location hierarchy seeding...\n');

  try {
    // Step 1: Create Nigeria
    console.log('Step 1: Creating Nigeria...');
    let nigeria = await prisma.country.findUnique({ where: { code: 'NG' } });
    if (!nigeria) {
      nigeria = await prisma.country.create({
        data: { name: 'Nigeria', code: 'NG' }
      });
      console.log('✅ Created Nigeria\n');
    } else {
      console.log('→ Nigeria already exists\n');
    }

    // Step 2: Create Lagos State
    console.log('Step 2: Creating Lagos State...');
    let lagosState = await prisma.state.findFirst({
      where: { name: 'Lagos', countryId: nigeria.id }
    });
    if (!lagosState) {
      lagosState = await prisma.state.create({
        data: {
          name: 'Lagos',
          code: 'LA',
          countryId: nigeria.id
        }
      });
      console.log('✅ Created Lagos State\n');
    } else {
      console.log('→ Lagos State already exists\n');
    }

    // Step 3: Get unique cities (LGAs) from neighborhood data
    const uniqueCities = [...new Set(lagosNeighborhoods.map(n => n.city))];
    console.log(`Step 3: Creating ${uniqueCities.length} cities (LGAs)...`);

    const cityMap = new Map<string, string>();
    for (const cityName of uniqueCities) {
      let city = await prisma.city.findFirst({
        where: { name: cityName, stateId: lagosState.id }
      });

      if (!city) {
        city = await prisma.city.create({
          data: {
            name: cityName,
            stateId: lagosState.id
          }
        });
        console.log(`  ✓ Created city: ${cityName}`);
      } else {
        console.log(`  → City already exists: ${cityName}`);
      }

      cityMap.set(cityName, city.id);
    }
    console.log(`✅ Created/found ${uniqueCities.length} cities\n`);

    // Step 4: Create neighborhoods
    console.log(`Step 4: Creating ${lagosNeighborhoods.length} neighborhoods...`);
    let created = 0;
    let skipped = 0;

    for (const neighborhood of lagosNeighborhoods) {
      const cityId = cityMap.get(neighborhood.city);
      if (!cityId) {
        console.log(`  ⚠️  Skipping ${neighborhood.name} - city ${neighborhood.city} not found`);
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
            legacyState: 'Lagos',
            legacyCountry: 'Nigeria',
            latitude: neighborhood.latitude,
            longitude: neighborhood.longitude
          }
        });
        created++;
        if (created % 20 === 0) {
          console.log(`  ... ${created} neighborhoods created`);
        }
      } else {
        skipped++;
      }
    }

    console.log(`✅ Created ${created} neighborhoods (${skipped} already existed)\n`);

    console.log('✨ Summary:');
    console.log(`   Country: Nigeria (NG)`);
    console.log(`   State: Lagos`);
    console.log(`   Cities: ${uniqueCities.length} LGAs`);
    console.log(`   Neighborhoods: ${created} created, ${skipped} skipped`);
    console.log('\n✅ Normalized location hierarchy seeding completed!\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedNormalizedLagosLocations()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
