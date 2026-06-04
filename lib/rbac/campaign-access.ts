import { Session } from "next-auth"
import { PrismaClient } from '@prisma/client'
import { CampaignVisibilityFilter, CampaignStatusFilter, CampaignDashboardFilter, isImpossibleFilter } from "@/types/rbac"

/**
 * Centralized campaign access control for consistent RBAC across the platform
 */
export class CampaignAccessControl {
  /**
   * Creates filter for campaigns based on user role
   */
  static getCampaignVisibilityFilter(session: Session | null): CampaignVisibilityFilter {
    if (!session?.user) {
      throw new Error("No session found")
    }

    // All admins only see their own campaigns
    return { createdBy: session.user.id }
  }

  /**
   * Validates if user can access a campaign
   */
  static canAccessCampaign(session: Session | null, campaignOwnerId: string) {
    if (!session?.user) {
      return false
    }

    return campaignOwnerId === session.user.id
  }

  /**
   * Validates if user can create campaigns
   */
  static canCreateCampaign(session: Session | null) {
    if (!session?.user) {
      return false
    }

    return true
  }

  /**
   * Validates if user can edit a campaign
   */
  static canEditCampaign(session: Session | null, campaign: any) {
    if (!session?.user) {
      return false
    }

    const isOwner = campaign.createdBy === session.user.id
    
    // Only draft campaigns can be edited
    if (campaign.status !== 'DRAFT') {
      return false
    }
    
    return isOwner
  }

  /**
   * Validates if user can delete a campaign
   */
  static canDeleteCampaign(session: Session | null, campaign: any) {
    if (!session?.user) {
      return false
    }

    return campaign.createdBy === session.user.id
  }

  /**
   * Validates if user can launch a campaign
   */
  static canLaunchCampaign(session: Session | null, campaign: any) {
    if (!session?.user) {
      return false
    }
    
    return campaign.createdBy === session.user.id
  }

  /**
   * Validates if user can duplicate a campaign
   */
  static canDuplicateCampaign(session: Session | null, campaign: any) {
    if (!session?.user) {
      return false
    }

    return campaign.createdBy === session.user.id
  }

  /**
   * Validates if user can view campaign analytics
   */
  static canViewAnalytics(session: Session | null, campaign: any) {
    if (!session?.user) {
      return false
    }

    return campaign.createdBy === session.user.id
  }

  /**
   * Creates filter for campaign recipient lists
   */
  static getCampaignRecipientListFilter(session: Session | null) {
    if (!session?.user) {
      throw new Error("No session found")
    }

    return { campaign: { createdBy: session.user.id } }
  }

  /**
   * Creates filter for campaign test sends
   */
  static getCampaignTestSendFilter(session: Session | null) {
    if (!session?.user) {
      throw new Error("No session found")
    }

    return { campaign: { createdBy: session.user.id } }
  }

  /**
   * Creates filter for campaign activity logs
   */
  static getCampaignActivityLogFilter(session: Session | null) {
    if (!session?.user) {
      throw new Error("No session found")
    }

    return { campaign: { createdBy: session.user.id } }
  }

  /**
   * Creates filter for campaigns on dashboard (includes all statuses)
   */
  static getDashboardCampaignFilter(session: Session | null): CampaignDashboardFilter {
    return this.getCampaignVisibilityFilter(session)
  }

  /**
   * Get campaign count for dashboard analytics
   */
  static async getDashboardCampaignCount(session: Session | null, prisma: PrismaClient) {
    const filter = this.getDashboardCampaignFilter(session)
    
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
}
