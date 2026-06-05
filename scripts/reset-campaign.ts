import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
  const campaign = await prisma.campaign.findFirst({
    where: { name: 'batch015' }
  })
  if (!campaign) {
    console.error('Campaign batch015 not found')
    return
  }

  // Delete activity logs for this campaign
  await prisma.campaignActivityLog.deleteMany({
    where: { campaignId: campaign.id }
  })

  // Reset campaign status to SCHEDULED and set scheduledAt to a past time
  const updated = await prisma.campaign.update({
    where: { id: campaign.id },
    data: {
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() - 10 * 1000), // 10 seconds ago
      totalSent: 0,
      totalFailed: 0,
      recipientCount: 0
    }
  })

  console.log('Campaign reset successfully:', updated)
}

main().catch(console.error).finally(() => prisma.$disconnect())
