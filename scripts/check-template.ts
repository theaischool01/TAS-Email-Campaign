import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const template = await prisma.emailTemplate.findUnique({
    where: { id: 'cmqz5qo0z005otaywmsn7zgeu' }
  })
  console.log('SPECIFIC TEMPLATE BY ID:', template)
}

main().catch(console.error).finally(() => prisma.$disconnect())
