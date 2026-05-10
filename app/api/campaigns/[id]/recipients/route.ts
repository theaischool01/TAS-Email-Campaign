import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { z } from "zod"
import { CampaignAccessControl } from "@/lib/rbac/campaign-access"

const prisma = prismaClient as any

const recipientsSchema = z.object({
  recipientListIds: z.array(z.string()).optional(),
  recipientSegmentIds: z.array(z.string()).optional(),
  excludedListIds: z.array(z.string()).optional()
}).refine(data => (data.recipientListIds?.length || 0) + (data.recipientSegmentIds?.length || 0) >= 0, {
  message: "Invalid recipient data"
})

// PUT /api/campaigns/[id]/recipients - Update campaign recipients
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    
    // Parse and validate request body
    const body = await request.json()
    const validatedData = recipientsSchema.parse(body)

    // Check if campaign exists and user has permission
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (!existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Check edit permissions using central RBAC
    if (!CampaignAccessControl.canEditCampaign(session, existingCampaign)) {
      console.log("ℹ️ Campaign is not in DRAFT status, skipping recipients update:", campaignId)
      return NextResponse.json({ 
        success: true, 
        skipped: true,
        message: "Recipients update skipped as campaign is no longer in draft mode" 
      })
    }

    // Verify that the provided IDs actually exist in the database to prevent foreign key errors (P2003)
    let validListIds: string[] = []
    let validSegmentIds: string[] = []
    let validExcludedIds: string[] = []

    if (validatedData.recipientListIds && validatedData.recipientListIds.length > 0) {
      const existingLists = await prisma.contactList.findMany({
        where: { id: { in: validatedData.recipientListIds } },
        select: { id: true }
      })
      validListIds = Array.from(new Set(existingLists.map((l: any) => l.id)))
    }

    if (validatedData.recipientSegmentIds && validatedData.recipientSegmentIds.length > 0) {
      const existingSegments = await prisma.segment.findMany({
        where: { id: { in: validatedData.recipientSegmentIds } },
        select: { id: true }
      })
      validSegmentIds = Array.from(new Set(existingSegments.map((s: any) => s.id)))
    }

    if (validatedData.excludedListIds && validatedData.excludedListIds.length > 0) {
      const existingExcluded = await prisma.contactList.findMany({
        where: { id: { in: validatedData.excludedListIds } },
        select: { id: true }
      })
      validExcludedIds = Array.from(new Set(existingExcluded.map((l: any) => l.id)))
    }

    // Update campaign relations using an atomic nested update
    // This is more robust than a separate delete/create transaction
    await (prisma as any).campaign.update({
      where: { id: campaignId },
      data: {
        recipientLists: {
          deleteMany: {},
          create: validListIds.map(listId => ({
            contactListId: listId
          }))
        },
        recipientSegments: {
          deleteMany: {},
          create: validSegmentIds.map(segmentId => ({
            segmentId: segmentId
          }))
        },
        excludedLists: {
          deleteMany: {},
          create: validExcludedIds.map(listId => ({
            contactListId: listId
          }))
        },
        updatedAt: new Date()
      }
    })

    console.log("✅ Recipients saved successfully for campaign:", campaignId)

    return NextResponse.json({ 
      success: true,
      data: {
        message: "Recipients saved successfully",
        listCount: validatedData.recipientListIds?.length || 0,
        segmentCount: validatedData.recipientSegmentIds?.length || 0
      }
    })

  } catch (error) {
    console.error("❌ PUT /api/campaigns/[id]/recipients error:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
      try {
        const fs = require('fs')
        fs.writeFileSync('last_error_recipients.txt', error.stack || error.message)
      } catch (e) {}
    }
    
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
