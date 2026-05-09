import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/next-auth"
import { PrismaClient } from "@prisma/client"
import { CampaignAccessControl } from "@/lib/rbac/campaign-access"
import { sendBulkEmails, EmailRecipient } from "@/lib/services/email.service"

const prisma = new PrismaClient() as any

// POST /api/campaigns/[id]/launch - Launch a campaign (DRAFT → SENT)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params
  try {
    console.log("🚀 POST /api/campaigns/[id]/launch - Starting launch", { campaignId })

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch campaign with full relations
    const existingCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        recipientLists: {
          include: {
            contactList: {
              include: {
                members: {
                  include: {
                    contact: {
                      select: {
                        id: true,
                        email: true,
                        firstName: true,
                        lastName: true,
                        status: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        recipientSegments: {
          include: { segment: true },
        },
        excludedLists: true,
        template: {
          select: { id: true, name: true, html: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // RBAC: only owner or SUPER_ADMIN can launch
    if (!CampaignAccessControl.canLaunchCampaign(session, existingCampaign)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Only DRAFT campaigns can be launched
    if (existingCampaign.status !== "DRAFT") {
      return NextResponse.json(
        { error: `Campaign cannot be launched from status: ${existingCampaign.status}` },
        { status: 409 }
      )
    }

    // Validate minimum required fields
    if (!existingCampaign.name || !existingCampaign.subject) {
      return NextResponse.json(
        { error: "Campaign must have a name and subject before launching" },
        { status: 422 }
      )
    }

    if (
      (!existingCampaign.recipientLists || existingCampaign.recipientLists.length === 0) &&
      (!existingCampaign.recipientSegments || existingCampaign.recipientSegments.length === 0)
    ) {
      return NextResponse.json(
        { error: "Campaign must have at least one recipient list or segment before launching" },
        { status: 422 }
      )
    }

    // Validate template HTML exists
    if (!existingCampaign.template?.html) {
      return NextResponse.json(
        { error: "Campaign template has no HTML content" },
        { status: 422 }
      )
    }

    // ─── Build recipient list ───────────────────────────────────────────────

    // Collect all excluded contact IDs
    const excludedContactListIds: string[] = (existingCampaign.excludedLists || []).map(
      (el: any) => el.contactListId
    )

    // Collect excluded contacts from excluded lists
    let excludedContactIds = new Set<string>()
    if (excludedContactListIds.length > 0) {
      const excludedMembers = await prisma.contactListMember.findMany({
        where: { contactListId: { in: excludedContactListIds } },
        select: { contactId: true },
      })
      excludedContactIds = new Set(excludedMembers.map((m: any) => m.contactId))
    }

    // Build unique recipients map (email → recipient data)
    const recipientsMap = new Map<string, EmailRecipient>()

    for (const rl of existingCampaign.recipientLists || []) {
      for (const member of rl.contactList?.members || []) {
        const contact = member.contact
        if (!contact) continue
        // Skip excluded, unsubscribed, bounced, or complained contacts
        if (excludedContactIds.has(contact.id)) continue
        if (contact.status !== "ACTIVE") continue
        // Deduplicate by email
        if (!recipientsMap.has(contact.email)) {
          recipientsMap.set(contact.email, {
            email: contact.email,
            firstName: contact.firstName,
            lastName: contact.lastName,
          })
        }
      }
    }

    const recipients = Array.from(recipientsMap.values())
    const recipientCount = recipients.length

    console.log(`📊 LAUNCH: Found ${recipientCount} eligible recipients for campaign: ${campaignId}`)

    if (recipientCount === 0) {
      return NextResponse.json(
        { error: "No active recipients found in the selected lists (all contacts may be unsubscribed or excluded)" },
        { status: 422 }
      )
    }

    // ─── Check for scheduling ─────────────────────────────────────────────
    const body = await request.json().catch(() => ({}))
    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
    const isScheduled = scheduledAt && scheduledAt > new Date()

    if (isScheduled) {
      // ─── SCHEDULED SEND ──────────────────────────────────────────────────
      const scheduledCampaign = await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: "SCHEDULED",
          scheduledAt: scheduledAt,
          recipientCount,
          updatedAt: new Date(),
        },
      })

      await prisma.campaignActivityLog.create({
        data: {
          campaignId,
          actorId: session.user.id,
          action: "CAMPAIGN_SCHEDULED",
          metadata: {
            scheduledAt: scheduledAt.toISOString(),
            recipientCount,
            scheduledBy: session.user.id,
          },
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          campaign: scheduledCampaign,
          status: "SCHEDULED",
          recipientCount,
        },
      })
    }

    // ─── SEND NOW (Queueing) ──────────────────────────────────────────────

    // ─── Mark campaign as SENDING ───────────────────────────────────────────
    await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        status: "SENDING",
        sentAt: new Date(),
        recipientCount,
        totalSent: 0,
        updatedAt: new Date(),
      },
    })

    // ─── Enqueue emails via AWS SQS ────────────────────────────────────────
    console.log(`✉️ LAUNCH: Enqueueing ${recipientCount} recipients for background delivery...`)

    try {
      const messages = recipients.map(r => ({
        campaignId,
        recipient: {
          ...r,
          contactId: undefined // Could add if needed
        }
      }))

      // Import dynamic to avoid issues in some environments
      const { QueueService } = await import("@/lib/services/queue.service")
      await QueueService.enqueueBatch(messages)

      console.log(`✅ LAUNCH: All recipients enqueued successfully`)

      await prisma.campaignActivityLog.create({
        data: {
          campaignId,
          actorId: session.user.id,
          action: "CAMPAIGN_LAUNCHED",
          metadata: {
            sentAt: new Date().toISOString(),
            recipientCount,
            launchedBy: session.user.id,
          },
        },
      })

      return NextResponse.json({
        success: true,
        data: {
          status: "SENDING",
          recipientCount,
        },
      })

    } catch (enqueueError: any) {
      console.error("❌ LAUNCH: Enqueueing failed:", enqueueError)
      // Revert status to DRAFT if queueing fails
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: "DRAFT" },
      })
      throw enqueueError
    }

  } catch (error) {
    console.error("❌ POST /api/campaigns/[id]/launch error:", error)
    // Attempt to revert campaign to DRAFT if sending fails
    try {
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: "DRAFT" },
      })
    } catch (_) {}
    return NextResponse.json(
      { error: "Failed to launch campaign", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
