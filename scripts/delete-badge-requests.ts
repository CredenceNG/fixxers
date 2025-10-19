import { prisma } from "../lib/prisma";

async function deleteAllBadgeRequests() {
  try {
    console.log("🗑️  Deleting all badge requests...");

    const result = await (prisma as any).badgeRequest.deleteMany({});

    console.log(`✅ Successfully deleted ${result.count} badge request(s)`);
  } catch (error) {
    console.error("❌ Error deleting badge requests:", error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllBadgeRequests();
