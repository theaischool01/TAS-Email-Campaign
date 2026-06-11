import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/next-auth"
import { enforceRateLimit, handleRateLimitError } from "@/lib/security/rate-limit"
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

    try {
      await enforceRateLimit("campaignLaunch", `launch:${session.user.id}`)
    } catch (limitErr) {
      const errorRes = handleRateLimitError(limitErr)
      if (errorRes) return errorRes
    }

    const body = await request.json().catch(() => ({}))
    const excludedContactIds: string[] = body.excludedContactIds || []

    // Fetch campaign metadata
    let existingCampaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        recipientLists: true,
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
    const excludedContactIdsSet = new Set<string>()
    if (excludedContactListIds.length > 0) {
      const excludedMembers = await prisma.contactListMember.findMany({
        where: { contactListId: { in: excludedContactListIds } },
        select: { contactId: true },
      })
      excludedMembers.forEach((m: any) => excludedContactIdsSet.add(m.contactId))
    }

    // Add manually excluded IDs from body
    if (excludedContactIds && Array.isArray(excludedContactIds)) {
      excludedContactIds.forEach((id: string) => excludedContactIdsSet.add(id))
    }

    // Fetch suppression list for this campaign's run
    const suppressedEmails = await prisma.suppressionList.findMany({
      where: { userId: existingCampaign.createdBy },
      select: { email: true }
    })
    const suppressedSet = new Set(suppressedEmails.map((s: any) => s.email.trim().toLowerCase()))

    const targetListIds = (existingCampaign.recipientLists || []).map((rl: any) => rl.contactListId)

    // Check for scheduling
    const scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null
    const isScheduled = scheduledAt && scheduledAt > new Date()

    // Enqueue or Count via streaming loop
    const processedEmails = new Set<string>()
    let lastMemberId: string | null = null
    let recipientCount = 0

    const { QueueService } = await import("@/lib/services/queue.service")

    logger.info({ campaignId, targetListIds }, "LAUNCH: Starting recipient stream loop")

    while (true) {
      const members: any[] = await prisma.contactListMember.findMany({
        where: { contactListId: { in: targetListIds } },
        take: 1000,
        cursor: lastMemberId ? { id: lastMemberId } : undefined,
        skip: lastMemberId ? 1 : 0,
        select: {
          id: true,
          contact: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              status: true
            }
          }
        },
        orderBy: { id: "asc" }
      })

      if (members.length === 0) break

      const batchMessages: any[] = []

      for (const member of members) {
        const contact = member.contact
        if (!contact) continue
        if (contact.status !== "ACTIVE") continue

        const emailLower = contact.email.trim().toLowerCase()
        if (suppressedSet.has(emailLower)) continue
        if (excludedContactIdsSet.has(contact.id)) continue
        if (processedEmails.has(emailLower)) continue

        processedEmails.add(emailLower)
        recipientCount++

        if (!isScheduled) {
          batchMessages.push({
            campaignId,
            userId: existingCampaign.createdBy,
            recipient: {
              email: contact.email,
              firstName: contact.firstName || undefined,
              lastName: contact.lastName || undefined,
              contactId: contact.id || undefined
            }
          })
        }
      }

      if (!isScheduled && batchMessages.length > 0) {
        logger.info({ campaignId, batchSize: batchMessages.length, totalProcessed: recipientCount }, "LAUNCH: Sending SQS batch")
        await QueueService.enqueueBatch(batchMessages)
      }

      lastMemberId = members[members.length - 1].id
    }

    logger.info({ campaignId, recipientCount }, "LAUNCH: Recipient stream loop completed")

    if (recipientCount === 0) {
      logger.warn({ campaignId }, "LAUNCH: No active recipients found")
      return NextResponse.json(
        { error: "No active recipients found in the selected lists (all contacts may be unsubscribed or excluded)" },
        { status: 422 }
      )
    }

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

    // ─── SEND NOW (Queueing Complete) ────────────────────────────────────────

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

    // Log campaign launch activity
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

  } catch (error) {
    logger.error({ error }, "LAUNCH: POST /api/campaigns/[id]/launch - CRITICAL ERROR")
    return NextResponse.json(
      { error: "Failed to launch campaign", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
