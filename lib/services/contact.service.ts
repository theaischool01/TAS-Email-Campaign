import { Session } from "next-auth"
import { PrismaClient } from '@prisma/client'
import { ContactAccessControl } from '@/lib/rbac/contact-access'
import logger from '@/lib/logger'

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
    
    logger.debug({ userId: session?.user?.id, userRole: session?.user?.role, count }, 'Dashboard contact count fetched')
    
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
    
    logger.debug({ userId: session?.user?.id, count: transformedLists.length }, 'Contact lists fetched')
    
    return transformedLists
  }
}
