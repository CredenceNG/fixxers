import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function fixBadgePaymentStatus() {
  const requestId = 'cmgv7gfyn0005kpgt23s67iq7';

  const badgeRequest = await (prisma as any).badgeRequest.findUnique({
    where: { id: requestId },
    select: {
      id: true,
      status: true,
      paymentStatus: true,
      paymentRef: true,
      paidAt: true,
    }
  });

  console.log('Current Badge Request Status:');
  console.log(JSON.stringify(badgeRequest, null, 2));

  if (!badgeRequest) {
    console.log('❌ Badge request not found');
    await prisma.$disconnect();
    return;
  }

  // If payment reference exists but status is not PAID, fix it
  if (badgeRequest.paymentRef && badgeRequest.paymentStatus !== 'PAID') {
    console.log('\n⚠️  Payment reference exists but paymentStatus is not PAID. Updating...');

    const updated = await (prisma as any).badgeRequest.update({
      where: { id: requestId },
      data: {
        paymentStatus: 'PAID',
        paidAt: badgeRequest.paidAt || new Date(),
        status: badgeRequest.status === 'PENDING' ? 'PAYMENT_RECEIVED' : badgeRequest.status,
      }
    });

    console.log('\n✅ Updated payment status to PAID');
    console.log('New status:', updated.status);
    console.log('Payment status:', updated.paymentStatus);
  } else if (badgeRequest.paymentStatus === 'PAID') {
    console.log('\n✅ Payment status is already PAID - no update needed');
  } else {
    console.log('\n⚠️  No payment reference found - payment may not have been completed');
  }

  await prisma.$disconnect();
}

fixBadgePaymentStatus().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
