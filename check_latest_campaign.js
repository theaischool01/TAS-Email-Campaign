const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const campaign = await prisma.campaign.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    console.log('Latest Campaign:', JSON.stringify(campaign, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
