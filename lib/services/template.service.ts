import { Session } from "next-auth"
import { PrismaClient } from '@prisma/client'
import { TemplateAccessControl } from '@/lib/rbac/template-access'

/**
 * Centralized template data service for consistent RBAC across the platform
 */
export class TemplateService {
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

  /**
   * Get templates for wizard selection
   */
  static async getTemplates(session: Session | null, prisma: PrismaClient, options: {
    search?: string
    category?: string
  } = {}) {
    const filter = TemplateAccessControl.getTemplateVisibilityFilter(session)
    
    let whereClause: any = { ...filter }
    
    // Add search filter
    if (options.search) {
      whereClause = {
        AND: [
          whereClause,
          {
            name: {
              contains: options.search,
              mode: 'insensitive'
            }
          }
        ]
      }
    }
    
    // Add category filter
    if (options.category) {
      if (whereClause.AND) {
        whereClause.AND.push({
          category: {
            contains: options.category,
            mode: 'insensitive'
          }
        })
      } else {
        whereClause = {
          AND: [
            whereClause,
            {
              category: {
                contains: options.category,
                mode: 'insensitive'
              }
            }
          ]
        }
      }
    }
    
    const templates = await prisma.emailTemplate.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            campaigns: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    
    console.log("🔧 Template Service Debug:", {
      filter: whereClause,
      count: templates.length,
      firstTemplate: templates[0] ? {
        id: templates[0].id,
        name: templates[0].name,
        isPublic: templates[0].isPublic,
        ownerId: templates[0].createdBy
      } : null
    })
    
    return templates
  }
}
