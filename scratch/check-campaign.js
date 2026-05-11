const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCampaign() {
  const campaign = await prisma.campaign.findFirst({
    where: { name: 'summer Campaign 3002' },
    include: {
      _count: {
        select: {
          activityLogs: true
        }
      }
    }
  });

  if (!campaign) {
    console.log("Campaign not found");
    return;
  }

  const logs = await prisma.campaignActivityLog.findMany({
    where: { campaignId: campaign.id }
  });

  console.log("--- Campaign Stats ---");
  console.log("ID:", campaign.id);
  console.log("Name:", campaign.name);
  console.log("Status:", campaign.status);
  console.log("Total Sent (Counter):", campaign.totalSent);
  console.log("Recipient Count:", campaign.recipientCount);
  console.log("Activity Logs Count:", logs.length);
  console.log("--- Activity Breakdown ---");
  const breakdown = logs.reduce((acc, log) => {
    acc[log.action] = (acc[log.action] || 0) + 1;
    return acc;
  }, {});
  console.log(breakdown);
}

checkCampaign().finally(() => prisma.$disconnect());
