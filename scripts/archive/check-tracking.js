const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const campaigns = await prisma.campaign.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  })
  console.log('Campaigns Data:', JSON.stringify(campaigns, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
