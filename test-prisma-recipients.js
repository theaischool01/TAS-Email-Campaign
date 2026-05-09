const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function test() {
  try {
    const campaign = await prisma.campaign.findFirst();
    if (!campaign) {
      console.log('No campaigns found.');
      return;
    }

    const campaignId = campaign.id;
    console.log('Testing update on campaign:', campaignId);

    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        recipientLists: {
          deleteMany: {},
          create: [{ contactListId: 'fake-id' }]
        }
      }
    });

    console.log('Success! No error thrown.');
  } catch (error) {
    console.error('Error thrown:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
