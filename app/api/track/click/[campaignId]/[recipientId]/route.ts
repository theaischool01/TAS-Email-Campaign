import { NextRequest, NextResponse } from "next/server"
import { prisma as prismaClient } from "@/app/lib/prisma"
import logger from "@/lib/logger"
const prisma = prismaClient as any

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string, recipientId: string }> }
) {
  const { campaignId, recipientId } = await params
  const url = request.nextUrl.searchParams.get('url')
  const userAgent = request.headers.get('user-agent') || ''
  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const isBot = /bot|google|proxy|scanner|crawl|facebook|whatsapp|preview/i.test(userAgent)

  if (!url) {
    return NextResponse.json({ error: "Missing redirect URL" }, { status: 400 })
  }

  try {
    // Use a transaction to prevent race conditions
    await prisma.$transaction(async (tx: any) => {
      // 1. Check if a HUMAN (non-bot) has already clicked ANY link in this campaign
      const existingHumanClick = await tx.campaignActivityLog.findFirst({
        where: {
          campaignId,
          contactId: recipientId,
          action: 'EMAIL_CLICKED',
          metadata: {
            path: ['isBot'],
            equals: false
          }
        }
      })

      // 2. Record the activity (Always record)
      await tx.campaignActivityLog.create({
        data: {
          campaignId,
          action: 'EMAIL_CLICKED',
          actorId: recipientId,
          contactId: recipientId,
          metadata: {
            url,
            userAgent,
            ip,
            isBot,
            timestamp: new Date().toISOString()
          }
        }
      })

      // 3. Only increment the main counter if it's the FIRST HUMAN click
      if (!isBot && !existingHumanClick) {
        await tx.campaign.update({
          where: { id: campaignId },
          data: { totalClicked: { increment: 1 } }
        })
      }
    })
  } catch (error) {
    logger.error({ error }, "Click Tracking Error:")
  }

    // Redirect to the original URL
    return NextResponse.redirect(url);
  }
