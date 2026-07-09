import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/next-auth"
import { enforceRateLimit, handleRateLimitError } from "@/lib/security/rate-limit"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { CampaignAccessControl } from "@/lib/rbac/campaign-access"
import logger from "@/lib/logger"
import { CampaignLaunchService } from "@/lib/services/campaign-launch-service"

const prisma = prismaClient as any

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params

  try {
    logger.info({ campaignId }, "LAUNCH_API: Request received")

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      await enforceRateLimit("campaignLaunch", `launch:${session.user.id}`)
    } catch (limitErr) {
      const errorRes = handleRateLimitError(limitErr)
      if (errorRes) return errorRes
    }

    // Fetch campaign metadata to verify ownership
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // RBAC check: only owner can launch
    if (!CampaignAccessControl.canLaunchCampaign(session, campaign)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Call CampaignLaunchService
    const result = await CampaignLaunchService.launchCampaign({
      campaignId,
      triggeredBy: "MANUAL",
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to launch campaign" },
        { status: 422 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        status: result.status,
        recipientCount: result.recipientCount,
      },
    })
  } catch (error: any) {
    logger.error({ error, campaignId }, "LAUNCH_API: Critical error")
    return NextResponse.json(
      { error: "Failed to launch campaign", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
