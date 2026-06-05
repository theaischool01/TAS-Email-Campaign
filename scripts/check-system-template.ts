import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const result = await prisma.emailTemplate.deleteMany({
    where: {
      createdBy: 'cmpzoz5px0000ta0gtlvgs0gj',
      isSystem: false
    }
  })
  console.log('Deleted cloned templates for Deepak:', result)
}

main().catch(console.error).finally(() => prisma.$disconnect())
