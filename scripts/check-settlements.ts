import { prisma } from '../lib/prisma';

async function main() {
  console.log('Checking for PAID orders...\n');

  const paidOrders = await prisma.order.findMany({
    where: { status: 'PAID' },
    select: {
      id: true,
      status: true,
      fixerAmount: true,
      totalAmount: true,
      clientId: true,
      fixerId: true,
      gigId: true,
      requestId: true,
    },
  });

  console.log(`Found ${paidOrders.length} PAID orders:`);
  console.log(JSON.stringify(paidOrders, null, 2));

  console.log('\n\nChecking all order statuses...\n');

  const allOrders = await prisma.order.findMany({
    select: {
      id: true,
      status: true,
      fixerAmount: true,
      gigId: true,
      requestId: true,
    },
  });

  console.log(`Total orders: ${allOrders.length}`);
  const statusCounts: Record<string, number> = {};
  allOrders.forEach(order => {
    statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
  });
  console.log('Status breakdown:', statusCounts);

  await prisma.$disconnect();
}

main().catch(console.error);
