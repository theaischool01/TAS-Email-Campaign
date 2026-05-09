import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/next-auth"
import { PrismaClient } from "@prisma/client"
import { CampaignAccessControl } from "@/lib/rbac/campaign-access"
import { z } from "zod"

const prisma = new PrismaClient() as any

const scheduleSchema = z.object({
  scheduledAt: z.string().datetime("Invalid date format"),
  timezone: z.string().min(1, "Timezone is required")
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: campaignId } = await params
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        recipientLists: true,
        recipientSegments: {
          include: {
            segment: true
          }
        },
        excludedLists: true
      }
    })

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // RBAC: Check if user can launch/schedule campaign
    if (!CampaignAccessControl.canLaunchCampaign(session, campaign)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Must be draft to schedule
    if (campaign.status !== 'DRAFT') {
      return NextResponse.json(
        { error: "Only draft campaigns can be scheduled" },
        { status: 400 }
      )
    }

    // Must have at least one recipient list or segment
    if (
      (!campaign.recipientLists || campaign.recipientLists.length === 0) &&
      (!campaign.recipientSegments || campaign.recipientSegments.length === 0)
    ) {
      return NextResponse.json(
        { error: "Campaign must have at least one recipient list or segment before scheduling" },
        { status: 422 }
      )
    }

    const body = await request.json()
    console.log("🕒 SCHEDULE API: Received body:", body)
    
    const validatedData = scheduleSchema.parse(body)
    console.log("🕒 SCHEDULE API: Validated data:", validatedData)
    
    const scheduleDate = new Date(validatedData.scheduledAt)
    const now = new Date()
    
    console.log("🕒 SCHEDULE API: Comparing times", { 
      scheduled: scheduleDate.toISOString(), 
      now: now.toISOString(),
      isFuture: scheduleDate > now 
    })

    if (scheduleDate <= now) {
      return NextResponse.json(
        { error: `Scheduled time must be in the future. Scheduled: ${scheduleDate.toISOString()}, Now: ${now.toISOString()}` },
        { status: 400 }
      )
    }

    // Build the query conditions
    const segmentConditions = (campaign.recipientSegments || []).flatMap((rs: any) => {
      const criteria = rs.segment.criteria as any
      if (criteria?.tags && Array.isArray(criteria.tags)) {
        return criteria.tags.map((tag: string) => ({
          tags: { contains: tag }
        }))
      }
      return []
    })

    // Calculate real recipient count (Unique Active Contacts only)
    const activeContactsCount = await prisma.contact.count({
      where: {
        status: "ACTIVE",
        OR: [
          // Contacts in selected lists
          {
            lists: {
              some: {
                contactListId: {
                  in: campaign.recipientLists.map((rl: any) => rl.contactListId)
                }
              }
            }
          },
          // Contacts matching segments
          ...segmentConditions
        ],
        // Exclude contacts in excluded lists
        ...(campaign.excludedLists && campaign.excludedLists.length > 0 && {
          NOT: {
            lists: {
              some: {
                contactListId: {
                  in: campaign.excludedLists.map((el: any) => el.contactListId)
                }
              }
            }
          }
        })
      }
    })

    const totalContacts = activeContactsCount

    // Update campaign to SCHEDULED
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'SCHEDULED',
        scheduledAt: scheduleDate,
        timezone: validatedData.timezone,
        recipientCount: totalContacts
      }
    })

    // Log the activity
    await prisma.campaignActivityLog.create({
      data: {
        campaignId,
        actorId: session.user.id,
        action: 'SCHEDULED',
        metadata: {
          scheduledAt: scheduleDate,
          timezone: validatedData.timezone,
          recipientCount: totalContacts
        }
      }
    })

    console.log(`🕒 Campaign ${campaignId} scheduled for ${scheduleDate.toISOString()}`)

    return NextResponse.json({
      success: true,
      data: updatedCampaign
    })

  } catch (error) {
    console.error("❌ POST /api/campaigns/[id]/schedule error:", error)
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
