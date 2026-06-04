import { Session } from "next-auth"
import { PrismaClient } from '@prisma/client'
import { CampaignAccessControl } from '@/lib/rbac/campaign-access'
import { ContactAccessControl } from '@/lib/rbac/contact-access'
import { TemplateAccessControl } from '@/lib/rbac/template-access'

/**
 * Centralized dashboard data service for consistent RBAC across the platform
 */
export class DashboardService {
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
   * Get contact count for dashboard analytics (total unique contacts)
   */
  static async getContactCount(session: Session | null, prisma: PrismaClient) {
    const filter = ContactAccessControl.getContactVisibilityFilter(session)
    
    const count = await prisma.contact.count({
      where: filter
    })
    
    console.log("📊 Dashboard Contact Count (Contacts):", {
      filter,
      count,
      userId: session?.user?.id,
      userRole: session?.user?.role
    })
    
    return count
  }

  /**
   * Get template count for dashboard analytics
   */
  static async getTemplateCount(session: Session | null, prisma: PrismaClient) {
    const filter = TemplateAccessControl.getTemplateVisibilityFilter(session)
    
    const count = await prisma.emailTemplate.count({
      where: filter
    })
    
    return count
  }

  /**
   * Get comprehensive stats summary for dashboard
   */
  static async getStatsSummary(session: Session | null, prisma: PrismaClient) {
    const filter = CampaignAccessControl.getDashboardCampaignFilter(session)
    
    const aggregates = await prisma.campaign.aggregate({
      where: filter,
      _sum: {
        totalSent: true,
        totalOpened: true,
        totalClicked: true,
        totalBounced: true,
        totalComplained: true,
        totalUnsubscribed: true,
        recipientCount: true
      }
    })

    const summary = {
      totalSent: aggregates._sum.totalSent || 0,
      totalOpened: aggregates._sum.totalOpened || 0,
      totalClicked: aggregates._sum.totalClicked || 0,
      totalBounced: aggregates._sum.totalBounced || 0,
      totalComplained: aggregates._sum.totalComplained || 0,
      totalUnsubscribed: aggregates._sum.totalUnsubscribed || 0,
      recipientCount: aggregates._sum.recipientCount || 0
    }

    // Calculate rates with 100% cap protection
    const delivered = summary.totalSent - summary.totalBounced
    const openRate = delivered > 0 ? Math.min((summary.totalOpened / delivered) * 100, 100) : 0
    const clickRate = delivered > 0 ? Math.min((summary.totalClicked / delivered) * 100, 100) : 0
    const bounceRate = summary.totalSent > 0 ? Math.min((summary.totalBounced / summary.totalSent) * 100, 100) : 0
    const complaintRate = summary.totalSent > 0 ? Math.min((summary.totalComplained / summary.totalSent) * 100, 100) : 0

    return {
      ...summary,
      openRate,
      clickRate,
      bounceRate,
      complaintRate
    }
  }

  /**
   * Get contact growth trend for the last 30 days
   */
  static async getContactGrowthTrend(session: Session | null, prisma: PrismaClient) {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const filter = ContactAccessControl.getContactVisibilityFilter(session)
    
    // Total contacts 30 days ago vs now
    const currentCount = await prisma.contact.count({ where: filter })
    const oldCount = await prisma.contact.count({
      where: {
        ...filter,
        createdAt: { lt: thirtyDaysAgo }
      }
    })

    const growth = oldCount > 0 ? ((currentCount - oldCount) / oldCount) * 100 : 100
    
    return {
      currentCount,
      oldCount,
      growth: parseFloat(growth.toFixed(1))
    }
  }

  /**
   * Get top 5 performing campaigns by engagement (Open Rate > Click Rate > Volume)
   */
  static async getTopCampaigns(session: Session | null, prisma: PrismaClient) {
    const filter = CampaignAccessControl.getDashboardCampaignFilter(session)
    
    const campaigns = await prisma.campaign.findMany({
      where: {
        ...filter,
        status: 'SENT',
        totalSent: { gt: 0 }
      },
      select: {
        id: true,
        name: true,
        totalSent: true,
        totalOpened: true,
        totalClicked: true,
        openRate: true,
        clickRate: true
      },
      orderBy: [
        { openRate: 'desc' },
        { clickRate: 'desc' },
        { totalSent: 'desc' },
        { id: 'asc' }
      ],
      take: 5
    })

    return campaigns
  }

  /**
   * Get recent tracking activity feed (last 20 events)
   */
  static async getRecentActivity(session: Session | null, prisma: PrismaClient) {
    // RBAC: If not admin, filter activity logs by campaigns owned by user
    const campaignFilter = CampaignAccessControl.getDashboardCampaignFilter(session)
    
    const activity = await prisma.campaignActivityLog.findMany({
      where: {
        campaign: campaignFilter,
        action: { not: 'EMAIL_SEND_IN_PROGRESS' }
      },
      include: {
        campaign: {
          select: { name: true }
        },
        contact: {
          select: { email: true, firstName: true, lastName: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20
    })

    return activity
  }
}
