import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { CampaignService } from "@/lib/services/campaign.service"

const prisma = prismaClient as any

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const data = await CampaignService.getCampaignReportData(session, prisma, id)

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error(`📊 Campaign Report Error [${error.message}]:`, error)
    if (error.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    if (error.message === "Campaign not found") {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }
    return NextResponse.json(
      { error: "Failed to fetch campaign analytics" },
      { status: 500 }
    )
  }
}
