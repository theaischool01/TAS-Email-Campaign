const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testUpdate() {
  try {
    const campaignId = 'cmoyisicr003nta30893d5maw'; // User's campaign ID

    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    });

    if (!existingCampaign) {
      console.error('Campaign not found in DB!');
      return;
    }

    // Try doing what the route does
    const validListIds = ['cmovwt1vo0001talsymt147vj']; // Using the testlist id we found earlier
    const validSegmentIds = [];
    const validExcludedIds = [];

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        recipientLists: {
          deleteMany: {},
          create: validListIds.map(listId => ({
            contactListId: listId
          }))
        },
        recipientSegments: {
          deleteMany: {},
          create: validSegmentIds.map(segmentId => ({
            segmentId: segmentId
          }))
        },
        excludedLists: {
          deleteMany: {},
          create: validExcludedIds.map(listId => ({
            contactListId: listId
          }))
        }
      }
    });

    console.log('Update successful!');
  } catch (err) {
    console.error('Error during update:', err);
  } finally {
    await prisma.$disconnect();
  }
}

testUpdate();
