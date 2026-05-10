const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const campaigns = await prisma.campaign.findMany({
    select: { id: true, name: true, status: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  })
  console.log('All Campaigns:', JSON.stringify(campaigns, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
