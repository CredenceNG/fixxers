const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function migrateFixerProfiles() {
  try {
    console.log('Starting fixer profile migration...\n');

    // First, manually add the FixerProfile table
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FixerProfile" (
        "id" TEXT NOT NULL,
        "fixerId" TEXT NOT NULL,
        "yearsOfService" INTEGER NOT NULL,
        "qualifications" TEXT[],
        "neighbourhood" TEXT NOT NULL,
        "city" TEXT NOT NULL,
        "state" TEXT NOT NULL,
        "country" TEXT NOT NULL,
        "primaryPhone" TEXT NOT NULL,
        "secondaryPhone" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "FixerProfile_pkey" PRIMARY KEY ("id")
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "FixerProfile_fixerId_key" ON "FixerProfile"("fixerId");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "FixerProfile_fixerId_idx" ON "FixerProfile"("fixerId");
    `);

    await prisma.$executeRawUnsafe(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'FixerProfile_fixer_fkey'
        ) THEN
          ALTER TABLE "FixerProfile" ADD CONSTRAINT "FixerProfile_fixer_fkey"
          FOREIGN KEY ("fixerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `);

    console.log('FixerProfile table created.\n');

    // Get all users with profile data
    const usersWithProfiles = await prisma.$queryRaw`
      SELECT id, "yearsOfService", qualifications, neighbourhood, city, state, country,
             "primaryPhone", "secondaryPhone", "createdAt", "updatedAt"
      FROM "User"
      WHERE "yearsOfService" IS NOT NULL
         OR qualifications IS NOT NULL
         OR neighbourhood IS NOT NULL
         OR city IS NOT NULL
         OR state IS NOT NULL
         OR country IS NOT NULL
         OR "primaryPhone" IS NOT NULL
    `;

    console.log(`Found ${usersWithProfiles.length} users with profile data.\n`);

    // Migrate each user's profile data
    for (const user of usersWithProfiles) {
      if (user.yearsOfService && user.neighbourhood && user.city && user.state && user.country && user.primaryPhone) {
        const profileId = `fp_${user.id}`;

        await prisma.$executeRawUnsafe(`
          INSERT INTO "FixerProfile" (
            "id", "fixerId", "yearsOfService", "qualifications", "neighbourhood",
            "city", "state", "country", "primaryPhone", "secondaryPhone",
            "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
          )
          ON CONFLICT ("fixerId") DO NOTHING
        `,
          profileId,
          user.id,
          user.yearsOfService,
          user.qualifications || [],
          user.neighbourhood,
          user.city,
          user.state,
          user.country,
          user.primaryPhone,
          user.secondaryPhone,
          user.createdAt,
          user.updatedAt
        );

        console.log(`✓ Migrated profile for user ${user.id}`);
      }
    }

    console.log('\n✓ Migration complete!');
    console.log('You can now run: npx prisma db push --accept-data-loss');

  } catch (error) {
    console.error('Migration error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateFixerProfiles();
