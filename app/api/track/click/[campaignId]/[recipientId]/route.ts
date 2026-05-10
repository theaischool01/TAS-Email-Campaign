import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient() as any

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string, recipientId: string }> }
) {
  const { campaignId, recipientId } = await params
  const url = request.nextUrl.searchParams.get('url')
  
  if (!url) {
    return NextResponse.json({ error: "Missing redirect URL" }, { status: 400 })
  }

  try {
    // Record the click
    await prisma.campaignActivityLog.create({
      data: {
        campaignId,
        action: 'EMAIL_CLICKED',
        actorId: recipientId,
        metadata: {
          url,
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        }
      }
    })

    // Increment totalClicked in campaign
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { totalClicked: { increment: 1 } }
    })

  } catch (error) {
    console.error("Tracking Error (Click):", error)
  }

  // Redirect to the original URL
  return NextResponse.redirect(url)
}
