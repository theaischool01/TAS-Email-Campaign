import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { CampaignAccessControl } from "@/lib/rbac/campaign-access"
import { sendBulkEmails, EmailRecipient } from "@/lib/services/email.service"
import logger from "@/lib/logger"

const prisma = prismaClient as any

// POST /api/campaigns/[id]/launch - Launch a campaign (DRAFT → SENT)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params
  try {
    logger.info({ campaignId }, "LAUNCH: Starting")

    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const excludedContactIds: string[] = body.excludedContactIds || []

    // Fetch campaign with full relations
    let existingCampaign = await prisma.campaign.findUnique({
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
          select: { id: true, name: true, html: true, json: true },
        },
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    if (!existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
    }

    // RBAC: only owner can launch
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
      logger.warn({ campaignId }, "LAUNCH: Missing name or subject")
      return NextResponse.json(
        { error: "Campaign must have a name and subject before launching" },
        { status: 422 }
      )
    }

    if (
      (!existingCampaign.recipientLists || existingCampaign.recipientLists.length === 0) &&
      (!existingCampaign.recipientSegments || existingCampaign.recipientSegments.length === 0)
    ) {
      logger.warn({ campaignId }, "LAUNCH: No recipients selected")
      return NextResponse.json(
        { error: "Campaign must have at least one recipient list or segment before launching" },
        { status: 422 }
      )
    }

    // Double-check template existence (Race condition protection)
    if (!existingCampaign.templateId || !existingCampaign.template?.html) {
      logger.warn({ campaignId }, "LAUNCH: Template missing, refetching with delay")
      await new Promise(resolve => setTimeout(resolve, 800)) // Wait 800ms
      const refreshedCampaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: { 
          template: true,
          recipientLists: true,
          recipientSegments: true,
          excludedLists: true
        }
      })
      if (refreshedCampaign) {
        logger.info({ campaignId }, "LAUNCH: Campaign refreshed")
        existingCampaign = refreshedCampaign
      }
    }

    // Validate template HTML exists
    let templateHtml = existingCampaign.template?.html
    
    // Self-healing: If HTML is missing from the relation, try to fetch the template record directly
    if (!templateHtml && existingCampaign.templateId) {
      logger.warn({ campaignId, templateId: existingCampaign.templateId }, "LAUNCH: Template HTML missing, attempting self-heal")
      const directTemplate = await prisma.emailTemplate.findUnique({
        where: { id: existingCampaign.templateId },
        select: { id: true, html: true, name: true }
      })

      if (directTemplate?.html) {
        templateHtml = directTemplate.html
        logger.info({ campaignId }, "LAUNCH: Template HTML recovered via self-heal")
      }
    }

    if (!templateHtml) {
      logger.error({ campaignId, templateId: existingCampaign.templateId }, "LAUNCH: Template HTML empty in DB")
      
      // One last try: if we have a template name, try to find another template with same name that HAS html
      let fallbackHtml = null;
      if ((existingCampaign as any).template?.name) {
        const fallback = await prisma.emailTemplate.findFirst({
          where: { 
            name: (existingCampaign as any).template.name,
            html: { not: "" }
          },
          select: { html: true }
        });
        if (fallback?.html) {
          fallbackHtml = fallback.html;
          templateHtml = fallback.html;
          logger.warn({ campaignId }, "LAUNCH: Applied emergency template fallback")
        }
      }

      if (!templateHtml) {
        return NextResponse.json(
          { 
            error: "Campaign template has no HTML content",
            details: "The selected template record exists in the database but its HTML content is empty. Please re-save the template or visit /api/templates/seed to restore defaults.",
            debug: {
              templateId: existingCampaign.templateId,
              templateName: (existingCampaign as any).template?.name,
              dbStatus: "Template record found but html column is empty"
            }
          },
          { status: 422 }
        )
      }
    }

    // ─── Build recipient list ───────────────────────────────────────────────

    // Collect all excluded contact IDs from lists
    const excludedContactListIds: string[] = (existingCampaign.excludedLists || []).map(
      (el: any) => el.contactListId
    )

    // Collect excluded contacts from excluded lists
    let excludedListContactIds = new Set<string>()
    if (excludedContactListIds.length > 0) {
      const excludedMembers = await prisma.contactListMember.findMany({
        where: { contactListId: { in: excludedContactListIds } },
        select: { contactId: true },
      })
      excludedListContactIds = new Set(excludedMembers.map((m: any) => m.contactId))
    }

    const allContacts = (existingCampaign.recipientLists || []).flatMap(
      (rl: any) => (rl.contactList?.members || []).map((m: any) => m.contact).filter(Boolean)
    )

    const filteredContacts = allContacts.filter(
      (contact: any) => !excludedContactIds.includes(contact.id)
    )

    logger.info({ campaignId, excludedCount: excludedContactIds.length }, "LAUNCH: Excluded contacts filtered")

    // Build unique recipients map (email → recipient data)
    const recipientsMap = new Map<string, EmailRecipient>()

    // Fetch suppression list for this campaign's run
    const suppressedEmails = await prisma.suppressionList.findMany({
      select: { email: true }
    })
    const suppressedSet = new Set(suppressedEmails.map((s: any) => s.email))

    for (const contact of filteredContacts) {
      // Skip excluded, unsubscribed, bounced, complained, OR suppressed contacts
      if (excludedListContactIds.has(contact.id)) continue
      if (contact.status !== "ACTIVE") continue
      if (suppressedSet.has(contact.email)) continue
      
      // Deduplicate by email
      if (!recipientsMap.has(contact.email)) {
        recipientsMap.set(contact.email, {
          email: contact.email,
          firstName: contact.firstName,
          lastName: contact.lastName,
          contactId: contact.id
        })
      }
    }

    const recipients = Array.from(recipientsMap.values())
    const recipientCount = recipients.length

    logger.info({ campaignId, recipientCount }, "LAUNCH: Eligible recipients found")

    if (recipientCount === 0) {
      logger.warn({ campaignId }, "LAUNCH: No active recipients found")
      return NextResponse.json(
        { error: "No active recipients found in the selected lists (all contacts may be unsubscribed or excluded)" },
        { status: 422 }
      )
    }

    // ─── Check for scheduling ─────────────────────────────────────────────
    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
    const isScheduled = scheduledAt && scheduledAt > new Date()

    if (isScheduled) {
      // ─── SCHEDULED SEND ──────────────────────────────────────────────────
      const scheduledCampaign = await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: "SCHEDULED",
          scheduledAt: scheduledAt,
          timezone: body.timezone || "UTC",
          isRecurring: body.isRecurring || false,
          recurrenceInterval: body.recurrenceInterval || null,
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
    logger.info({ campaignId, recipientCount }, "LAUNCH: Enqueueing recipients")

    try {
      const messages = recipients.map(r => ({
        campaignId,
        recipient: {
          email: r.email,
          firstName: r.firstName || undefined,
          lastName: r.lastName || undefined,
          contactId: r.contactId || undefined
        }
      }))

      const { QueueService } = await import("@/lib/services/queue.service")
      await QueueService.enqueueBatch(messages)
      logger.info({ campaignId }, "LAUNCH: All recipients enqueued")

      // Separate activity logging so it doesn't break the launch if it fails
      try {
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
      } catch (logError) {
        logger.error({ error: logError }, "LAUNCH: Activity logging failed (non-critical)")
      }

      return NextResponse.json({
        success: true,
        data: {
          status: "SENDING",
          recipientCount,
        },
      })

    } catch (enqueueError: any) {
      logger.error({ error: enqueueError }, "LAUNCH: Enqueueing failed")
      // Only revert if we haven't successfully started the process
      await prisma.campaign.update({
        where: { id: campaignId },
        data: { status: "DRAFT" },
      })
      return NextResponse.json(
        { error: "Failed to queue emails for delivery", details: enqueueError.message },
        { status: 500 }
      )
    }

  } catch (error) {
    logger.error({ error }, "LAUNCH: POST /api/campaigns/[id]/launch - CRITICAL ERROR")
    return NextResponse.json(
      { error: "Failed to launch campaign", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
