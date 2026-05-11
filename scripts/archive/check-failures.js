const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🔍 Checking for Recent Send Failures...');
  const failures = await prisma.campaignActivityLog.findMany({
    where: { action: 'SEND_FAILED' },
    orderBy: { createdAt: 'desc' },
    take: 5
  });

  if (failures.length === 0) {
    console.log('❌ No failure logs found in DB.');
    return;
  }

  failures.forEach(log => {
    console.log(`-----------------------------------`);
    console.log(`📧 Recipient: ${log.metadata.email}`);
    console.log(`❌ Error: ${log.metadata.error}`);
    console.log(`⏰ Time: ${log.createdAt}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
