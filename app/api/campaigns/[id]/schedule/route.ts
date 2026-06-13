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
    const now = new Date()
    
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

    // Must be draft or scheduled to schedule/reschedule
    if (campaign.status !== 'DRAFT' && campaign.status !== 'SCHEDULED') {
      return NextResponse.json(
        { error: `Campaign in ${campaign.status} status cannot be scheduled. Only DRAFT and SCHEDULED campaigns can be scheduled.` },
        { status: 400 }
      )
    }

    // If rescheduling, check if it's too close to the current schedule (15 mins)
    if (campaign.status === 'SCHEDULED' && campaign.scheduledAt) {
      const currentSchedule = new Date(campaign.scheduledAt)
      const diffInMinutes = (currentSchedule.getTime() - now.getTime()) / (1000 * 60)
      
      if (diffInMinutes > 0 && diffInMinutes < 15) {
        return NextResponse.json(
          { error: "Campaign schedule cannot be modified within 15 minutes of dispatch." },
          { status: 400 }
        )
      }
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
    const nowWithBuffer = new Date(now.getTime() - 60000) // 60-second buffer
    
    console.log("🕒 SCHEDULE API: Comparing times", { 
      scheduled: scheduleDate.toISOString(), 
      now: now.toISOString(),
      isFuture: scheduleDate > nowWithBuffer 
    })

    if (scheduleDate <= nowWithBuffer) {
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

    const listIds = campaign.recipientLists.map((rl: any) => rl.contactListId)
    const excludedListIds = (campaign.excludedLists || []).map((el: any) => el.contactListId)
    
    // Fetch suppressed emails
    const suppressedEmails = await prisma.suppressionList.findMany({
      where: { userId: session.user.id },
      select: { email: true }
    })
    const suppressedSet = new Set(suppressedEmails.map((s: any) => s.email.trim().toLowerCase()))

    // Fetch excluded contact IDs from excluded lists
    const excludedContactIdsSet = new Set<string>()
    if (excludedListIds.length > 0) {
      const excludedMembers = await prisma.contactListMember.findMany({
        where: { contactListId: { in: excludedListIds } },
        select: { contactId: true }
      })
      excludedMembers.forEach((m: any) => excludedContactIdsSet.add(m.contactId))
    }

    const includedTagsStr = (campaign.includedTags || "").trim()
    const includedTags = includedTagsStr
      ? includedTagsStr.split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      : []

    // Fetch active list members to resolve unique contacts
    const members = await prisma.contactListMember.findMany({
      where: { contactListId: { in: listIds } },
      select: {
        contact: {
          select: {
            id: true,
            email: true,
            status: true,
            tags: true
          }
        }
      }
    })

    const processedEmails = new Set<string>()
    let recipientCount = 0

    for (const member of members) {
      const contact = member.contact
      if (!contact) continue
      if (contact.status !== "ACTIVE") continue

      const emailLower = contact.email.trim().toLowerCase()
      if (suppressedSet.has(emailLower)) continue
      if (excludedContactIdsSet.has(contact.id)) continue
      if (processedEmails.has(emailLower)) continue

      // Tag filtering
      const contactTags = (contact.tags || "")
        .split(",")
        .map((t: string) => t.trim().toLowerCase())
        .filter(Boolean)

      if (includedTags.length > 0) {
        const hasIncludedTag = contactTags.some((t: string) => includedTags.includes(t))
        if (!hasIncludedTag) continue
      }

      processedEmails.add(emailLower)
      recipientCount++
    }

    const totalContacts = recipientCount

    // Update campaign to SCHEDULED
    const updatedCampaign = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: 'SCHEDULED',
        scheduledAt: scheduleDate,
        timezone: validatedData.timezone,
        isRecurring: body.isRecurring || false,
        recurrenceInterval: body.recurrenceInterval || null,
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
        { error: "Validation error", details: error.issues },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
