import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const systemTemplate = await prisma.emailTemplate.findFirst({
    where: { isSystem: true },
    select: { id: true, name: true, createdBy: true }
  })
  console.log('SYSTEM TEMPLATE IN DB:', systemTemplate)

  const campaign = await prisma.campaign.findFirst({
    where: { name: 'batch015' },
    select: {
      id: true,
      name: true,
      template: {
        select: { id: true, name: true, isSystem: true, createdBy: true }
      }
    }
  })
  console.log('CAMPAIGN AND LINKED TEMPLATE:', campaign)
}

main().catch(console.error).finally(() => prisma.$disconnect())
