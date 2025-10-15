import { prisma } from './lib/prisma';

async function checkOrder() {
  const orderId = 'cmgr6k2dh002dkpqz2pmcgsqz';

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      payment: true,
      fixer: {
        select: {
          id: true,
          name: true,
          email: true,
        }
      }
    }
  });

  console.log('Order Status:', order?.status);
  console.log('Payment Status:', order?.payment?.status);
  console.log('Fixer:', order?.fixer?.name || order?.fixer?.email);
  console.log('Total Amount:', order?.totalAmount);
  console.log('Fixer Amount:', order?.fixerAmount);

  // Check fixer's purse balance
  const purse = await prisma.purse.findUnique({
    where: {
      userId: order?.fixerId || '',
    }
  });

  console.log('\nPurse Balance:');
  console.log('Total Revenue:', purse?.totalRevenue);
  console.log('Available:', purse?.availableBalance);
  console.log('Pending:', purse?.pendingBalance);
}

checkOrder()
  .then(() => process.exit(0))
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
