import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/next-auth"
import { PrismaClient } from "@prisma/client"
import { CampaignAccessControl } from "@/lib/rbac/campaign-access"

const prisma = new PrismaClient() as any

export async function POST(
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
      where: { id: campaignId }
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    if (!CampaignAccessControl.canLaunchCampaign(session, campaign)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    if (campaign.status !== 'PAUSED') {
      return NextResponse.json({ error: "Only campaigns in PAUSED status can be resumed" }, { status: 400 })
    }

    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'SENDING' }
    })

    await prisma.campaignActivityLog.create({
      data: {
        campaignId,
        actorId: session.user.id,
        action: "CAMPAIGN_RESUMED",
      },
    })

    return NextResponse.json({ success: true, status: 'SENDING' })

  } catch (error) {
    console.error("❌ POST /api/campaigns/[id]/resume error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
