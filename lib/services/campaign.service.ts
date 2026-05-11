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

    // 2. Fetch all activity logs for this campaign for processing
    console.log(`📊 Report: Fetching logs for campaign ${campaignId}...`)
    let logs = []
    try {
      logs = await prisma.campaignActivityLog.findMany({
        where: { campaignId },
        include: { contact: true },
        orderBy: { createdAt: 'asc' }
      })
      console.log(`📊 Report: Found ${logs.length} activity logs`)
    } catch (dbError: any) {
      console.error(`❌ Report DB Error:`, dbError)
      throw new Error(`Database error: ${dbError.message}`)
    }

    // 3. Process Summary Stats
    console.log(`📊 Report: Processing summary stats...`)
    const summary = {
      sent: campaign.totalSent || 0,
      opened: campaign.totalOpened || 0,
      clicked: campaign.totalClicked || 0,
      bounced: campaign.totalBounced || 0,
      complained: campaign.totalComplained || 0,
      unsubscribed: logs.filter(l => l.action === 'EMAIL_UNSUBSCRIBED').length || campaign.totalUnsubscribed || 0,
      delivered: (campaign.totalSent || 0) - (campaign.totalBounced || 0),
      uniqueOpens: new Set(logs.filter(l => l.action === 'EMAIL_OPENED').map(l => l.actorId)).size,
      uniqueClicks: new Set(logs.filter(l => l.action === 'EMAIL_CLICKED').map(l => l.actorId)).size,
    }
    console.log(`📊 Report: Summary stats processed`, summary)

    // 4. Process Open Rate Over Time (Hourly for 48h, then daily)
    console.log(`📊 Report: Processing timeline...`)
    const openTimeline: Record<string, number> = {}
    try {
      const startAt = new Date(campaign.sentAt || campaign.createdAt)
      const now = new Date()
      const diffHours = Math.floor((now.getTime() - startAt.getTime()) / (1000 * 60 * 60))

      logs.filter(l => l.action === 'EMAIL_OPENED').forEach(log => {
        const logDate = new Date(log.createdAt)
        let key: string
        
        if (diffHours <= 48) {
          key = `${logDate.getFullYear()}-${(logDate.getMonth()+1).toString().padStart(2,'0')}-${logDate.getDate().toString().padStart(2,'0')} ${logDate.getHours().toString().padStart(2,'0')}:00`
        } else {
          key = `${logDate.getFullYear()}-${(logDate.getMonth()+1).toString().padStart(2,'0')}-${logDate.getDate().toString().padStart(2,'0')}`
        }
        
        openTimeline[key] = (openTimeline[key] || 0) + 1
      })
      console.log(`📊 Report: Timeline processed (${Object.keys(openTimeline).length} data points)`)
    } catch (timelineError: any) {
      console.error("❌ Report Timeline Error:", timelineError)
      // Non-blocking but logged
    }

    // 5. Process Link Click Breakdown
    console.log(`📊 Report: Processing link clicks...`)
    const linkStats: Record<string, { clicks: number, unique: number, users: Set<string> }> = {}
    try {
      logs.filter(l => l.action === 'EMAIL_CLICKED').forEach(log => {
        const metadata = log.metadata as any
        const url = metadata?.url || 'Unknown'
        
        if (!linkStats[url]) {
          linkStats[url] = { clicks: 0, unique: 0, users: new Set() }
        }
        
        linkStats[url].clicks++
        if (log.actorId) linkStats[url].users.add(log.actorId)
      })
      console.log(`📊 Report: Link clicks processed (${Object.keys(linkStats).length} unique URLs)`)
    } catch (linkError: any) {
      console.error("❌ Report Link Error:", linkError)
    }
    
    const links = Object.entries(linkStats).map(([url, stats]) => ({
      url,
      clicks: stats.clicks,
      uniqueClicks: stats.users.size,
      percent: (summary.delivered || 0) > 0 ? (stats.users.size / (summary.delivered || 1)) * 100 : 0
    })).sort((a, b) => b.clicks - a.clicks)

    // 6. Device Breakdown (parsing User-Agent)
    console.log(`📊 Report: Processing device stats...`)
    const deviceStats = { desktop: 0, mobile: 0, tablet: 0, unknown: 0 }
    try {
      logs.filter(l => l.action === 'EMAIL_OPENED' || l.action === 'EMAIL_CLICKED').forEach(log => {
        const metadata = log.metadata as any
        if (metadata?.isBot || metadata?.isPrefetch) return // Skip bots/proxies for device stats
        
        const ua = (metadata?.userAgent || "").toLowerCase()
        if (!ua) { deviceStats.unknown++; return }
        
        if (ua.includes('tablet') || ua.includes('ipad')) deviceStats.tablet++
        else if (ua.includes('mobile') || ua.includes('iphone') || ua.includes('android')) deviceStats.mobile++
        else deviceStats.desktop++
      })
      console.log(`📊 Report: Device stats processed`, deviceStats)
    } catch (deviceError: any) {
      console.error("❌ Report Device Error:", deviceError)
    }

    console.log(`📊 Report: Finalizing payload...`)
    return {
      campaign,
      summary,
      openTimeline: Object.entries(openTimeline).map(([time, count]) => ({ time, count })),
      links,
      deviceStats,
      activityCount: logs.length,
      recentActivity: (logs || []).slice(-100).reverse().map(l => ({
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
