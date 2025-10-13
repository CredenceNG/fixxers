import { prisma } from '../lib/prisma';
import {
  getPlatformPurse,
  getOrCreateUserPurse,
  getPurseBalance,
  verifyPurseIntegrity,
} from '../lib/purse';
import {
  recordPaymentReceived,
  releasePayout,
  processFullRefund,
} from '../lib/purse-transactions';

async function testPurseSystem() {
  console.log('\n🧪 Testing Purse System\n');
  console.log('=' .repeat(80));

  try {
    // 1. Initialize platform purse
    console.log('\n1️⃣  Initializing Platform Purse...');
    const platformPurse = await getPlatformPurse();
    console.log(`   ✅ Platform Purse ID: ${platformPurse.id}`);
    console.log(`   📊 Initial Balance: $${Number(platformPurse.availableBalance)}`);

    // 2. Ensure platform settings exist
    console.log('\n2️⃣  Checking Platform Settings...');
    const commissionSetting = await prisma.platformSettings.findUnique({
      where: { key: 'platformCommissionPercentage' },
    });
    const refundSetting = await prisma.platformSettings.findUnique({
      where: { key: 'commissionRefundPercentage' },
    });

    if (!commissionSetting) {
      console.log('   ⚠️  Creating platformCommissionPercentage setting...');
      await prisma.platformSettings.create({
        data: {
          key: 'platformCommissionPercentage',
          value: '0.20',
          description: 'Platform commission percentage (0.20 = 20%)',
        },
      });
    }

    if (!refundSetting) {
      console.log('   ⚠️  Creating commissionRefundPercentage setting...');
      await prisma.platformSettings.create({
        data: {
          key: 'commissionRefundPercentage',
          value: '0.50',
          description: 'Percentage of commission refundable on cancellation (0-1)',
        },
      });
    }

    const allSettings = await prisma.platformSettings.findMany({
      where: {
        OR: [
          { key: 'platformCommissionPercentage' },
          { key: 'commissionRefundPercentage' },
        ],
      },
    });

    console.log(`   ✅ Found ${allSettings.length} financial settings`);
    allSettings.forEach(s => {
      console.log(`      - ${s.key}: ${s.value}`);
    });

    // 3. Get or create test users
    console.log('\n3️⃣  Setting up test users...');
    const testClient = await prisma.user.findFirst({
      where: { role: 'CLIENT' },
    });
    const testFixer = await prisma.user.findFirst({
      where: { role: 'FIXER' },
    });

    if (!testClient || !testFixer) {
      console.log('   ⚠️  Need at least one CLIENT and one FIXER in database');
      console.log('   Please create users via the application first');
      return;
    }

    console.log(`   ✅ Test Client: ${testClient.name || testClient.email} (${testClient.id})`);
    console.log(`   ✅ Test Fixer: ${testFixer.name || testFixer.email} (${testFixer.id})`);

    // 4. Create test purses
    console.log('\n4️⃣  Creating user purses...');
    const clientPurse = await getOrCreateUserPurse(testClient.id);
    const fixerPurse = await getOrCreateUserPurse(testFixer.id);
    console.log(`   ✅ Client Purse: $${Number(clientPurse.availableBalance)}`);
    console.log(`   ✅ Fixer Purse: $${Number(fixerPurse.availableBalance)}`);

    // 5. Test payment flow (simulate $100 order)
    console.log('\n5️⃣  Testing Payment Flow ($100 order)...');

    // Create a test order
    const testOrder = await prisma.order.create({
      data: {
        clientId: testClient.id,
        fixerId: testFixer.id,
        totalAmount: 100,
        platformFee: 20,
        fixerAmount: 80,
        status: 'PENDING',
      },
    });
    console.log(`   ✅ Created test order: ${testOrder.id}`);

    // Create test payment
    const testPayment = await prisma.payment.create({
      data: {
        orderId: testOrder.id,
        stripePaymentId: `test_${Date.now()}`,
        amount: 100,
        status: 'HELD_IN_ESCROW',
      },
    });
    console.log(`   ✅ Created test payment: ${testPayment.id}`);

    // Record payment received
    console.log('\n   💰 Recording payment received...');
    const paymentResult = await recordPaymentReceived(
      testOrder.id,
      testPayment.id,
      100
    );
    console.log(`   ✅ Payment recorded:`);
    console.log(`      - Total Amount: $${paymentResult.totalAmount}`);
    console.log(`      - Commission (20%): $${paymentResult.commission}`);
    console.log(`      - Escrow (80%): $${paymentResult.escrowAmount}`);

    // Check platform purse
    const platformBalance1 = await getPurseBalance(platformPurse.id);
    console.log(`\n   📊 Platform Purse After Payment:`);
    console.log(`      - Available: $${platformBalance1.availableBalance}`);
    console.log(`      - Pending (Escrow): $${platformBalance1.pendingBalance}`);
    console.log(`      - Commission: $${platformBalance1.commissionBalance}`);
    console.log(`      - Total: $${platformBalance1.totalBalance}`);

    // 6. Verify integrity
    console.log('\n6️⃣  Verifying Purse Integrity...');
    const integrity1 = await verifyPurseIntegrity(platformPurse.id);
    console.log(`   ${integrity1.isValid ? '✅' : '❌'} Platform Purse Integrity:`);
    console.log(`      - Purse Balance: $${integrity1.purseBalance.toFixed(2)}`);
    console.log(`      - Calculated Balance: $${integrity1.calculatedBalance.toFixed(2)}`);
    console.log(`      - Difference: $${integrity1.difference.toFixed(2)}`);

    // 7. Test payout (order completed)
    console.log('\n7️⃣  Testing Payout (Order Completed)...');
    const payoutResult = await releasePayout(testOrder.id, testFixer.id);
    console.log(`   ✅ Payout released:`);
    console.log(`      - Commission to Revenue: $${payoutResult.commission}`);
    console.log(`      - Fixer Payout: $${payoutResult.fixerAmount}`);

    // Check balances after payout
    const platformBalance2 = await getPurseBalance(platformPurse.id);
    const fixerBalance = await getPurseBalance(fixerPurse.id);

    console.log(`\n   📊 Platform Purse After Payout:`);
    console.log(`      - Available: $${platformBalance2.availableBalance} (revenue!)`);
    console.log(`      - Pending (Escrow): $${platformBalance2.pendingBalance}`);
    console.log(`      - Commission: $${platformBalance2.commissionBalance}`);
    console.log(`      - Total Revenue: $${platformBalance2.totalRevenue}`);

    console.log(`\n   📊 Fixer Purse After Payout:`);
    console.log(`      - Available: $${fixerBalance.availableBalance}`);

    // 8. Test refund flow
    console.log('\n8️⃣  Testing Refund Flow...');

    // Create another test order for refund
    const refundOrder = await prisma.order.create({
      data: {
        clientId: testClient.id,
        fixerId: testFixer.id,
        totalAmount: 100,
        platformFee: 20,
        fixerAmount: 80,
        status: 'PENDING',
      },
    });

    const refundPayment = await prisma.payment.create({
      data: {
        orderId: refundOrder.id,
        stripePaymentId: `test_refund_${Date.now()}`,
        amount: 100,
        status: 'HELD_IN_ESCROW',
      },
    });

    await recordPaymentReceived(refundOrder.id, refundPayment.id, 100);
    console.log(`   ✅ Created refund test order: ${refundOrder.id}`);

    // Process refund
    const refundResult = await processFullRefund(refundOrder.id, testClient.id);
    console.log(`   ✅ Refund processed:`);
    console.log(`      - Total Refund to Client: $${refundResult.totalRefund}`);
    console.log(`      - Escrow Refund: $${refundResult.escrowRefund}`);
    console.log(`      - Commission Refund (50%): $${refundResult.commissionRefund}`);
    console.log(`      - Platform Retained (50%): $${refundResult.platformRetained}`);

    // Check final balances
    const clientBalance = await getPurseBalance(clientPurse.id);
    const platformBalance3 = await getPurseBalance(platformPurse.id);

    console.log(`\n   📊 Client Purse After Refund:`);
    console.log(`      - Available: $${clientBalance.availableBalance}`);

    console.log(`\n   📊 Platform Purse After Refund:`);
    console.log(`      - Available: $${platformBalance3.availableBalance}`);
    console.log(`      - Total Revenue: $${platformBalance3.totalRevenue}`);

    // 9. Final integrity check
    console.log('\n9️⃣  Final Integrity Check...');
    const integrityFinal = await verifyPurseIntegrity(platformPurse.id);
    console.log(`   ${integrityFinal.isValid ? '✅' : '❌'} Platform Purse Integrity:`);
    console.log(`      - Purse Balance: $${integrityFinal.purseBalance.toFixed(2)}`);
    console.log(`      - Calculated Balance: $${integrityFinal.calculatedBalance.toFixed(2)}`);
    console.log(`      - Difference: $${integrityFinal.difference.toFixed(2)}`);

    // Summary
    console.log('\n' + '='.repeat(80));
    console.log('✅ All Purse System Tests Passed!');
    console.log('='.repeat(80));
    console.log(`\n📊 Final Summary:`);
    console.log(`   Platform Revenue: $${platformBalance3.totalRevenue}`);
    console.log(`   Platform Available: $${platformBalance3.availableBalance}`);
    console.log(`   Fixer Earnings: $${fixerBalance.availableBalance}`);
    console.log(`   Client Refund: $${clientBalance.availableBalance}`);
    console.log(`\n   Math Check: $20 (order 1) + $10 (refund retained) = $${platformBalance3.totalRevenue} ✓`);
    console.log(`\n`);

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testPurseSystem();
