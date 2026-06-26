import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const campaigns = await prisma.campaign.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });

  console.log("=== CAMPAIGNS ===");
  for (const c of campaigns) {
    const deliveries = await prisma.emailDelivery.count({
      where: { campaignId: c.id }
    });
    console.log(`- ${c.name} (${c.id}): status = ${c.status}, deliveries = ${deliveries}`);
  }

  const allDeliveries = await prisma.emailDelivery.groupBy({
    by: ['status'],
    _count: true
  });
  console.log("\n=== ALL EMAIL DELIVERIES ===");
  console.log(allDeliveries);
}

run().catch(console.error).finally(() => prisma.$disconnect());
