import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { CampaignAccessControl } from "@/lib/rbac/campaign-access"

const prisma = prismaClient as any

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: {
        id: true,
        status: true,
        recipientCount: true,
        totalSent: true,
        totalOpened: true,
        totalClicked: true,
        scheduledAt: true,
        sentAt: true,
        createdBy: true,
        createdAt: true,
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // RBAC check
    if (!CampaignAccessControl.canAccessCampaign(session, campaign.createdBy)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    return NextResponse.json({
      success: true,
      data: campaign
    })

  } catch (error) {
    console.error("❌ GET /api/campaigns/[id]/status error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
