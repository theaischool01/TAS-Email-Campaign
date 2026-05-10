import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient() as any

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ campaignId: string, recipientId: string }> }
) {
  const { campaignId, recipientId } = await params
  
  try {
    // Record the open
    // We use a separate activity log for each open
    await prisma.campaignActivityLog.create({
      data: {
        campaignId,
        action: 'EMAIL_OPENED',
        actorId: recipientId, // We use the contactId as actorId here
        metadata: {
          userAgent: request.headers.get('user-agent'),
          ip: request.headers.get('x-forwarded-for') || 'unknown'
        }
      }
    })

    // Increment totalOpened in campaign
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { totalOpened: { increment: 1 } }
    })

  } catch (error) {
    console.error("Tracking Error (Open):", error)
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
