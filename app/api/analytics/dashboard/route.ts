import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { DashboardService } from "@/lib/services/dashboard.service"

const prisma = prismaClient as any

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parallel execution for better performance
    const [summary, growthTrend, topCampaigns, recentActivity, recentCampaigns] = await Promise.all([
      DashboardService.getStatsSummary(session, prisma),
      DashboardService.getContactGrowthTrend(session, prisma),
      DashboardService.getTopCampaigns(session, prisma),
      DashboardService.getRecentActivity(session, prisma),
      prisma.campaign.findMany({
        where: { 
          createdBy: session.user.id,
          status: { in: ['SENT', 'SENDING', 'SCHEDULED'] }
        },
        select: {
          id: true,
          name: true,
          status: true,
          sentAt: true,
          totalSent: true,
          totalOpened: true,
          totalClicked: true,
          recipientCount: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      })
    ])

    return NextResponse.json({
      success: true,
      data: {
        summary,
        growthTrend,
        topCampaigns,
        recentActivity,
        recentCampaigns
      }
    })
  } catch (error) {
    console.error("📊 Dashboard Analytics Error:", error)
    return NextResponse.json(
      { error: "Failed to fetch dashboard analytics" },
      { status: 500 }
    )
  }
}
