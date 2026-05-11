import { NextRequest, NextResponse } from "next/server"
import { prisma as prismaClient } from "@/app/lib/prisma"
const prisma = prismaClient as any

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string, recipientId: string }> }
) {
  const { campaignId, recipientId } = await params
  const userAgent = request.headers.get('user-agent') || ''
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  
  console.log(`[TRACK_OPEN] Hit! Campaign: ${campaignId}, Recipient: ${recipientId}`)
  console.log(`[TRACK_OPEN] UA: ${userAgent}`)
  console.log(`[TRACK_OPEN] IP: ${ip}`)

  const isBot = /bot|google|proxy|scanner|crawl|facebook|whatsapp|preview/i.test(userAgent) || userAgent.includes('GoogleImageProxy')
  
  try {
    // 1. Check if this recipient has ALREADY opened this campaign
    const existingOpen = await (prisma as any).campaignActivityLog.findFirst({
      where: {
        campaignId,
        contactId: recipientId,
        action: 'EMAIL_OPENED'
      }
    })

    // 2. Record the activity
    await (prisma as any).campaignActivityLog.create({
      data: {
        campaignId,
        action: 'EMAIL_OPENED',
        actorId: recipientId,
        contactId: recipientId,
        metadata: {
          userAgent,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          isBot,
          isPrefetch: userAgent.includes('GoogleImageProxy')
        }
      }
    })

    // 3. Only increment the main counter if it's a NEW, UNIQUE open and NOT a bot/proxy
    if (!existingOpen && !isBot) {
      await (prisma as any).campaign.update({
        where: { id: campaignId },
        data: { totalOpened: { increment: 1 } }
      })
    }
    } catch (error) {
      console.error("Open Tracking Error:", error)
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
