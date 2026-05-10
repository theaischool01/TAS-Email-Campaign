import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/next-auth"
import { PrismaClient } from "@prisma/client"
import { CampaignAccessControl } from "@/lib/rbac/campaign-access"
import { z } from "zod"

const prisma = new PrismaClient() as any // Temporary workaround for Windows permission issues preventing proper Prisma generation

// Validation schemas
const updateCampaignSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  subject: z.string().min(1).max(200).optional(),
  previewText: z.string().max(500).optional(),
  senderName: z.string().max(100).optional(),
  // Allow empty string so autosave doesn't reject partially-filled forms
  senderEmail: z.string().email("Invalid sender email").optional().or(z.literal("")),
  replyToEmail: z.string().email("Invalid reply-to email").optional().or(z.literal("")),
  templateId: z.string().optional(),
  tags: z.union([
    z.array(z.string()),
    z.string()
  ]).optional(),
  currentStep: z.number().int().min(1).max(4).optional()
})

const testSendSchema = z.object({
  emails: z.array(z.string().email()).min(1).max(5, "Maximum 5 email addresses allowed")
})

const scheduleSchema = z.object({
  scheduledAt: z.string().datetime(),
  timezone: z.string().min(1)
})

// GET /api/campaigns/[id] - Get single campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params
  try {
    console.log("🚀 GET /api/campaigns/[id] - Starting request")
    
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

    // Get campaign with RBAC filter
    const visibilityFilter = CampaignAccessControl.getCampaignVisibilityFilter(session)
    
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: campaignId,
        ...visibilityFilter
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        template: {
          select: {
            id: true,
            name: true,
            thumbnail: true,
            html: true,
            json: true
          }
        },
        recipientLists: {
          include: {
            contactList: {
              include: {
                _count: {
                  select: {
                    members: true
                  }
                }
              }
            }
          }
        },
        excludedLists: {
          include: {
            contactList: {
              include: {
                _count: {
                  select: {
                    members: true
                  }
                }
              }
            }
          }
        },
        testSends: {
          orderBy: {
            sentAt: 'desc'
          },
          take: 10
        },
        activityLogs: {
          orderBy: {
            createdAt: 'desc'
          },
          take: 20
        }
      }
    })

    if (!campaign) {
      console.log("❌ Campaign not found or access denied")
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    console.log("✅ Campaign found:", campaign.name)

    return NextResponse.json({ 
      success: true,
      data: { campaign }
    })

  } catch (error) {
    console.error("❌ GET /api/campaigns/[id] error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT /api/campaigns/[id] - Update campaign
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params
  try {
    console.log("🚀 PUT /api/campaigns/[id] - Starting request")
    
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

    // Get existing campaign
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (!existingCampaign) {
      console.log("❌ Campaign not found")
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Check edit permissions
    if (!CampaignAccessControl.canEditCampaign(session, existingCampaign)) {
      console.log("ℹ️ Campaign is not in DRAFT status, skipping autosave update:", campaignId)
      // Return success but with a flag indicating it was skipped - this prevents autosave errors in the UI
      return NextResponse.json({ 
        success: true, 
        data: { campaign: existingCampaign },
        skipped: true,
        message: "Autosave skipped as campaign is no longer in draft mode"
      })
    }

    // Check if campaign is in editable state
    if (existingCampaign.status !== 'DRAFT') {
      console.log("❌ Campaign cannot be edited:", existingCampaign.status)
      return NextResponse.json(
        { error: "Only draft campaigns can be edited" },
        { status: 409 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    console.log("📝 Request body:", body)

    const validatedData = updateCampaignSchema.parse(body)
    console.log("✅ Validated data:", validatedData)

    // Check for duplicate campaign name (if name is being updated)
    if (validatedData.name && validatedData.name !== existingCampaign.name) {
      const duplicateCampaign = await prisma.campaign.findFirst({
        where: {
          name: validatedData.name,
          createdBy: session.user.id,
          id: { not: campaignId }
        }
      })

      if (duplicateCampaign) {
        console.log("❌ Campaign name already exists:", validatedData.name)
        return NextResponse.json(
          { error: "Campaign with this name already exists" },
          { status: 409 }
        )
      }
    }

    // Normalize tags: always store as JSON string or null
    const normalizedTags = Array.isArray(validatedData.tags)
      ? JSON.stringify(validatedData.tags)
      : typeof validatedData.tags === 'string'
        ? validatedData.tags
        : null

    // Build update payload — only include fields that are actually present in the request.
    // Deliberately omit empty-string email fields so we never overwrite a stored email with "".
    const updatePayload: Record<string, any> = { updatedAt: new Date() }

    if (validatedData.name !== undefined) updatePayload.name = validatedData.name
    if (validatedData.subject !== undefined) updatePayload.subject = validatedData.subject
    if (validatedData.previewText !== undefined) updatePayload.previewText = validatedData.previewText || null
    if (validatedData.senderName !== undefined) updatePayload.senderName = validatedData.senderName || null
    // Only persist email fields when they contain a valid non-empty value
    if (validatedData.senderEmail !== undefined && validatedData.senderEmail !== '')
      updatePayload.senderEmail = validatedData.senderEmail
    if (validatedData.replyToEmail !== undefined && validatedData.replyToEmail !== '')
      updatePayload.replyToEmail = validatedData.replyToEmail
    if (validatedData.templateId !== undefined) updatePayload.templateId = validatedData.templateId || null
    if (validatedData.currentStep !== undefined) updatePayload.currentStep = validatedData.currentStep
    if (validatedData.tags !== undefined) updatePayload.tags = normalizedTags

    console.log("🔧 CAMPAIGN UPDATE: Starting update", {
      campaignId,
      updateFields: Object.keys(updatePayload),
      tagsType: Array.isArray(validatedData.tags) ? 'array' : typeof validatedData.tags
    })

    // Update campaign
    let campaign
    try {
      campaign = await prisma.campaign.update({
        where: { id: campaignId },
        data: updatePayload,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          template: {
            select: {
              id: true,
              name: true,
              thumbnail: true
            }
          }
        }
      })
    } catch (error) {
      console.error("❌ Prisma UPDATE ERROR:", error)
      return NextResponse.json(
        { error: `Database error: ${String(error)}` },
        { status: 500 }
      )
    }

    console.log("✅ Campaign updated successfully:", {
      id: campaign.id,
      name: campaign.name,
      currentStep: campaign.currentStep,
      templateId: campaign.templateId,
      updatedAt: campaign.updatedAt
    })

    // Log activity
    await prisma.campaignActivityLog.create({
      data: {
        campaignId: campaign.id,
        actorId: session.user.id,
        action: 'CAMPAIGN_UPDATED',
        metadata: {
          updatedFields: Object.keys(validatedData),
          timestamp: new Date().toISOString()
        }
      }
    })

    console.log("✅ Activity logged")

    return NextResponse.json({ campaign })

  } catch (error) {
    console.error("❌ PUT /api/campaigns/[id] error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: (error as any).errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE /api/campaigns/[id] - Delete campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params
  try {
    console.log("🚀 DELETE /api/campaigns/[id] - Starting request")
    
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

    // Get existing campaign
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (!existingCampaign) {
      console.log("❌ Campaign not found")
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Check delete permissions
    if (!CampaignAccessControl.canDeleteCampaign(session, existingCampaign)) {
      console.log("❌ User cannot delete campaign:", campaignId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Check if campaign can be deleted
    const isSuperAdmin = session.user.role === 'SUPER_ADMIN'
    const isFinished = existingCampaign.totalSent >= existingCampaign.recipientCount
    
    if (existingCampaign.status === 'SENDING' && !isFinished && !isSuperAdmin) {
      console.log("❌ Campaign cannot be deleted while active sending")
      return NextResponse.json(
        { error: "Cannot delete campaign while it is actively being sent. Please pause or cancel it first, or wait for it to finish." },
        { status: 409 }
      )
    }

    // Delete campaign (cascade will handle related records)
    await prisma.campaign.delete({
      where: { id: campaignId }
    })

    console.log("✅ Campaign deleted:", campaignId)

    return NextResponse.json({ 
      message: "Campaign deleted successfully" 
    })

  } catch (error) {
    console.error("❌ DELETE /api/campaigns/[id] error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/campaigns/[id]/schedule - Schedule campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params
  const session = await getServerSession(authOptions)
  
  if (!session?.user) {
    console.log("❌ No session found for schedule")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const body = await request.json()
    console.log("🚀 SCHEDULE /api/campaigns/[id] - Starting request", {
      campaignId,
      body,
      userId: session.user.id
    })

    const { scheduledAt, timezone } = scheduleSchema.parse(body)
    
    // Get existing campaign
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId }
    })

    if (!existingCampaign) {
      console.log("❌ Campaign not found for schedule")
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // Check permissions
    if (!CampaignAccessControl.canLaunchCampaign(session, existingCampaign)) {
      console.log("❌ User cannot launch campaign:", campaignId)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Update campaign status to SCHEDULED
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'SCHEDULED',
        scheduledAt: new Date(scheduledAt),
        timezone: timezone,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // Log activity
    await prisma.campaignActivityLog.create({
      data: {
        campaignId,
        action: 'CAMPAIGN_SCHEDULED',
        actorId: session.user.id,
        metadata: {
          scheduledAt,
          timezone,
          updatedFields: ['status', 'scheduledAt', 'timezone']
        }
      }
    })

    console.log("✅ Campaign scheduled successfully:", {
      campaignId,
      scheduledAt,
      status: 'SCHEDULED'
    })

    return NextResponse.json({ 
      success: true,
      data: {
        campaign: updatedCampaign
      }
    })

  } catch (error) {
    console.error("❌ SCHEDULE /api/campaigns/[id] error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request data", details: (error as any).errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
