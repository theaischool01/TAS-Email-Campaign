import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function run() {
  const campaignId = "cmqrmj5f30002tap0clz1em7w"; // Yesterday's campaign
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId }
  });

  if (!campaign) {
    console.error("Campaign not found");
    return;
  }

  const total = await prisma.emailDelivery.count({
    where: { campaignId }
  });

  const statuses = await prisma.emailDelivery.groupBy({
    by: ['status'],
    where: { campaignId },
    _count: true
  });

  console.log(`Campaign: "${campaign.name}" (${campaign.id})`);
  console.log(`Status: ${campaign.status}`);
  console.log(`Total EmailDelivery records: ${total}`);
  console.log("Statuses count:");
  console.log(statuses);

  // Get some failed samples
  const failures = await prisma.emailDelivery.findMany({
    where: { campaignId, status: 'FAILED' },
    take: 5
  });
  if (failures.length > 0) {
    console.log("\nSample Failures:");
    console.log(failures);
  }
}

run().catch(console.error).finally(() => prisma.$disconnect());
