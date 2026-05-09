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

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    
    // SUPER_ADMIN can see all campaigns, others only their own
    return isSuperAdmin ? {} : { createdBy: session.user.id }
  }

  /**
   * Validates if user can access a campaign
   */
  static canAccessCampaign(session: Session | null, campaignOwnerId: string) {
    if (!session?.user) {
      return false
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const isOwner = campaignOwnerId === session.user.id
    
    return isSuperAdmin || isOwner
  }

  /**
   * Validates if user can create campaigns
   */
  static canCreateCampaign(session: Session | null) {
    if (!session?.user) {
      return false
    }

    // Only SUPER_ADMIN and CAMPAIGN_MANAGER can create campaigns
    return ["SUPER_ADMIN", "CAMPAIGN_MANAGER"].includes(session.user.role)
  }

  /**
   * Validates if user can edit a campaign
   */
  static canEditCampaign(session: Session | null, campaign: any) {
    if (!session?.user) {
      return false
    }

    // Only SUPER_ADMIN and CAMPAIGN_MANAGER can edit campaigns
    const canEditType = ["SUPER_ADMIN", "CAMPAIGN_MANAGER"].includes(session.user.role)
    if (!canEditType) {
      return false
    }

    // SUPER_ADMIN can edit any campaign, CAMPAIGN_MANAGER can only edit their own
    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const isOwner = campaign.createdBy === session.user.id
    
    // Only draft campaigns can be edited
    if (campaign.status !== 'DRAFT') {
      return false
    }
    
    return isSuperAdmin || isOwner
  }

  /**
   * Validates if user can delete a campaign
   */
  static canDeleteCampaign(session: Session | null, campaign: any) {
    if (!session?.user) {
      return false
    }

    // Only SUPER_ADMIN and CAMPAIGN_MANAGER can delete campaigns
    const canDeleteType = ["SUPER_ADMIN", "CAMPAIGN_MANAGER"].includes(session.user.role)
    if (!canDeleteType) {
      return false
    }

    // SUPER_ADMIN can delete any campaign, CAMPAIGN_MANAGER can only delete their own
    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const isOwner = campaign.createdBy === session.user.id
    
    return isSuperAdmin || isOwner
  }

  /**
   * Validates if user can launch a campaign
   */
  static canLaunchCampaign(session: Session | null, campaign: any) {
    if (!session?.user) {
      return false
    }
    
    // Only SUPER_ADMIN and CAMPAIGN_MANAGER can launch campaigns
    const canLaunchType = ["SUPER_ADMIN", "CAMPAIGN_MANAGER"].includes(session.user.role)
    if (!canLaunchType) {
      return false
    }
    
    // SUPER_ADMIN can launch any campaign, CAMPAIGN_MANAGER can only launch their own
    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const isOwner = campaign.createdBy === session.user.id
    
    return isSuperAdmin || isOwner
  }

  /**
   * Validates if user can duplicate a campaign
   */
  static canDuplicateCampaign(session: Session | null, campaign: any) {
    if (!session?.user) {
      return false
    }

    // Only SUPER_ADMIN and CAMPAIGN_MANAGER can duplicate campaigns
    const canDuplicateType = ["SUPER_ADMIN", "CAMPAIGN_MANAGER"].includes(session.user.role)
    if (!canDuplicateType) {
      return false
    }

    // SUPER_ADMIN can duplicate any campaign, CAMPAIGN_MANAGER can only duplicate their own
    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const isOwner = campaign.createdBy === session.user.id
    
    return isSuperAdmin || isOwner
  }

  /**
   * Validates if user can view campaign analytics
   */
  static canViewAnalytics(session: Session | null, campaign: any) {
    if (!session?.user) {
      return false
    }

    // Only SUPER_ADMIN and CAMPAIGN_MANAGER can view analytics
    const canViewType = ["SUPER_ADMIN", "CAMPAIGN_MANAGER"].includes(session.user.role)
    if (!canViewType) {
      return false
    }

    // SUPER_ADMIN can view any campaign analytics, CAMPAIGN_MANAGER can only view their own
    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const isOwner = campaign.createdBy === session.user.id
    
    return isSuperAdmin || isOwner
  }

  /**
   * Creates filter for campaign recipient lists
   */
  static getCampaignRecipientListFilter(session: Session | null) {
    if (!session?.user) {
      throw new Error("No session found")
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    
    // SUPER_ADMIN can see all campaign recipient lists, others only their own
    return isSuperAdmin ? {} : { campaign: { createdBy: session.user.id } }
  }

  /**
   * Creates filter for campaign test sends
   */
  static getCampaignTestSendFilter(session: Session | null) {
    if (!session?.user) {
      throw new Error("No session found")
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    
    // SUPER_ADMIN can see all campaign test sends, others only their own
    return isSuperAdmin ? {} : { campaign: { createdBy: session.user.id } }
  }

  /**
   * Creates filter for campaign activity logs
   */
  static getCampaignActivityLogFilter(session: Session | null) {
    if (!session?.user) {
      throw new Error("No session found")
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    
    // SUPER_ADMIN can see all campaign activity logs, others only their own
    return isSuperAdmin ? {} : { campaign: { createdBy: session.user.id } }
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
