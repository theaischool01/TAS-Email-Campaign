import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"

const prisma = prismaClient as any

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const allowedActions = [
      "EMAIL_SENT",
      "CAMPAIGN_SENT",
      "SEND_FAILED",
      "CAMPAIGN_FAILED",
      "CAMPAIGN_SCHEDULED",
      "EMAIL_BOUNCED",
      "EMAIL_COMPLAINED",
      "EMAIL_COMPLAINT"
    ]

    const logs = await prisma.campaignActivityLog.findMany({
      where: {
        campaign: {
          createdBy: session.user.id
        },
        action: { in: allowedActions }
      },
      select: {
        id: true,
        action: true,
        createdAt: true,
        campaignId: true,
        campaign: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 20
    })

    const notifications = logs.map((log: any) => {
      let type = "info"
      let message = ""
      const campaignName = log.campaign?.name || "Unknown Campaign"

      switch (log.action) {
        case "EMAIL_SENT":
        case "CAMPAIGN_SENT":
          type = "sent"
          message = `Campaign "${campaignName}" was sent successfully`
          break
        case "SEND_FAILED":
        case "CAMPAIGN_FAILED":
          type = "failed"
          message = `Campaign "${campaignName}" failed to send`
          break
        case "CAMPAIGN_SCHEDULED":
          type = "scheduled"
          message = `Campaign "${campaignName}" has been scheduled`
          break
        case "EMAIL_BOUNCED":
          type = "bounced"
          message = `Email bounced for campaign "${campaignName}"`
          break
        case "EMAIL_COMPLAINED":
        case "EMAIL_COMPLAINT":
          type = "complaint"
          message = `Spam complaint received for campaign "${campaignName}"`
          break
        default:
          message = `Activity recorded for campaign "${campaignName}"`
      }

      return {
        id: log.id,
        type,
        message,
        campaignName,
        campaignId: log.campaignId,
        createdAt: log.createdAt,
        read: false
      }
    })

    return NextResponse.json({
      notifications,
      unreadCount: notifications.length
    })
  } catch (error: any) {
    console.error("Failed to fetch notifications:", error)
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}
