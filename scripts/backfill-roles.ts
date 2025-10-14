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
      role: true,
      roles: true,
    },
  });

  console.log(`Found ${users.length} users to update`);

  let updated = 0;
  for (const user of users) {
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          roles: [user.role],
        },
      });
      updated++;
      console.log(`✓ Updated user ${user.email || user.phone}: role=${user.role} → roles=[${user.role}]`);
    } catch (error) {
      console.error(`✗ Failed to update user ${user.email || user.phone}:`, error);
    }
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
