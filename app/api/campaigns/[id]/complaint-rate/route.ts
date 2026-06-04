import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"
import logger from "@/lib/logger"

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
        name: true,
        status: true,
        totalSent: true,
        totalComplained: true,
        createdBy: true,
      },
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Only owner can view
    if (campaign.createdBy !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const totalSent = campaign.totalSent || 0
    const totalComplained = campaign.totalComplained || 0

    const complaintRate = totalSent > 0
      ? totalComplained / totalSent
      : 0

    const complaintRatePercent = (complaintRate * 100).toFixed(3)

    // Thresholds matching webhook logic
    let level: "ok" | "warning" | "critical" = "ok"
    if (complaintRate >= 0.005) {
      level = "critical"   // 0.5% — campaign was auto-paused
    } else if (complaintRate >= 0.001) {
      level = "warning"    // 0.1% — warning threshold
    }

    logger.info(
      { campaignId, complaintRate, level },
      "Complaint rate queried"
    )

    return NextResponse.json({
      campaignId,
      campaignName: campaign.name,
      status: campaign.status,
      totalSent,
      totalComplained,
      complaintRate,
      complaintRatePercent: complaintRatePercent + "%",
      level,
      thresholds: {
        warning: "0.1% (0.001)",
        critical: "0.5% (0.005)",
      },
    })
  } catch (error) {
    logger.error({ error }, "Failed to fetch complaint rate")
    return NextResponse.json(
      { error: "Failed to fetch complaint rate" },
      { status: 500 }
    )
  }
}
