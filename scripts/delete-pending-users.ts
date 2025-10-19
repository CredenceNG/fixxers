const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deletePendingUsers() {
  console.log('Starting deletion of pending users...');

  // Find all users with PENDING status
  const pendingUsers = await prisma.user.findMany({
    where: { status: 'PENDING' },
    select: { id: true, email: true, name: true, roles: true },
  });

  console.log(`Found ${pendingUsers.length} pending users`);

  for (const user of pendingUsers) {
    console.log(`Deleting user: ${user.name || user.email} (${user.roles.join(', ')})`);
    
    // Delete the user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: user.id },
    });
  }

  console.log(`Deleted ${pendingUsers.length} pending users`);
  await prisma.$disconnect();
}

deletePendingUsers().catch((error) => {
  console.error('Error during deletion:', error);
  process.exit(1);
});
