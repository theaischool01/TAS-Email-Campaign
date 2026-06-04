import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const result = await prisma.$queryRaw`SELECT id, name, "createdBy", "templateId" FROM campaigns`
  console.log('ALL CAMPAIGNS IN DB:', result)
}

main().catch(console.error).finally(() => prisma.$disconnect())
