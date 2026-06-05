import { NextRequest, NextResponse } from "next/server"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { isBotUserAgent } from "@/lib/utils/bot-detection"
import logger from "@/lib/logger"
const prisma = prismaClient as any

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string, recipientId: string }> }
) {
  const { campaignId, recipientId } = await params
  const userAgent = request.headers.get('user-agent') || ''
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  
  const isBot = isBotUserAgent(userAgent, ip)
  logger.info(`[OPEN-TRACK] Hit! Campaign: ${campaignId}, Recipient: ${recipientId}, UA: ${userAgent?.substring(0, 80)}, isBot: ${isBot}`);
  
  try {
    // Use a transaction to prevent race conditions
    await prisma.$transaction(async (tx: any) => {
      // 1. Check if a HUMAN (non-bot) has already opened this campaign
      // Note: We use a more direct check for isBot in metadata
      const existingHumanOpen = await tx.campaignActivityLog.findFirst({
        where: {
          campaignId,
          contactId: recipientId,
          action: 'EMAIL_OPENED',
          metadata: {
            path: ['isBot'],
            equals: false
          }
        }
      })

      // 2. Record the activity (Always record, even if it's a bot or repeated)
      await tx.campaignActivityLog.create({
        data: {
          campaignId,
          action: 'EMAIL_OPENED',
          actorId: recipientId,
          contactId: recipientId,
          metadata: {
            userAgent,
            ip,
            isBot,
            isPrefetch: userAgent.includes('GoogleImageProxy'),
            timestamp: new Date().toISOString()
          }
        }
      })

      // 3. Only increment the main counter if it's the FIRST HUMAN open
      if (!isBot && !existingHumanOpen) {
        await tx.campaign.update({
          where: { id: campaignId },
          data: { totalOpened: { increment: 1 } }
        })
        logger.info(`[OPEN-TRACK] ✅ COUNTED open for campaign ${campaignId}, recipient ${recipientId}`)
      } else if (isBot) {
        logger.info(`[OPEN-TRACK] 🤖 Bot open ignored for counter (still logged). Campaign: ${campaignId}`)
      } else {
        logger.info(`[OPEN-TRACK] ♻️ Duplicate human open (already counted). Campaign: ${campaignId}`)
      }
    })
  } catch (error) {
    logger.error({ error }, "Open Tracking Error:")
  }

    // Return a 1x1 transparent GIF
    const transparentGif = Buffer.from(
      "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
      "base64"
    )

    return new NextResponse(transparentGif, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    })
}
