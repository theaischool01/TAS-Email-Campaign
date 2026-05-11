const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const logs = await prisma.campaignActivityLog.findMany({
      where: { campaignId: 'cmp1iaq5g0026takw0zz75dyw', action: 'EMAIL_OPENED' },
      orderBy: { createdAt: 'desc' }
    });
    console.log('Logs:', JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
