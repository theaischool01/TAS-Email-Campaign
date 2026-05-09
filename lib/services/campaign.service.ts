import { Session } from "next-auth"
import { PrismaClient } from '@prisma/client'
import { CampaignAccessControl } from '@/lib/rbac/campaign-access'

/**
 * Centralized campaign data service for consistent RBAC across the platform
 */
export class CampaignService {
  /**
   * Get campaign count for dashboard analytics
   */
  static async getCampaignCount(session: Session | null, prisma: PrismaClient) {
    const filter = CampaignAccessControl.getDashboardCampaignFilter(session)
    
    const count = await prisma.campaign.count({
      where: filter
    })
    
    console.log("📊 Dashboard Campaign Count:", {
      filter,
      count,
      userId: session?.user?.id,
      userRole: session?.user?.role
    })
    
    return count
  }

  /**
   * Get campaigns for listing page
   */
  static async getCampaigns(session: Session | null, prisma: PrismaClient, options: {
    search?: string
    status?: string
    tags?: string[]
    creator?: string
    page?: number
    limit?: number
  } = {}) {
    const baseFilter = CampaignAccessControl.getCampaignVisibilityFilter(session)
    
    let whereClause: any = { ...baseFilter }
    
    // Add search filter
    if (options.search) {
      whereClause.OR = [
        { name: { contains: options.search, mode: 'insensitive' } },
        { subject: { contains: options.search, mode: 'insensitive' } }
      ]
    }

    // Add status filter
    if (options.status) {
      whereClause.status = options.status
    }

    // Add tags filter
    if (options.tags && options.tags.length > 0) {
      whereClause.tags = {
        hasSome: options.tags
      }
    }

    // Add creator filter
    if (options.creator) {
      whereClause.createdBy = options.creator
    }

    const skip = ((options.page || 1) - 1) * (options.limit || 20)
    const take = options.limit || 20

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
        take
      }),
      prisma.campaign.count({ where: whereClause })
    ])

    console.log("� Campaigns Retrieved:", {
      filter: whereClause,
      count: campaigns.length,
      total,
      skip,
      take,
      userId: session?.user?.id,
      userRole: session?.user?.role
    })

    return {
      campaigns,
      pagination: {
        page: options.page || 1,
        limit: options.limit || 20,
        total,
        pages: Math.ceil(total / (options.limit || 20))
      }
    }
  }

  /**
   * Create a new draft campaign targeting only non-openers of a previous campaign
   */
  static async duplicateForNonOpeners(session: Session | null, prisma: PrismaClient, originalId: string) {
    if (!session?.user) throw new Error("Unauthorized")

    // Fetch original campaign
    const original = await prisma.campaign.findUnique({
      where: { id: originalId },
      include: {
        recipientLists: true,
        recipientSegments: true,
        excludedLists: true
      }
    })

    if (!original) throw new Error("Campaign not found")

    // RBAC Check
    if (!CampaignAccessControl.canDuplicateCampaign(session, original)) {
      throw new Error("Forbidden")
    }

    // Get non-openers (sent but not opened)
    const logs = await (prisma as any).campaignActivityLog.findMany({
      where: { campaignId: originalId },
      select: { contactId: true, type: true }
    })

    const sentContactIds = new Set(logs.filter((l: any) => l.type === 'SENT').map((l: any) => l.contactId))
    const openedContactIds = new Set(logs.filter((l: any) => l.type === 'OPENED').map((l: any) => l.contactId))
    
    const nonOpenerIds = Array.from(sentContactIds).filter(id => !openedContactIds.has(id))

    if (nonOpenerIds.length === 0) {
      throw new Error("No non-openers found for this campaign.")
    }

    // Create new campaign
    const newCampaign = await prisma.campaign.create({
      data: {
        name: `[Re-send] ${original.name}`,
        subject: `Re: ${original.subject}`,
        previewText: original.previewText,
        senderName: original.senderName,
        senderEmail: original.senderEmail,
        replyToEmail: original.replyToEmail,
        templateId: original.templateId,
        createdBy: session.user.id,
        status: 'DRAFT',
        tags: original.tags ? JSON.parse(original.tags as string) : []
      }
    })

    // For simplicity in this demo, we'll just create a new list for these non-openers
    // In a production app, we might use a dynamic segment.
    const resendList = await prisma.contactList.create({
      data: {
        name: `Non-openers of ${original.name}`,
        description: `Auto-generated list for re-sending`,
        ownerId: session.user.id
      }
    })

    // Add members to list
    if (nonOpenerIds.length > 0) {
      await (prisma as any).contactListMember.createMany({
        data: nonOpenerIds.map(contactId => ({
          contactListId: resendList.id,
          contactId
        }))
      })
    }

    // Link list to new campaign
    await (prisma as any).campaignRecipientList.create({
      data: {
        campaignId: newCampaign.id,
        contactListId: resendList.id
      }
    })

    return newCampaign
  }
}
