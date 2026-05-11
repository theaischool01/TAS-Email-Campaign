const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkData() {
  try {
    const campaignId = 'cmoyisicr003nta30893d5maw';
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        recipientLists: true,
        recipientSegments: true,
        excludedLists: true
      }
    });

    console.log('Campaign:', campaign ? 'Found' : 'Not Found');
    if (campaign) {
      console.log('Campaign relations:', {
        lists: campaign.recipientLists.length,
        segments: campaign.recipientSegments.length,
        exclusions: campaign.excludedLists.length
      });
    }

    const lists = await prisma.contactList.findMany({ select: { id: true, name: true } });
    const segments = await prisma.segment.findMany({ select: { id: true, name: true } });

    console.log('Available Lists:', lists);
    console.log('Available Segments:', segments);

  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
