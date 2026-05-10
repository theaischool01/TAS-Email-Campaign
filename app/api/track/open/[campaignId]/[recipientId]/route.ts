import { NextRequest, NextResponse } from "next/server"
import { prisma as prismaClient } from "@/app/lib/prisma"
const prisma = prismaClient as any

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string, recipientId: string }> }
) {
  const { campaignId, recipientId } = await params
  const userAgent = request.headers.get('user-agent') || ''
  const isBot = /bot|google|proxy|scanner|crawl/i.test(userAgent)
  
  try {
    // 1. Check if this recipient has ALREADY opened this campaign
    const existingOpen = await prisma.campaignActivityLog.findFirst({
      where: {
        campaignId,
        actorId: recipientId,
        action: 'EMAIL_OPENED'
      }
    })

    // 2. Record the activity (always, so we see the history)
    await prisma.campaignActivityLog.create({
      data: {
        campaignId,
        action: 'EMAIL_OPENED',
        actorId: recipientId,
        metadata: {
          userAgent,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          isBot
        }
      }
    })

    // 3. Only increment the main counter if it's a NEW, UNIQUE open and NOT a known bot
    if (!existingOpen && !isBot) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { totalOpened: { increment: 1 } }
      })
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
