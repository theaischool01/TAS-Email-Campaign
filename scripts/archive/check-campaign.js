const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const campaign = await prisma.campaign.findUnique({
    where: { id: 'cmoyslz3g000htakozwfawj3n' }
  })
  console.log('Campaign Data:', JSON.stringify(campaign, null, 2))
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
