import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const campaign = await prisma.campaign.findUnique({
    where: { id: 'cmpzeka8c002vta48qb1joib8' }
  })
  if (!campaign) {
    console.error('No campaign found')
    return
  }
  console.log('CAMPAIGN STATUS:', {
    id: campaign.id,
    name: campaign.name,
    status: campaign.status,
    recipientCount: campaign.recipientCount,
    totalSent: campaign.totalSent,
    totalFailed: campaign.totalFailed
  })

  const logs = await prisma.campaignActivityLog.findMany({
    where: { campaignId: campaign.id },
    select: { action: true, actorId: true, metadata: true }
  })
  console.log('ACTIVITY LOGS COUNT:', logs.length)
  console.log('ACTIVITY LOGS BY ACTION:', logs.reduce((acc: any, log: any) => {
    acc[log.action] = (acc[log.action] || 0) + 1
    return acc
  }, {}))
}

main().catch(console.error).finally(() => prisma.$disconnect())
