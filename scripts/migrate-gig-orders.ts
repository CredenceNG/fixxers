/**
 * Migration script to move GigOrder data to unified Order table
 *
 * This script:
 * 1. Migrates all GigOrder records to Order table
 * 2. Migrates OrderMessage records to Message table
 * 3. Updates Payment records to reference new Order IDs
 * 4. Updates Gig ordersCount field
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting GigOrder to Order migration...\n');

  try {
    // Step 1: Get all GigOrder records using raw SQL
    const gigOrders: any[] = await prisma.$queryRaw`
      SELECT * FROM "GigOrder"
    `;

    console.log(`Found ${gigOrders.length} GigOrder records to migrate\n`);

    if (gigOrders.length === 0) {
      console.log('No GigOrder records to migrate. Exiting.');
      return;
    }

    // Step 2: Migrate each GigOrder to Order
    for (const gigOrder of gigOrders) {
      console.log(`Migrating GigOrder ${gigOrder.id}...`);

      // Create new Order from GigOrder
      const newOrder = await prisma.order.create({
        data: {
          // Origin - Gig
          gigId: gigOrder.gigId,
          packageId: gigOrder.packageId,

          // Parties
          clientId: gigOrder.buyerId,
          fixerId: gigOrder.sellerId,

          // Financials
          status: gigOrder.status,
          totalAmount: gigOrder.price,
          platformFee: gigOrder.platformFee,
          fixerAmount: gigOrder.sellerEarnings,

          // Workflow
          deliveredAt: gigOrder.deliveredAt,
          deliveryDate: gigOrder.deliveryDate,
          acceptedAt: gigOrder.acceptedAt,

          // Delivery
          deliveryNote: gigOrder.deliveryNote,
          deliveryFiles: gigOrder.deliveryFiles || [],

          // Revisions
          revisionsUsed: gigOrder.revisionsUsed,
          revisionsAllowed: gigOrder.revisionsAllowed,
          revisionRequested: gigOrder.revisionRequested,
          revisionNote: gigOrder.revisionNote,

          // Buyer requirements
          requirementResponses: gigOrder.requirementResponses as any,

          // Inline review
          rating: gigOrder.rating,
          reviewComment: gigOrder.reviewComment,
          reviewedAt: gigOrder.reviewedAt,

          // Timestamps
          createdAt: gigOrder.createdAt,
          updatedAt: gigOrder.updatedAt,
        },
      });

      console.log(`  ✓ Created Order ${newOrder.id}`);

      // Step 3: Migrate OrderMessages to Messages
      const orderMessages: any[] = await prisma.$queryRaw`
        SELECT * FROM "OrderMessage" WHERE "orderId" = ${gigOrder.id}
      `;

      if (orderMessages.length > 0) {
        console.log(`  Migrating ${orderMessages.length} messages...`);

        for (const oldMessage of orderMessages) {
          await prisma.message.create({
            data: {
              orderId: newOrder.id,
              senderId: oldMessage.senderId,
              content: oldMessage.message,
              isRead: oldMessage.isRead,
              createdAt: oldMessage.createdAt,
            },
          });
        }

        console.log(`  ✓ Migrated ${orderMessages.length} messages`);
      }

      // Step 4: Update Payment if exists
      const payment: any[] = await prisma.$queryRaw`
        SELECT * FROM "Payment" WHERE "gigOrderId" = ${gigOrder.id} LIMIT 1
      `;

      if (payment.length > 0) {
        console.log(`  Updating Payment ${payment[0].id}...`);

        await prisma.$executeRaw`
          UPDATE "Payment" SET "orderId" = ${newOrder.id} WHERE id = ${payment[0].id}
        `;

        console.log(`  ✓ Updated Payment to reference Order ${newOrder.id}`);
      }

      console.log(`✓ Successfully migrated GigOrder ${gigOrder.id} → Order ${newOrder.id}\n`);
    }

    // Step 5: Update Gig ordersCount
    console.log('Updating Gig ordersCount fields...');

    const gigs = await prisma.gig.findMany({
      select: { id: true },
    });

    for (const gig of gigs) {
      const count = await prisma.order.count({
        where: { gigId: gig.id },
      });

      await prisma.$executeRaw`
        UPDATE "Gig" SET "ordersCount" = ${count} WHERE id = ${gig.id}
      `;
    }

    console.log(`✓ Updated ordersCount for ${gigs.length} gigs\n`);

    console.log('✅ Migration completed successfully!');
    console.log('\nSummary:');
    console.log(`  - Migrated ${gigOrders.length} GigOrder records to Order table`);
    console.log(`  - Migrated messages to Message table`);
    console.log(`  - Updated Payment records`);
    console.log(`  - Updated Gig ordersCount fields`);
    console.log('\nYou can now run: npx prisma db push --accept-data-loss');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
