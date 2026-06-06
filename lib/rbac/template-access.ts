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

    // Visibility filter: show templates where isSystem === true OR createdBy === session.user.id
    return {
      OR: [
        { isSystem: true },
        { createdBy: session.user.id }
      ]
    } as any
  }

  /**
   * Check if user can edit a specific template
   */
  static canEditTemplate(session: Session | null, template: any) {
    if (!session?.user) return false

    // Edit only allowed on own templates where isSystem === false
    return template.createdBy === session.user.id && template.isSystem === false
  }

  /**
   * Check if user can delete a specific template
   */
  static canDeleteTemplate(session: Session | null, template: any) {
    if (!session?.user) return false

    // Delete only allowed on own templates where isSystem === false
    return template.createdBy === session.user.id && template.isSystem === false
  }

  /**
   * Check if user can duplicate a specific template
   */
  static canDuplicateTemplate(session: Session | null, template: any) {
    if (!session?.user) return false

    // Can duplicate own templates or system templates
    return template.createdBy === session.user.id || template.isSystem === true
  }

  /**
   * Check if user can preview a specific template
   */
  static canPreviewTemplate(session: Session | null, template: any) {
    if (!session?.user) return false

    // Can preview own templates or system templates
    return template.createdBy === session.user.id || template.isSystem === true
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
      where: visibilityFilter as any
    })

    console.log("📊 Template count result:", count, "filter:", visibilityFilter)
    return count
  }
}
