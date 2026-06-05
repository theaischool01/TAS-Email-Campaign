import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const logs = await prisma.campaignActivityLog.findMany({
    where: {
      createdAt: {
        gte: new Date(Date.now() - 10 * 60 * 1000) // last 10 minutes
      }
    },
    orderBy: { createdAt: 'asc' }
  })
  console.log('RECENT ACTIVITY LOGS:')
  logs.forEach(l => {
    console.log(`- [${l.createdAt.toISOString()}] ID: ${l.id} Campaign: ${l.campaignId} Action: ${l.action} Actor: ${l.actorId} Contact: ${l.contactId} Metadata: ${JSON.stringify(l.metadata)}`)
  })
}

main().catch(console.error).finally(() => prisma.$disconnect())
