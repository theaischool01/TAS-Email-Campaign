import { Session } from "next-auth"
import { PrismaClient } from '@prisma/client'
import { CampaignAccessControl } from '@/lib/rbac/campaign-access'
import logger from '@/lib/logger'

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
    
    logger.debug({ userId: session?.user?.id, userRole: session?.user?.role, count }, 'Dashboard campaign count fetched')
    
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

    logger.debug({ userId: session?.user?.id, userRole: session?.user?.role, count: campaigns.length, total }, 'Campaigns list fetched')

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

    // Get sent contact IDs
    const sentLogs = await prisma.emailDelivery.findMany({
      where: { campaignId: originalId, status: 'SENT' },
      select: { contactId: true }
    })
    const sentContactIds = new Set(sentLogs.map(l => l.contactId).filter(Boolean) as string[])

    // Get opened contact IDs
    const openedLogs = await prisma.campaignActivityLog.findMany({
      where: { campaignId: originalId, action: 'EMAIL_OPENED' },
      select: { contactId: true }
    })
    const openedContactIds = new Set(openedLogs.map(l => l.contactId).filter(Boolean) as string[])
    
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
      await (prisma as any).contactToContactList.createMany({
        data: nonOpenerIds.map(contactId => ({
          A: contactId,
          B: resendList.id
        })),
        skipDuplicates: true
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

  /**
   * Get detailed report data for a specific campaign
   */
  static async getCampaignReportData(session: Session | null, prisma: PrismaClient, campaignId: string) {
    // 1. Fetch campaign record
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      include: {
        template: {
          select: { id: true, name: true }
        },
        user: {
          select: { name: true, email: true }
        }
      }
    })

    if (!campaign) throw new Error("Campaign not found")

    // RBAC: Check if user can view this campaign
    if (!CampaignAccessControl.canViewAnalytics(session, campaign)) {
      throw new Error("Forbidden")
    }

    // 2. Fetch counts directly from DB
    const [sent, opened, clicked, bounced, complained, unsubscribed] = await Promise.all([
      prisma.emailDelivery.count({ where: { campaignId, status: 'SENT' } }),
      prisma.campaignActivityLog.count({ where: { campaignId, action: 'EMAIL_OPENED' } }),
      prisma.campaignActivityLog.count({ where: { campaignId, action: 'EMAIL_CLICKED' } }),
      prisma.campaignActivityLog.count({ where: { campaignId, action: 'EMAIL_BOUNCED' } }),
      prisma.campaignActivityLog.count({ where: { campaignId, action: { in: ['EMAIL_COMPLAINED', 'EMAIL_COMPLAINT'] } } }),
      prisma.campaignActivityLog.count({ where: { campaignId, action: 'EMAIL_UNSUBSCRIBED' } })
    ])

    // Compute unique counts using distinct queries
    const [uniqueOpenRecords, uniqueClickRecords] = await Promise.all([
      prisma.campaignActivityLog.findMany({
        where: { campaignId, action: 'EMAIL_OPENED' },
        distinct: ['actorId'],
        select: { actorId: true }
      }),
      prisma.campaignActivityLog.findMany({
        where: { campaignId, action: 'EMAIL_CLICKED' },
        distinct: ['actorId'],
        select: { actorId: true }
      })
    ])

    const uniqueOpens = uniqueOpenRecords.length
    const uniqueClicks = uniqueClickRecords.length
    const delivered = sent - bounced

    const summary = {
      sent,
      opened,
      clicked,
      bounced,
      complained,
      unsubscribed,
      delivered,
      uniqueOpens: Math.min(uniqueOpens, delivered > 0 ? delivered : uniqueOpens),
      uniqueClicks: Math.min(uniqueClicks, delivered > 0 ? delivered : uniqueClicks),
    }

    // 3. Process Open Rate Over Time (select only createdAt for opens)
    const openLogs = await prisma.campaignActivityLog.findMany({
      where: { campaignId, action: 'EMAIL_OPENED' },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' }
    })

    const openTimeline: Record<string, number> = {}
    const startAt = new Date(campaign.sentAt || campaign.createdAt)
    const now = new Date()
    const diffHours = Math.floor((now.getTime() - startAt.getTime()) / (1000 * 60 * 60))

    openLogs.forEach(log => {
      const logDate = new Date(log.createdAt)
      let key: string
      if (diffHours <= 48) {
        key = `${logDate.getFullYear()}-${(logDate.getMonth()+1).toString().padStart(2,'0')}-${logDate.getDate().toString().padStart(2,'0')} ${logDate.getHours().toString().padStart(2,'0')}:00`
      } else {
        key = `${logDate.getFullYear()}-${(logDate.getMonth()+1).toString().padStart(2,'0')}-${logDate.getDate().toString().padStart(2,'0')}`
      }
      openTimeline[key] = (openTimeline[key] || 0) + 1
    })

    // 4. Process Link Click Breakdown
    const clickLogs = await prisma.campaignActivityLog.findMany({
      where: { campaignId, action: 'EMAIL_CLICKED' },
      select: { actorId: true, metadata: true }
    })

    const linkStats: Record<string, { clicks: number, unique: number, users: Set<string> }> = {}
    clickLogs.forEach(log => {
      const metadata = log.metadata as any
      const url = metadata?.url || 'Unknown'
      
      if (!linkStats[url]) {
        linkStats[url] = { clicks: 0, unique: 0, users: new Set() }
      }
      
      linkStats[url].clicks++
      if (log.actorId) linkStats[url].users.add(log.actorId)
    })

    const links = Object.entries(linkStats).map(([url, stats]) => ({
      url,
      clicks: stats.clicks,
      uniqueClicks: stats.users.size,
      percent: (delivered || 0) > 0 ? Math.min((stats.users.size / (delivered || 1)) * 100, 100) : 0
    })).sort((a, b) => b.clicks - a.clicks)

    // 5. Device Breakdown
    const openAndClickLogs = await prisma.campaignActivityLog.findMany({
      where: {
        campaignId,
        action: { in: ['EMAIL_OPENED', 'EMAIL_CLICKED'] }
      },
      select: { metadata: true }
    })

    const deviceStats = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 }
    openAndClickLogs.forEach(log => {
      const metadata = log.metadata as any
      if (metadata?.isBot || metadata?.isPrefetch) return
      
      const ua = (metadata?.userAgent || "").toLowerCase()
      if (!ua) { deviceStats.unknown++; return }
      
      if (ua.includes('tablet') || ua.includes('ipad')) deviceStats.tablet++
      else if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) deviceStats.mobile++
      else deviceStats.desktop++
    })

    // 6. Recent Activity feed (take 100, ordered by createdAt desc)
    const recentLogs = await prisma.campaignActivityLog.findMany({
      where: { campaignId },
      include: { contact: true },
      orderBy: { createdAt: 'desc' },
      take: 100
    })

    const totalLogsCount = await prisma.campaignActivityLog.count({
      where: { campaignId }
    })

    return {
      campaign,
      summary,
      openTimeline: Object.entries(openTimeline).map(([time, count]) => ({ time, count })),
      links,
      deviceStats,
      activityCount: totalLogsCount,
      recentActivity: recentLogs.map(l => ({
        id: l.id,
        action: l.action,
        createdAt: l.createdAt,
        actorId: l.actorId,
        metadata: l.metadata,
        contact: (l as any).contact ? {
          email: (l as any).contact.email,
          firstName: (l as any).contact.firstName,
          lastName: (l as any).contact.lastName
        } : { email: 'Unknown / Admin' }
      }))
    }
  }
}
