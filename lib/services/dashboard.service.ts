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
    
    console.log("📊 Dashboard Template Count:", {
      filter,
      count,
      userId: session?.user?.id,
      userRole: session?.user?.role
    })
    
    return count
  }
}
