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
  const ip = request.headers.get('x-forwarded-for') || 'unknown'

  console.log(`[TRACK_CLICK] Hit! Campaign: ${campaignId}, Recipient: ${recipientId}, URL: ${url}`)
  console.log(`[TRACK_CLICK] UA: ${userAgent}`)
  console.log(`[TRACK_CLICK] IP: ${ip}`)

  const isBot = /bot|google|proxy|scanner|crawl|facebook|whatsapp|preview/i.test(userAgent)
  
  if (!url) {
    return NextResponse.json({ error: "Missing redirect URL" }, { status: 400 })
  }

  try {
    // 1. Check if this recipient has ALREADY clicked ANY link in this campaign
    const existingClick = await (prisma as any).campaignActivityLog.findFirst({
      where: {
        campaignId,
        contactId: recipientId,
        action: 'EMAIL_CLICKED'
      }
    })

    console.log(`[TRACK_CLICK] Existing Click Found: ${!!existingClick}`)

    // 2. Record the activity
    const activity = await (prisma as any).campaignActivityLog.create({
      data: {
        campaignId,
        action: 'EMAIL_CLICKED',
        actorId: recipientId,
        contactId: recipientId,
        metadata: {
          url,
          userAgent,
          ip,
          isBot
        }
      }
    })
    console.log(`[TRACK_CLICK] Activity Created: ${activity.id}`)

    // 3. Only increment the main counter if it's a NEW, UNIQUE click for this recipient and NOT a bot
    if (!existingClick && !isBot) {
      console.log(`[TRACK_CLICK] Incrementing totalClicked for campaign: ${campaignId}`)
      await (prisma as any).campaign.update({
        where: { id: campaignId },
        data: { totalClicked: { increment: 1 } }
      })
      console.log(`[TRACK_CLICK] Increment successful`)
    } else {
      console.log(`[TRACK_CLICK] Skipping increment. Reason: ${existingClick ? 'Not Unique' : ''} ${isBot ? 'Bot' : ''}`)
    }
    } catch (error) {
      console.error("Click Tracking Error:", error)
    }

    // Redirect to the original URL
    return NextResponse.redirect(url)
  }
