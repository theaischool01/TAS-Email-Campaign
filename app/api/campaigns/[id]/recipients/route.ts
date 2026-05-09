import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/next-auth"
import { prisma } from "@/app/lib/prisma"
import { z } from "zod"

const recipientsSchema = z.object({
  recipientListIds: z.array(z.string()).min(1, "Please select at least one contact list"),
  excludedListIds: z.array(z.string()).optional()
})

// PUT /api/campaigns/[id]/recipients - Update campaign recipients
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params
  try {
    console.log("🚀 PUT /api/campaigns/[id]/recipients - Starting request")
    
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log("❌ No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ Session found:", { 
      userId: session.user.id, 
      role: session.user.role 
    })

    console.log("📋 Campaign ID:", campaignId)

    // Parse and validate request body
    const body = await request.json()
    console.log("📝 Request body:", body)

    const validatedData = recipientsSchema.parse(body)
    console.log("✅ Validated data:", validatedData)

    // Check if campaign exists and user has permission
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (!existingCampaign) {
      console.log("❌ Campaign not found")
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Check edit permissions
    if (existingCampaign.createdBy !== session.user.id) {
      console.log("❌ User cannot edit campaign:", campaignId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Delete existing recipient associations
    await prisma.campaignRecipientList.deleteMany({
      where: { campaignId }
    })

    // Create new recipient associations
    const recipientData = validatedData.recipientListIds.map(listId => ({
      campaignId,
      contactListId: listId
    }))

    await prisma.campaignRecipientList.createMany({
      data: recipientData
    })

    console.log("✅ Recipients saved successfully:", {
      campaignId,
      recipientCount: recipientData.length,
      excludedCount: validatedData.excludedListIds?.length || 0
    })

    return NextResponse.json({ 
      success: true,
      data: {
        message: "Recipients saved successfully",
        recipientCount: recipientData.length
      }
    })

  } catch (error) {
    console.error("❌ PUT /api/campaigns/[id]/recipients error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: (error as any).errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
