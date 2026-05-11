const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const logs = await prisma.campaignActivityLog.findMany({
      where: { action: 'EMAIL_OPENED' },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    console.log('Open Logs:', JSON.stringify(logs, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
