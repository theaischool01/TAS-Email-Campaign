import { Session } from "next-auth"
import { PrismaClient } from '@prisma/client'
import { TemplateVisibilityFilter, isImpossibleFilter } from "@/types/rbac"

export interface UserSession {
  id: string
  email: string
  name: string
  role: string
}

/**
 * CENTRALIZED TEMPLATE RBAC VISIBILITY LOGIC
 * This is the SINGLE SOURCE OF TRUTH for template access
 */
export class TemplateAccessControl {
  /**
   * Get visibility filter for templates based on user role
   */
  static getTemplateVisibilityFilter(session: Session | null): TemplateVisibilityFilter {
    if (!session?.user) {
      throw new Error("No session found")
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const isManager = session.user.role === "CAMPAIGN_MANAGER"
    const isViewer = session.user.role === "VIEWER"
    console.log("🔍 Template Access Debug:", {
      role: session.user.role,
      userId: session.user.id,
      isSuperAdmin,
      isManager,
      isViewer
    })
    // SUPER_ADMIN: sees all templates (unfiltered access)
    if (isSuperAdmin) {
      console.log("📊 Admin visibility filter: ALL templates")
      return {} 
    }
    // CAMPAIGN_MANAGER: sees own templates + public templates
    if (isManager) {
      const filter = {
        OR: [
          { createdBy: session.user.id }, // Own templates
          { isPublic: true } // Public starter templates
        ]
      }
      console.log("📊 Manager visibility filter:", filter)
      return filter
    }
    // VIEWER: sees public templates only (preview-only access)
    if (isViewer) {
      const filter = { isPublic: true }
      console.log("📊 Viewer visibility filter:", filter)
      return filter
    }
    // Default: no access
    console.log("📊 Default visibility filter: NO ACCESS")
    return { id: "__no_access_impossible__" } // Impossible filter
  }

  /**
   * Check if user can edit a specific template
   */
  static canEditTemplate(session: Session | null, template: any) {
    if (!session?.user) return false

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const isManager = session.user.role === "CAMPAIGN_MANAGER"

    // SUPER_ADMIN can edit any template
    if (isSuperAdmin) {
      console.log("✅ Admin can edit template:", template.id)
      return true
    }

    // CAMPAIGN_MANAGER can edit own templates only
    if (isManager && template.createdBy === session.user.id) {
      console.log("✅ Manager can edit own template:", template.id)
      return true
    }

    console.log("❌ User cannot edit template:", template.id, "role:", session.user.role)
    return false
  }

  /**
   * Check if user can delete a specific template
   */
  static canDeleteTemplate(session: Session | null, template: any) {
    if (!session?.user) return false

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const isManager = session.user.role === "CAMPAIGN_MANAGER"

    // SUPER_ADMIN can delete any template
    if (isSuperAdmin) {
      console.log("✅ Admin can delete template:", template.id)
      return true
    }

    // CAMPAIGN_MANAGER can delete own templates only
    if (isManager && template.createdBy === session.user.id) {
      console.log("✅ Manager can delete own template:", template.id)
      return true
    }

    console.log("❌ User cannot delete template:", template.id, "role:", session.user.role)
    return false
  }

  /**
   * Check if user can duplicate a specific template
   */
  static canDuplicateTemplate(session: Session | null, template: any) {
    if (!session?.user) return false

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const isManager = session.user.role === "CAMPAIGN_MANAGER"
    const isViewer = session.user.role === "VIEWER"

    // SUPER_ADMIN can duplicate any template
    if (isSuperAdmin) {
      console.log("✅ Admin can duplicate template:", template.id)
      return true
    }

    // CAMPAIGN_MANAGER can duplicate public templates and own templates
    if (isManager && (template.isPublic || template.createdBy === session.user.id)) {
      console.log("✅ Manager can duplicate template:", template.id, "public:", template.isPublic)
      return true
    }

    // VIEWER cannot duplicate (preview-only)
    if (isViewer) {
      console.log("❌ Viewer cannot duplicate template:", template.id)
      return false
    }

    console.log("❌ User cannot duplicate template:", template.id, "role:", session.user.role)
    return false
  }

  /**
   * Check if user can preview a specific template
   */
  static canPreviewTemplate(session: Session | null, template: any) {
    if (!session?.user) return false

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const isManager = session.user.role === "CAMPAIGN_MANAGER"
    const isViewer = session.user.role === "VIEWER"

    // SUPER_ADMIN can preview any template
    if (isSuperAdmin) {
      console.log("✅ Admin can preview template:", template.id)
      return true
    }

    // CAMPAIGN_MANAGER can preview public templates and own templates
    if (isManager && (template.isPublic || template.createdBy === session.user.id)) {
      console.log("✅ Manager can preview template:", template.id)
      return true
    }

    // VIEWER can preview public templates only
    if (isViewer && template.isPublic) {
      console.log("✅ Viewer can preview public template:", template.id)
      return true
    }

    console.log("❌ User cannot preview template:", template.id, "role:", session.user.role)
    return false
  }

  /**
   * Get template count for dashboard analytics
   * Uses same visibility logic as listing
   */
  static async getTemplateCount(session: Session | null, prisma: PrismaClient) {
    const visibilityFilter = this.getTemplateVisibilityFilter(session)
    
    // Handle impossible filter for no access
    if (isImpossibleFilter(visibilityFilter)) {
      console.log("📊 Template count: 0 (no access)")
      return 0
    }

    const count = await prisma.emailTemplate.count({
      where: visibilityFilter
    })

    console.log("📊 Template count result:", count, "filter:", visibilityFilter)
    return count
  }
}
