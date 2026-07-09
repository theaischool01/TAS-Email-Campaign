import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { CampaignService } from "@/lib/services/campaign.service"

const prisma = prismaClient as any

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const newCampaign = await CampaignService.duplicateForNonOpeners(session, prisma, id)

    return NextResponse.json({
      success: true,
      message: "Re-send campaign created as draft",
      data: newCampaign
    })
  } catch (error: any) {
    console.error("POST /api/campaigns/[id]/resend error:", error)
    return NextResponse.json(
      { error: error.message || "Failed to create re-send campaign" },
      { status: 500 }
    )
  }
}
