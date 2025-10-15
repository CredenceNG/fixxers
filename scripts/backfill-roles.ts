import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting roles backfill...');

  // Get all users where roles array is empty
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { roles: { isEmpty: true } },
        { roles: { equals: [] } },
      ],
    },
    select: {
      id: true,
      email: true,
      phone: true,
      roles: true,
    },
  });

  console.log(`Found ${users.length} users with empty roles array`);
  console.log(`Note: This script is deprecated. All users should now have roles.`);

  let updated = 0;
  for (const user of users) {
    console.log(`⚠ User ${user.email || user.phone} has empty roles array - needs manual intervention`);
  }

  console.log(`\nBackfill complete! Updated ${updated} of ${users.length} users.`);
}

main()
  .catch((e) => {
    console.error('Error during backfill:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
