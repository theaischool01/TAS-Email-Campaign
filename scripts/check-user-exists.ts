import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: 'cmpzbvz9w0000tadkyg475wwz' }
  })
  console.log('USER IN DB:', user)
}

main().catch(console.error).finally(() => prisma.$disconnect())
