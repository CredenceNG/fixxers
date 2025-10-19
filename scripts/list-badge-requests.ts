import { prisma } from "../lib/prisma";

async function listBadgeRequests() {
  try {
    console.log("📋 Fetching all badge requests...\n");

    const requests = await (prisma as any).badgeRequest.findMany({
      include: {
        badge: true,
        fixer: {
          select: {
            email: true,
            phone: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (requests.length === 0) {
      console.log("✅ No badge requests found");
    } else {
      console.log(`Found ${requests.length} badge request(s):\n`);
      requests.forEach((req: any, index: number) => {
        console.log(`${index + 1}. Request ID: ${req.id}`);
        console.log(`   Badge: ${req.badge?.name || "Unknown"}`);
        console.log(
          `   Fixer: ${req.fixer?.email || req.fixer?.phone || "Unknown"}`
        );
        console.log(`   Status: ${req.status}`);
        console.log(`   Payment Status: ${req.paymentStatus}`);
        console.log(`   Created: ${req.createdAt}`);
        console.log(`   Has clientSecret: ${req.clientSecret ? "Yes" : "No"}`);
        console.log("");
      });
    }
  } catch (error) {
    console.error("❌ Error fetching badge requests:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listBadgeRequests();
