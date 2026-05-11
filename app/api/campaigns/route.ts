import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { CampaignAccessControl } from "@/lib/rbac/campaign-access"
import { z } from "zod"

const prisma = prismaClient as any // Temporary workaround for Windows permission issues preventing proper Prisma generation

// Validation schemas - more lenient for drafts
const createCampaignSchema = z.object({
  name: z.string().min(1, "Campaign name is required").max(100, "Campaign name too long").trim(),
  subject: z.string().min(1, "Subject is required").max(200, "Subject too long").trim(),
  previewText: z.string().max(500, "Preview text too long").optional(),
  senderName: z.string().max(100, "Sender name too long").optional(),
  senderEmail: z.string().email("Invalid sender email").optional().or(z.literal("")),
  replyToEmail: z.string().email("Invalid reply-to email").optional().or(z.literal("")),
  templateId: z.string().optional(),
  tags: z.array(z.string()).optional(),
  currentStep: z.number().int().min(1).max(4).optional()
})

const campaignFiltersSchema = z.object({
  search: z.string().optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'PAUSED', 'CANCELLED', 'FAILED']).optional(),
  dateRange: z.object({
    start: z.string().datetime(),
    end: z.string().datetime()
  }).optional(),
  tags: z.array(z.string()).optional(),
  creator: z.string().optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
})

// GET /api/campaigns - List campaigns
export async function GET(request: NextRequest) {
  try {
    console.log("🚀 GET /api/campaigns - Starting request")

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log("❌ No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ Session found:", {
      userId: session.user.id,
      role: session.user.role
    })

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      search: searchParams.get('search') || undefined,
      status: searchParams.get('status') as any || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      creator: searchParams.get('creator') || undefined,
      dateRange: searchParams.get('dateRange') ? JSON.parse(searchParams.get('dateRange')!) : undefined,
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '20')
    }

    console.log("📊 Query params:", queryParams)

    // Validate query parameters
    const validatedParams = campaignFiltersSchema.parse(queryParams)

    // RBAC visibility filter
    const visibilityFilter = CampaignAccessControl.getCampaignVisibilityFilter(session)

    // Build the where clause
    let whereClause: any = { ...visibilityFilter }

    // Add search filter
    if (validatedParams.search) {
      whereClause.OR = [
        { name: { contains: validatedParams.search, mode: 'insensitive' } },
        { subject: { contains: validatedParams.search, mode: 'insensitive' } }
      ]
    }

    // Add status filter
    if (validatedParams.status) {
      whereClause.status = validatedParams.status
    }

    // Add date range filter
    if (validatedParams.dateRange) {
      whereClause.createdAt = {
        gte: new Date(validatedParams.dateRange.start),
        lte: new Date(validatedParams.dateRange.end)
      }
    }

    // Add creator filter
    if (validatedParams.creator) {
      whereClause.createdBy = validatedParams.creator
    }

    // Add tags filter
    if (validatedParams.tags && validatedParams.tags.length > 0) {
      // Tags are stored as a stringified JSON array in the database
      // Since prisma doesn't support array operations on string columns natively for sqlite/basic pg without JSON fields,
      // we'll use a basic string contains for each tag.
      whereClause.AND = [
        ...(whereClause.AND || []),
        ...validatedParams.tags.map(tag => ({
          tags: { contains: tag, mode: 'insensitive' }
        }))
      ]
    }


    // Get campaigns with pagination
    const skip = (validatedParams.page - 1) * validatedParams.limit

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where: whereClause,
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
          },
          _count: {
            select: {
              recipientLists: true,
              excludedLists: true,
              testSends: true,
              activityLogs: true
            }
          }
        },
        orderBy: [
          { createdAt: 'desc' },
          { updatedAt: 'desc' }
        ],
        skip,
        take: validatedParams.limit
      }),
      prisma.campaign.count({ where: whereClause })
    ])


    return NextResponse.json({
      success: true,
      data: {
        campaigns,
        pagination: {
          page: validatedParams.page,
          limit: validatedParams.limit,
          total,
          pages: Math.ceil(total / validatedParams.limit)
        }
      }
    })

  } catch (error) {
    console.error("❌ GET /api/campaigns error:", error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: (error as any).errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// POST /api/campaigns - Create campaign
export async function POST(request: NextRequest) {
  try {
    console.log("🚀 POST /api/campaigns - Starting request")

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      console.log("❌ No session found")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("✅ Session found:", {
      userId: session.user.id,
      role: session.user.role
    })

    // Check if user can create campaigns
    if (!CampaignAccessControl.canCreateCampaign(session)) {
      console.log("❌ User cannot create campaigns:", session.user.role)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    console.log("📝 Request body:", body)

    const validatedData = createCampaignSchema.parse(body)

    // Check for duplicate campaign name
    const existingCampaign = await prisma.campaign.findFirst({
      where: {
        name: validatedData.name,
        createdBy: session.user.id
      }
    })

    if (existingCampaign) {
      console.log("❌ Campaign name already exists:", validatedData.name)
      return NextResponse.json(
        { error: "Campaign with this name already exists" },
        { status: 409 }
      )
    }

    // Normalize tags before creating campaign
    const normalizedData = {
      ...validatedData,
      tags: Array.isArray(validatedData.tags)
        ? JSON.stringify(validatedData.tags)
        : validatedData.tags || null
    }

    try {
      const campaign = await prisma.campaign.create({
        data: {
          name: validatedData.name,
          subject: validatedData.subject,
          previewText: validatedData.previewText || null,
          senderName: validatedData.senderName || null,
          senderEmail: validatedData.senderEmail || null,
          replyToEmail: validatedData.replyToEmail || null,
          templateId: validatedData.templateId || null,
          tags: validatedData.tags && validatedData.tags.length > 0 ? JSON.stringify(validatedData.tags) : null,
          currentStep: validatedData.currentStep || 1,
          createdBy: session.user.id,
          status: 'DRAFT'
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
              thumbnail: true
            }
          }
        }
      })


      // Log activity
      try {
        await prisma.campaignActivityLog.create({
          data: {
            campaignId: campaign.id,
            actorId: session.user.id,
            action: 'CAMPAIGN_CREATED',
            metadata: {
              campaignName: campaign.name,
              timestamp: new Date().toISOString()
            }
          }
        })
        console.log("✅ API DEBUG: Activity logged successfully")
      } catch (logError) {
        console.warn("⚠️ Activity logging failed:", logError)
      }

      return NextResponse.json({
        success: true,
        data: campaign
      }, { status: 201 })

    } catch (createError) {
      console.error("❌ API DEBUG: Campaign creation failed:", createError)
      throw createError
    }

  } catch (error) {
    console.error("❌ POST /api/campaigns error:", error)

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
