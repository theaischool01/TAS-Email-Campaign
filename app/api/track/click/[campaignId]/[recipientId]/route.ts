import { NextRequest, NextResponse } from "next/server"
import { prisma as prismaClient } from "@/app/lib/prisma"
const prisma = prismaClient as any

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string, recipientId: string }> }
) {
  const { campaignId, recipientId } = await params
  const url = request.nextUrl.searchParams.get('url')
  const userAgent = request.headers.get('user-agent') || ''
  const isBot = /bot|google|proxy|scanner|crawl/i.test(userAgent)
  
  if (!url) {
    return NextResponse.json({ error: "Missing redirect URL" }, { status: 400 })
  }

  try {
    // 1. Check if this recipient has ALREADY clicked a link in this campaign
    const existingClick = await prisma.campaignActivityLog.findFirst({
      where: {
        campaignId,
        actorId: recipientId,
        action: 'EMAIL_CLICKED'
      }
    })

    // 2. Record the activity (always)
    await prisma.campaignActivityLog.create({
      data: {
        campaignId,
        action: 'EMAIL_CLICKED',
        actorId: recipientId,
        metadata: {
          url,
          userAgent,
          ip: request.headers.get('x-forwarded-for') || 'unknown',
          isBot
        }
      }
    })

    // 3. Only increment the main counter if it's a NEW, UNIQUE click and NOT a bot
    if (!existingClick && !isBot) {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { totalClicked: { increment: 1 } }
      })
    }

  // Redirect to the original URL
  return NextResponse.redirect(url)
}
