import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const result = await prisma.campaign.findUnique({
    where: { id: 'cmpzeka8c002vta48qb1joib8' },
    select: {
      id: true,
      name: true,
      status: true,
      senderEmail: true,
      senderName: true,
      subject: true,
      totalSent: true,
      totalFailed: true,
      recipientCount: true,
      template: {
        select: {
          html: true
        }
      }
    }
  });
  console.log('CAMPAIGN AND TEMPLATE VIA PRISMA:', result)
}

main().catch(console.error).finally(() => prisma.$disconnect())
