import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Lagos State Neighborhoods Seeder
 * Comprehensive list of neighborhoods across all LGAs in Lagos State
 */

interface NeighborhoodData {
  name: string;
  city: string; // LGA (Local Government Area)
  state: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

const lagosNeighborhoods: NeighborhoodData[] = [
  // ALIMOSHO LGA (Most Populous)
  { name: 'Ikotun', city: 'Alimosho', state: 'Lagos', country: 'Nigeria', latitude: 6.5487, longitude: 3.2620 },
  { name: 'Egbeda', city: 'Alimosho', state: 'Lagos', country: 'Nigeria', latitude: 6.5692, longitude: 3.2889 },
  { name: 'Idimu', city: 'Alimosho', state: 'Lagos', country: 'Nigeria', latitude: 6.5699, longitude: 3.2611 },
  { name: 'Ipaja', city: 'Alimosho', state: 'Lagos', country: 'Nigeria', latitude: 6.5531, longitude: 3.2564 },
  { name: 'Akowonjo', city: 'Alimosho', state: 'Lagos', country: 'Nigeria', latitude: 6.5531, longitude: 3.2564 },
  { name: 'Isheri Olofin', city: 'Alimosho', state: 'Lagos', country: 'Nigeria', latitude: 6.5800, longitude: 3.2900 },
  { name: 'Iyana Ipaja', city: 'Alimosho', state: 'Lagos', country: 'Nigeria', latitude: 6.6177, longitude: 3.2564 },
  { name: 'Pleasure', city: 'Alimosho', state: 'Lagos', country: 'Nigeria' },
  { name: 'Abule Egba', city: 'Alimosho', state: 'Lagos', country: 'Nigeria', latitude: 6.5671, longitude: 3.2964 },

  // AJEROMI-IFELODUN LGA
  { name: 'Ajegunle', city: 'Ajeromi-Ifelodun', state: 'Lagos', country: 'Nigeria', latitude: 6.4582, longitude: 3.3318 },
  { name: 'Boundary', city: 'Ajeromi-Ifelodun', state: 'Lagos', country: 'Nigeria' },
  { name: 'Olodi Apapa', city: 'Ajeromi-Ifelodun', state: 'Lagos', country: 'Nigeria' },
  { name: 'Tolu', city: 'Ajeromi-Ifelodun', state: 'Lagos', country: 'Nigeria' },
  { name: 'Temidire', city: 'Ajeromi-Ifelodun', state: 'Lagos', country: 'Nigeria' },

  // AMUWO-ODOFIN LGA
  { name: 'Festac Town', city: 'Amuwo-Odofin', state: 'Lagos', country: 'Nigeria', latitude: 6.4641, longitude: 3.2801 },
  { name: 'Apple Junction', city: 'Amuwo-Odofin', state: 'Lagos', country: 'Nigeria' },
  { name: 'Mile 2', city: 'Amuwo-Odofin', state: 'Lagos', country: 'Nigeria', latitude: 6.4667, longitude: 3.3167 },
  { name: 'Satellite Town', city: 'Amuwo-Odofin', state: 'Lagos', country: 'Nigeria', latitude: 6.4667, longitude: 3.3167 },
  { name: 'Kirikiri', city: 'Amuwo-Odofin', state: 'Lagos', country: 'Nigeria' },

  // APAPA LGA
  { name: 'Apapa', city: 'Apapa', state: 'Lagos', country: 'Nigeria', latitude: 6.4489, longitude: 3.3594 },
  { name: 'Liverpool', city: 'Apapa', state: 'Lagos', country: 'Nigeria' },
  { name: 'Suru Alaba', city: 'Apapa', state: 'Lagos', country: 'Nigeria' },
  { name: 'Warehouse', city: 'Apapa', state: 'Lagos', country: 'Nigeria' },

  // BADAGRY LGA
  { name: 'Badagry', city: 'Badagry', state: 'Lagos', country: 'Nigeria', latitude: 6.4167, longitude: 2.8833 },
  { name: 'Ajara', city: 'Badagry', state: 'Lagos', country: 'Nigeria' },
  { name: 'Iworo', city: 'Badagry', state: 'Lagos', country: 'Nigeria' },
  { name: 'Gberefu', city: 'Badagry', state: 'Lagos', country: 'Nigeria' },

  // EPE LGA
  { name: 'Epe', city: 'Epe', state: 'Lagos', country: 'Nigeria', latitude: 6.5833, longitude: 3.9833 },
  { name: 'Ejinrin', city: 'Epe', state: 'Lagos', country: 'Nigeria' },
  { name: 'Poka', city: 'Epe', state: 'Lagos', country: 'Nigeria' },
  { name: 'Iberekodo', city: 'Epe', state: 'Lagos', country: 'Nigeria' },

  // ETI-OSA LGA
  { name: 'Lekki Phase 1', city: 'Eti-Osa', state: 'Lagos', country: 'Nigeria', latitude: 6.4433, longitude: 3.4700 },
  { name: 'Lekki Phase 2', city: 'Eti-Osa', state: 'Lagos', country: 'Nigeria' },
  { name: 'Ajah', city: 'Eti-Osa', state: 'Lagos', country: 'Nigeria', latitude: 6.4667, longitude: 3.5667 },
  { name: 'Victoria Island', city: 'Eti-Osa', state: 'Lagos', country: 'Nigeria', latitude: 6.4281, longitude: 3.4219 },
  { name: 'Ikoyi', city: 'Eti-Osa', state: 'Lagos', country: 'Nigeria', latitude: 6.4543, longitude: 3.4316 },
  { name: 'Banana Island', city: 'Eti-Osa', state: 'Lagos', country: 'Nigeria' },
  { name: 'Oniru', city: 'Eti-Osa', state: 'Lagos', country: 'Nigeria' },
  { name: 'Maroko', city: 'Eti-Osa', state: 'Lagos', country: 'Nigeria' },
  { name: 'Ilasan', city: 'Eti-Osa', state: 'Lagos', country: 'Nigeria' },
  { name: 'Ikate', city: 'Eti-Osa', state: 'Lagos', country: 'Nigeria' },
  { name: 'Elegushi', city: 'Eti-Osa', state: 'Lagos', country: 'Nigeria' },
  { name: 'Abraham Adesanya', city: 'Eti-Osa', state: 'Lagos', country: 'Nigeria' },
  { name: 'VGC (Victoria Garden City)', city: 'Eti-Osa', state: 'Lagos', country: 'Nigeria' },
  { name: 'Chevron', city: 'Eti-Osa', state: 'Lagos', country: 'Nigeria' },
  { name: 'Jakande', city: 'Eti-Osa', state: 'Lagos', country: 'Nigeria' },
  { name: 'Ado', city: 'Eti-Osa', state: 'Lagos', country: 'Nigeria' },
  { name: 'Langbasa', city: 'Eti-Osa', state: 'Lagos', country: 'Nigeria' },
  { name: 'Badore', city: 'Eti-Osa', state: 'Lagos', country: 'Nigeria' },

  // IBEJU-LEKKI LGA
  { name: 'Ibeju-Lekki', city: 'Ibeju-Lekki', state: 'Lagos', country: 'Nigeria', latitude: 6.4333, longitude: 3.8667 },
  { name: 'Awoyaya', city: 'Ibeju-Lekki', state: 'Lagos', country: 'Nigeria' },
  { name: 'Bogije', city: 'Ibeju-Lekki', state: 'Lagos', country: 'Nigeria' },
  { name: 'Lakowe', city: 'Ibeju-Lekki', state: 'Lagos', country: 'Nigeria' },
  { name: 'Eleko', city: 'Ibeju-Lekki', state: 'Lagos', country: 'Nigeria' },
  { name: 'Akodo', city: 'Ibeju-Lekki', state: 'Lagos', country: 'Nigeria' },

  // IFAKO-IJAIYE LGA
  { name: 'Agege', city: 'Ifako-Ijaiye', state: 'Lagos', country: 'Nigeria', latitude: 6.6177, longitude: 3.3158 },
  { name: 'Ifako', city: 'Ifako-Ijaiye', state: 'Lagos', country: 'Nigeria' },
  { name: 'Ijaiye', city: 'Ifako-Ijaiye', state: 'Lagos', country: 'Nigeria' },
  { name: 'Alakuko', city: 'Ifako-Ijaiye', state: 'Lagos', country: 'Nigeria' },
  { name: 'Oke-Odo', city: 'Ifako-Ijaiye', state: 'Lagos', country: 'Nigeria' },
  { name: 'Fagba', city: 'Ifako-Ijaiye', state: 'Lagos', country: 'Nigeria' },

  // IKEJA LGA
  { name: 'Ikeja GRA', city: 'Ikeja', state: 'Lagos', country: 'Nigeria', latitude: 6.5964, longitude: 3.3486 },
  { name: 'Allen Avenue', city: 'Ikeja', state: 'Lagos', country: 'Nigeria' },
  { name: 'Opebi', city: 'Ikeja', state: 'Lagos', country: 'Nigeria' },
  { name: 'Alausa', city: 'Ikeja', state: 'Lagos', country: 'Nigeria', latitude: 6.6177, longitude: 3.3544 },
  { name: 'Maryland', city: 'Ikeja', state: 'Lagos', country: 'Nigeria', latitude: 6.5772, longitude: 3.3658 },
  { name: 'Oregun', city: 'Ikeja', state: 'Lagos', country: 'Nigeria' },
  { name: 'Ojodu', city: 'Ikeja', state: 'Lagos', country: 'Nigeria', latitude: 6.6500, longitude: 3.3667 },
  { name: 'Berger', city: 'Ikeja', state: 'Lagos', country: 'Nigeria' },
  { name: 'Omole Phase 1', city: 'Ikeja', state: 'Lagos', country: 'Nigeria' },
  { name: 'Omole Phase 2', city: 'Ikeja', state: 'Lagos', country: 'Nigeria' },
  { name: 'Ogba', city: 'Ikeja', state: 'Lagos', country: 'Nigeria', latitude: 6.6333, longitude: 3.3500 },
  { name: 'Isheri', city: 'Ikeja', state: 'Lagos', country: 'Nigeria' },

  // IKORODU LGA
  { name: 'Ikorodu Town', city: 'Ikorodu', state: 'Lagos', country: 'Nigeria', latitude: 6.6194, longitude: 3.5106 },
  { name: 'Ebute', city: 'Ikorodu', state: 'Lagos', country: 'Nigeria' },
  { name: 'Igbogbo', city: 'Ikorodu', state: 'Lagos', country: 'Nigeria' },
  { name: 'Ijede', city: 'Ikorodu', state: 'Lagos', country: 'Nigeria' },
  { name: 'Agric', city: 'Ikorodu', state: 'Lagos', country: 'Nigeria' },
  { name: 'Gberigbe', city: 'Ikorodu', state: 'Lagos', country: 'Nigeria' },
  { name: 'Isiu', city: 'Ikorodu', state: 'Lagos', country: 'Nigeria' },

  // KOSOFE LGA
  { name: 'Ketu', city: 'Kosofe', state: 'Lagos', country: 'Nigeria', latitude: 6.5985, longitude: 3.3903 },
  { name: 'Mile 12', city: 'Kosofe', state: 'Lagos', country: 'Nigeria' },
  { name: 'Alapere', city: 'Kosofe', state: 'Lagos', country: 'Nigeria' },
  { name: 'Agboyi', city: 'Kosofe', state: 'Lagos', country: 'Nigeria' },
  { name: 'Oworonshoki', city: 'Kosofe', state: 'Lagos', country: 'Nigeria' },
  { name: 'Anthony Village', city: 'Kosofe', state: 'Lagos', country: 'Nigeria' },
  { name: 'Ikosi', city: 'Kosofe', state: 'Lagos', country: 'Nigeria' },

  // LAGOS ISLAND LGA
  { name: 'Lagos Island', city: 'Lagos Island', state: 'Lagos', country: 'Nigeria', latitude: 6.4541, longitude: 3.3947 },
  { name: 'Marina', city: 'Lagos Island', state: 'Lagos', country: 'Nigeria' },
  { name: 'Broad Street', city: 'Lagos Island', state: 'Lagos', country: 'Nigeria' },
  { name: 'CMS', city: 'Lagos Island', state: 'Lagos', country: 'Nigeria' },
  { name: 'Tinubu', city: 'Lagos Island', state: 'Lagos', country: 'Nigeria' },
  { name: 'Adeniji Adele', city: 'Lagos Island', state: 'Lagos', country: 'Nigeria' },
  { name: 'Epetedo', city: 'Lagos Island', state: 'Lagos', country: 'Nigeria' },

  // LAGOS MAINLAND LGA
  { name: 'Yaba', city: 'Lagos Mainland', state: 'Lagos', country: 'Nigeria', latitude: 6.5092, longitude: 3.3715 },
  { name: 'Ebute Metta', city: 'Lagos Mainland', state: 'Lagos', country: 'Nigeria', latitude: 6.4955, longitude: 3.3755 },
  { name: 'Oyingbo', city: 'Lagos Mainland', state: 'Lagos', country: 'Nigeria' },
  { name: 'Sabo', city: 'Lagos Mainland', state: 'Lagos', country: 'Nigeria' },
  { name: 'Jibowu', city: 'Lagos Mainland', state: 'Lagos', country: 'Nigeria' },
  { name: 'Onike', city: 'Lagos Mainland', state: 'Lagos', country: 'Nigeria' },

  // MUSHIN LGA
  { name: 'Mushin', city: 'Mushin', state: 'Lagos', country: 'Nigeria', latitude: 6.5322, longitude: 3.3548 },
  { name: 'Idi Araba', city: 'Mushin', state: 'Lagos', country: 'Nigeria' },
  { name: 'Papa Ajao', city: 'Mushin', state: 'Lagos', country: 'Nigeria' },
  { name: 'Odi Olowo', city: 'Mushin', state: 'Lagos', country: 'Nigeria' },
  { name: 'Ire Akari', city: 'Mushin', state: 'Lagos', country: 'Nigeria' },
  { name: 'Ilupeju', city: 'Mushin', state: 'Lagos', country: 'Nigeria', latitude: 6.5514, longitude: 3.3594 },
  { name: 'Isolo', city: 'Mushin', state: 'Lagos', country: 'Nigeria', latitude: 6.5370, longitude: 3.3394 },

  // OJO LGA
  { name: 'Ojo Town', city: 'Ojo', state: 'Lagos', country: 'Nigeria', latitude: 6.4589, longitude: 3.1600 },
  { name: 'Alaba', city: 'Ojo', state: 'Lagos', country: 'Nigeria' },
  { name: 'Okokomaiko', city: 'Ojo', state: 'Lagos', country: 'Nigeria' },
  { name: 'Ajangbadi', city: 'Ojo', state: 'Lagos', country: 'Nigeria' },
  { name: 'Iyana Iba', city: 'Ojo', state: 'Lagos', country: 'Nigeria' },
  { name: 'Igando', city: 'Ojo', state: 'Lagos', country: 'Nigeria', latitude: 6.5431, longitude: 3.2375 },

  // OSHODI-ISOLO LGA
  { name: 'Oshodi', city: 'Oshodi-Isolo', state: 'Lagos', country: 'Nigeria', latitude: 6.5500, longitude: 3.3333 },
  { name: 'Mafoluku', city: 'Oshodi-Isolo', state: 'Lagos', country: 'Nigeria' },
  { name: 'Ajao Estate', city: 'Oshodi-Isolo', state: 'Lagos', country: 'Nigeria' },
  { name: 'Okota', city: 'Oshodi-Isolo', state: 'Lagos', country: 'Nigeria' },
  { name: 'Ejigbo', city: 'Oshodi-Isolo', state: 'Lagos', country: 'Nigeria', latitude: 6.5509, longitude: 3.3043 },
  { name: 'Ilasa', city: 'Oshodi-Isolo', state: 'Lagos', country: 'Nigeria' },

  // SHOMOLU LGA
  { name: 'Shomolu', city: 'Shomolu', state: 'Lagos', country: 'Nigeria', latitude: 6.5392, longitude: 3.3842 },
  { name: 'Bariga', city: 'Shomolu', state: 'Lagos', country: 'Nigeria', latitude: 6.5392, longitude: 3.3842 },
  { name: 'Gbagada', city: 'Shomolu', state: 'Lagos', country: 'Nigeria', latitude: 6.5500, longitude: 3.3833 },
  { name: 'Palmgrove', city: 'Shomolu', state: 'Lagos', country: 'Nigeria' },
  { name: 'Onipanu', city: 'Shomolu', state: 'Lagos', country: 'Nigeria' },
  { name: 'Fadeyi', city: 'Shomolu', state: 'Lagos', country: 'Nigeria' },

  // SURULERE LGA
  { name: 'Surulere', city: 'Surulere', state: 'Lagos', country: 'Nigeria', latitude: 6.4969, longitude: 3.3592 },
  { name: 'Iponri', city: 'Surulere', state: 'Lagos', country: 'Nigeria' },
  { name: 'Ijeshatedo', city: 'Surulere', state: 'Lagos', country: 'Nigeria' },
  { name: 'Itire', city: 'Surulere', state: 'Lagos', country: 'Nigeria' },
  { name: 'Aguda', city: 'Surulere', state: 'Lagos', country: 'Nigeria' },
  { name: 'Lawanson', city: 'Surulere', state: 'Lagos', country: 'Nigeria' },
  { name: 'Adeniran Ogunsanya', city: 'Surulere', state: 'Lagos', country: 'Nigeria' },
  { name: 'Bode Thomas', city: 'Surulere', state: 'Lagos', country: 'Nigeria' },

  // ADDITIONAL POPULAR AREAS
  { name: 'Magodo Phase 1', city: 'Kosofe', state: 'Lagos', country: 'Nigeria', latitude: 6.5833, longitude: 3.3667 },
  { name: 'Magodo Phase 2', city: 'Kosofe', state: 'Lagos', country: 'Nigeria' },
  { name: 'CMD Road', city: 'Kosofe', state: 'Lagos', country: 'Nigeria' },
  { name: 'Sangotedo', city: 'Ibeju-Lekki', state: 'Lagos', country: 'Nigeria' },
  { name: 'Abijo', city: 'Ibeju-Lekki', state: 'Lagos', country: 'Nigeria' },
  { name: 'Eputu', city: 'Ibeju-Lekki', state: 'Lagos', country: 'Nigeria' },
];

export async function seedLagosNeighborhoods() {
  console.log('🏘️  Starting Lagos State neighborhoods seeding...');

  let created = 0;
  let skipped = 0;

  for (const neighborhood of lagosNeighborhoods) {
    try {
      // Check if neighborhood already exists
      const existing = await prisma.neighborhood.findFirst({
        where: {
          name: neighborhood.name,
          city: neighborhood.city,
          state: neighborhood.state,
        },
      });

      if (existing) {
        skipped++;
        continue;
      }

      // Create new neighborhood
      await prisma.neighborhood.create({
        data: neighborhood,
      });

      created++;
    } catch (error) {
      console.error(`Error seeding ${neighborhood.name}:`, error);
    }
  }

  console.log(`✅ Seeded ${created} new neighborhoods`);
  console.log(`⏭️  Skipped ${skipped} existing neighborhoods`);
  console.log(`📊 Total neighborhoods in seed data: ${lagosNeighborhoods.length}`);
  console.log('🎉 Lagos State neighborhoods seeding completed!');
}

// Run if executed directly
if (require.main === module) {
  seedLagosNeighborhoods()
    .then(() => {
      console.log('✅ Seed completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Seed failed:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
