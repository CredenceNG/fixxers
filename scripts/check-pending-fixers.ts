import { prisma } from '../lib/prisma';

async function checkPendingFixers() {
  const pendingFixers = await prisma.user.findMany({
    where: {
      roles: { has: 'FIXER' },
      OR: [
        { status: 'PENDING' },
        {
          fixerProfile: {
            isNot: null,
            is: {
              pendingChanges: true,
            },
          },
        },
      ],
    },
    select: {
      id: true,
      name: true,
      email: true,
      status: true,
      fixerProfile: {
        select: {
          pendingChanges: true,
        },
      },
    },
  });

  console.log('Pending Fixers:', JSON.stringify(pendingFixers, null, 2));
  console.log('\nCount:', pendingFixers.length);
}

checkPendingFixers()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
