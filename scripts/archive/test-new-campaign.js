const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testNewCampaign() {
  try {
    // Create a new campaign
    const campaign = await prisma.campaign.create({
      data: {
        name: 'Test Campaign ' + Date.now(),
        subject: 'Test Subject',
        createdBy: 'cmovws7z70000talssx5o0er3',
        status: 'DRAFT'
      }
    });

    console.log('Created campaign:', campaign.id);

    // Try to update recipients with invalid IDs (simulating frontend)
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        recipientLists: {
          deleteMany: {},
          create: [{ contactListId: 'invalid-id' }]
        }
      }
    });
    console.log('Update succeeded with invalid ID! Wait, that should not happen if my API route fixes it.');
  } catch (error) {
    console.error('Update failed. That means Prisma still throws P2003 if invalid ID is passed.', error.code);
  } finally {
    await prisma.$disconnect();
  }
}

testNewCampaign();
