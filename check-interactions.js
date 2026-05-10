const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const logs = await prisma.campaignActivityLog.findMany({
    where: {
      action: { in: ['EMAIL_OPENED', 'EMAIL_CLICKED'] }
    },
    orderBy: { createdAt: 'desc' },
    take: 10
  })
  console.log('Interaction Logs:', JSON.stringify(logs, null, 2))
  
  const campaigns = await prisma.campaign.findMany({
    where: { 
      OR: [
        { totalOpened: { gt: 0 } },
        { totalClicked: { gt: 0 } }
      ]
    }
  })
  console.log('Campaigns with Interactions:', JSON.stringify(campaigns, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
