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
      where: { id: campaignId },
      select: { id: true, status: true, createdBy: true }
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // RBAC check
    if (!CampaignAccessControl.canEditCampaign(session, campaign)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Can only cancel if it hasn't started sending yet (SCHEDULED, PAUSED, FAILED)
    if (!['SCHEDULED', 'PAUSED', 'FAILED'].includes(campaign.status)) {
      let reason = ""
      if (campaign.status === 'SENDING') reason = "The campaign has already started sending. Please pause it first if you wish to stop delivery."
      if (campaign.status === 'SENT') reason = "The campaign has already been completed."
      if (campaign.status === 'DRAFT') reason = "Draft campaigns cannot be cancelled, only deleted."
      
      return NextResponse.json(
        { error: reason || `Cannot cancel a campaign in ${campaign.status} status.` },
        { status: 400 }
      )
    }

    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: "CANCELLED" }
    })

    await prisma.campaignActivityLog.create({
      data: {
        campaignId,
        actorId: session.user.id,
        action: "CAMPAIGN_CANCELLED",
        metadata: { cancelledAt: new Date().toISOString() }
      }
    })

    return NextResponse.json({
      success: true,
      message: "Campaign cancelled successfully",
      data: updatedCampaign
    })

  } catch (error) {
    console.error("❌ POST /api/campaigns/[id]/cancel error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
