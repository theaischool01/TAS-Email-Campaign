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
}
