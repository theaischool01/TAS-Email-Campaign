import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const result = await prisma.$queryRaw`SELECT id, name, "createdBy", "templateId" FROM campaigns WHERE name = 'batch015'`
  console.log('CAMPAIGN DB RECORD:', result)
}

main().catch(console.error).finally(() => prisma.$disconnect())
