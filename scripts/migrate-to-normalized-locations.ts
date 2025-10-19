import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateToNormalizedLocations() {
  console.log('🚀 Starting location data normalization migration...\n');

  try {
    // Step 1: Rename existing columns to legacy columns before adding new structure
    console.log('Step 1: Copying existing data to legacy fields...');

    // Update Neighborhood table - copy city, state, country to legacy fields
    await prisma.$executeRaw`
      UPDATE "Neighborhood"
      SET
        "legacyCity" = city,
        "legacyState" = state,
        "legacyCountry" = country
      WHERE "legacyCity" IS NULL
    `;

    const neighborhoodsUpdated = await prisma.neighborhood.count();
    console.log(`✅ Updated ${neighborhoodsUpdated} neighborhoods with legacy location data\n`);

    // Step 2: Create Country records
    console.log('Step 2: Creating Country records...');
    const countries = await prisma.$queryRaw<Array<{ country: string }>>`
      SELECT DISTINCT country FROM "Neighborhood" WHERE country IS NOT NULL
    `;

    const countryMap = new Map<string, string>();
    for (const { country } of countries) {
      const code = country === 'Nigeria' ? 'NG' : country.substring(0, 2).toUpperCase();
      const existingCountry = await prisma.country.findUnique({ where: { name: country } });

      if (!existingCountry) {
        const newCountry = await prisma.country.create({
          data: { name: country, code }
        });
        countryMap.set(country, newCountry.id);
        console.log(`  ✓ Created country: ${country} (${code})`);
      } else {
        countryMap.set(country, existingCountry.id);
        console.log(`  → Country already exists: ${country}`);
      }
    }
    console.log(`✅ Created/found ${countryMap.size} countries\n`);

    // Step 3: Create State records
    console.log('Step 3: Creating State records...');
    const states = await prisma.$queryRaw<Array<{ state: string, country: string }>>`
      SELECT DISTINCT state, country FROM "Neighborhood" WHERE state IS NOT NULL AND country IS NOT NULL
    `;

    const stateMap = new Map<string, string>();
    for (const { state, country } of states) {
      const countryId = countryMap.get(country);
      if (!countryId) {
        console.log(`  ⚠️  Skipping state ${state} - country ${country} not found`);
        continue;
      }

      const key = `${state}|${country}`;
      const existingState = await prisma.state.findFirst({
        where: { name: state, countryId }
      });

      if (!existingState) {
        const newState = await prisma.state.create({
          data: { name: state, countryId }
        });
        stateMap.set(key, newState.id);
        console.log(`  ✓ Created state: ${state} in ${country}`);
      } else {
        stateMap.set(key, existingState.id);
        console.log(`  → State already exists: ${state} in ${country}`);
      }
    }
    console.log(`✅ Created/found ${stateMap.size} states\n`);

    // Step 4: Create City records
    console.log('Step 4: Creating City records...');
    const cities = await prisma.$queryRaw<Array<{ city: string, state: string, country: string }>>`
      SELECT DISTINCT city, state, country FROM "Neighborhood" WHERE city IS NOT NULL AND state IS NOT NULL
    `;

    const cityMap = new Map<string, string>();
    for (const { city, state, country } of cities) {
      const stateKey = `${state}|${country}`;
      const stateId = stateMap.get(stateKey);
      if (!stateId) {
        console.log(`  ⚠️  Skipping city ${city} - state ${state} not found`);
        continue;
      }

      const key = `${city}|${state}|${country}`;
      const existingCity = await prisma.city.findFirst({
        where: { name: city, stateId }
      });

      if (!existingCity) {
        const newCity = await prisma.city.create({
          data: { name: city, stateId }
        });
        cityMap.set(key, newCity.id);
        console.log(`  ✓ Created city: ${city} in ${state}`);
      } else {
        cityMap.set(key, existingCity.id);
        console.log(`  → City already exists: ${city} in ${state}`);
      }
    }
    console.log(`✅ Created/found ${cityMap.size} cities\n`);

    // Step 5: Update Neighborhood records with cityId
    console.log('Step 5: Linking neighborhoods to cities...');
    const neighborhoods = await prisma.neighborhood.findMany({
      where: { cityId: null },
      select: { id: true, name: true, legacyCity: true, legacyState: true, legacyCountry: true }
    });

    let linked = 0;
    for (const neighborhood of neighborhoods) {
      if (!neighborhood.legacyCity || !neighborhood.legacyState || !neighborhood.legacyCountry) {
        console.log(`  ⚠️  Skipping ${neighborhood.name} - missing legacy location data`);
        continue;
      }

      const cityKey = `${neighborhood.legacyCity}|${neighborhood.legacyState}|${neighborhood.legacyCountry}`;
      const cityId = cityMap.get(cityKey);

      if (cityId) {
        await prisma.neighborhood.update({
          where: { id: neighborhood.id },
          data: { cityId }
        });
        linked++;
        console.log(`  ✓ Linked ${neighborhood.name} to ${neighborhood.legacyCity}`);
      } else {
        console.log(`  ⚠️  Could not find city for ${neighborhood.name}: ${cityKey}`);
      }
    }
    console.log(`✅ Linked ${linked} neighborhoods to cities\n`);

    // Step 6: Update FixerProfile records
    console.log('Step 6: Linking fixer profiles to neighborhoods...');
    const fixerProfiles = await prisma.fixerProfile.findMany({
      where: { neighborhoodId: null },
      select: { id: true, fixerId: true, neighbourhood: true, city: true, state: true, country: true }
    });

    let fixerLinked = 0;
    for (const profile of fixerProfiles) {
      if (!profile.neighbourhood || !profile.state) {
        console.log(`  ⚠️  Skipping fixer profile ${profile.id} - missing location data`);
        continue;
      }

      const neighborhood = await prisma.neighborhood.findFirst({
        where: {
          name: profile.neighbourhood,
          legacyState: profile.state,
        }
      });

      if (neighborhood) {
        await prisma.fixerProfile.update({
          where: { id: profile.id },
          data: { neighborhoodId: neighborhood.id }
        });
        fixerLinked++;
        console.log(`  ✓ Linked fixer profile to ${profile.neighbourhood}`);
      } else {
        console.log(`  ⚠️  Could not find neighborhood for fixer: ${profile.neighbourhood}, ${profile.state}`);
      }
    }
    console.log(`✅ Linked ${fixerLinked} fixer profiles\n`);

    // Step 7: Update ClientProfile records
    console.log('Step 7: Linking client profiles to neighborhoods...');
    const clientProfiles = await prisma.clientProfile.findMany({
      where: { neighborhoodId: null },
      select: { id: true, clientId: true, neighbourhood: true, city: true, state: true, country: true }
    });

    let clientLinked = 0;
    for (const profile of clientProfiles) {
      if (!profile.neighbourhood || !profile.state) {
        console.log(`  ⚠️  Skipping client profile ${profile.id} - missing location data`);
        continue;
      }

      const neighborhood = await prisma.neighborhood.findFirst({
        where: {
          name: profile.neighbourhood,
          legacyState: profile.state,
        }
      });

      if (neighborhood) {
        await prisma.clientProfile.update({
          where: { id: profile.id },
          data: { neighborhoodId: neighborhood.id }
        });
        clientLinked++;
        console.log(`  ✓ Linked client profile to ${profile.neighbourhood}`);
      } else {
        console.log(`  ⚠️  Could not find neighborhood for client: ${profile.neighbourhood}, ${profile.state}`);
      }
    }
    console.log(`✅ Linked ${clientLinked} client profiles\n`);

    // Summary
    console.log('✨ Migration Summary:');
    console.log(`   Countries: ${countryMap.size}`);
    console.log(`   States: ${stateMap.size}`);
    console.log(`   Cities: ${cityMap.size}`);
    console.log(`   Neighborhoods linked: ${linked}`);
    console.log(`   Fixer profiles linked: ${fixerLinked}`);
    console.log(`   Client profiles linked: ${clientLinked}`);
    console.log('\n✅ Location normalization migration completed successfully!');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

migrateToNormalizedLocations()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
