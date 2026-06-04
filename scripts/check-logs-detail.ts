import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const logs = await prisma.campaignActivityLog.findMany({
    orderBy: { createdAt: 'asc' }
  })
  console.log('ALL ACTIVITY LOGS:')
  logs.forEach(l => {
    console.log(`- [${l.createdAt.toISOString()}] ID: ${l.id} Campaign: ${l.campaignId} Action: ${l.action} Actor: ${l.actorId} Contact: ${l.contactId} Metadata: ${JSON.stringify(l.metadata)}`)
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
