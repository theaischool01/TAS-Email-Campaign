const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const campaigns = await prisma.campaign.findMany({
    where: { name: { contains: '2059' } }
  })
  console.log('Campaigns found:', JSON.stringify(campaigns, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
