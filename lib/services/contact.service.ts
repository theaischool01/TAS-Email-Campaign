import { Session } from "next-auth"
import { PrismaClient } from '@prisma/client'
import { ContactAccessControl } from '@/lib/rbac/contact-access'

/**
 * Centralized contact data service for consistent RBAC across the platform
 */
export class ContactService {
  /**
   * Get contact count for dashboard analytics
   */
  static async getContactCount(session: Session | null, prisma: PrismaClient) {
    const filter = ContactAccessControl.getContactListVisibilityFilter(session)
    
    const count = await prisma.contactList.count({
      where: filter
    })
    
    console.log("📊 Dashboard Contact Count:", {
      filter,
      count,
      userId: session?.user?.id,
      userRole: session?.user?.role
    })
    
    return count
  }

  /**
   * Get contact lists for wizard
   */
  static async getContactLists(session: Session | null, prisma: PrismaClient, options: {
    search?: string
  } = {}) {
    const filter = ContactAccessControl.getContactListVisibilityFilter(session)
    
    let whereClause: any = { ...filter }
    
    // Add search filter
    if (options.search) {
      whereClause.name = {
        contains: options.search,
        mode: 'insensitive'
      }
    }
    
    const contactLists = await prisma.contactList.findMany({
      where: whereClause,
      include: {
        _count: {
          select: {
            members: true
          }
        },
        members: {
          where: {
            contact: {
              status: 'ACTIVE'
            }
          },
          select: {
            id: true
          }
        },
        owner: {
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
    
    // Transform to include activeCount
    const transformedLists = contactLists.map(list => ({
      ...list,
      memberCount: list._count?.members || 0,
      activeCount: list.members.length,
      members: undefined // Remove members array to keep response light
    }))
    
    console.log("🔧 Contact Lists Service Debug:", {
      filter: whereClause,
      count: transformedLists.length,
      firstList: transformedLists[0] ? {
        id: transformedLists[0].id,
        name: transformedLists[0].name,
        memberCount: transformedLists[0].memberCount,
        activeCount: transformedLists[0].activeCount,
        ownerId: transformedLists[0].ownerId
      } : null
    })
    
    return transformedLists
  }
}
