import { prisma as prismaClient } from "@/app/lib/prisma"

const prisma = prismaClient as any

// @ts-ignore - CommonJS import in TS
const UnsubscribeTokenService = require('./unsubscribe-token');

export interface UnsubscribeTokenData {
  cid: string       // contactId
  cam: string       // campaignId
  em: string        // email
}

export class UnsubscribeService {
  /**
   * Encodes unsubscription data into a simple Base64 token
   */
  static encodeToken(data: UnsubscribeTokenData): string {
    return UnsubscribeTokenService.encodeToken(data)
  }

  /**
   * Decodes a token back into its data
   */
  static decodeToken(token: string): UnsubscribeTokenData | null {
    return UnsubscribeTokenService.decodeToken(token)
  }

  /**
   * Performs the unsubscribe action
   */
  static async unsubscribe(
    token: string, 
    source: 'footer_link' | 'gmail_one_click' | 'preferences_center',
    metadata: { ip?: string, userAgent?: string } = {}
  ) {
    const data = this.decodeToken(token)
    if (!data) return { success: false, error: "Invalid token" }

    const { cid, cam, em } = data

    try {
      // 0. Check if already unsubscribed for this campaign to prevent double-counting
      let existingUnsub = null
      if (cam) {
        existingUnsub = await prisma.campaignActivityLog.findFirst({
          where: { campaignId: cam, contactId: cid || undefined, action: 'EMAIL_UNSUBSCRIBED' }
        })
      }

      // 1. Update contact status
      if (cid && cid !== 'unknown') {
        await prisma.contact.update({
          where: { id: cid },
          data: { status: 'UNSUBSCRIBED' }
        })
      } else if (em) {
        await prisma.contact.updateMany({
          where: { email: em },
          data: { status: 'UNSUBSCRIBED' }
        })
      }

      // 2. Log activity and increment metrics (only if first time)
      if (cam && !existingUnsub) {
        await prisma.campaignActivityLog.create({
          data: {
            campaignId: cam,
            action: 'EMAIL_UNSUBSCRIBED',
            actorId: cid || 'anonymous',
            contactId: cid || undefined,
            metadata: { 
              source,
              email: em,
              ip: metadata.ip,
              userAgent: metadata.userAgent,
              timestamp: new Date().toISOString()
            }
          }
        })

        // Increment campaign metric
        await prisma.campaign.update({
          where: { id: cam },
          data: { totalUnsubscribed: { increment: 1 } }
        })
      }

      return { success: true, email: em }
    } catch (error) {
      console.error("Unsubscribe Action Error:", error)
      return { success: false, error: "Database error" }
    }
  }

  /**
   * Gets all lists the contact belongs to
   */
  static async getContactLists(token: string) {
    const data = this.decodeToken(token)
    if (!data) return null

    const { cid, em } = data

    try {
      // Find contact by ID or email
      const contact = await prisma.contact.findFirst({
        where: cid && cid !== 'unknown' ? { id: cid } : { email: em },
        include: {
          lists: {
            include: {
              contactList: true
            }
          }
        }
      })

      if (!contact) return null

      return {
        email: contact.email,
        status: contact.status,
        lists: contact.lists.map((l: any) => ({
          id: l.contactList.id,
          name: l.contactList.name,
          description: l.contactList.description,
          subscribedAt: l.createdAt
        }))
      }
    } catch (error) {
      console.error("Get Contact Lists Error:", error)
      return null
    }
  }

  /**
   * Toggles subscription for a specific list
   * (NO LOGGING HERE - handled by page for bulk updates)
   */
  static async toggleListSubscription(token: string, listId: string, subscribe: boolean) {
    const data = this.decodeToken(token)
    if (!data) return { success: false, error: "Invalid token" }

    const { cid, em } = data

    try {
      // Find contact
      const contact = await prisma.contact.findFirst({
        where: cid && cid !== 'unknown' ? { id: cid } : { email: em }
      })

      if (!contact) return { success: false, error: "Contact not found" }

      if (subscribe) {
        // Add to list if not already there
        await prisma.contactListMember.upsert({
          where: {
            contactListId_contactId: {
              contactListId: listId,
              contactId: contact.id
            }
          },
          update: {},
          create: {
            contactListId: listId,
            contactId: contact.id
          }
        })
      } else {
        // Remove from list
        await prisma.contactListMember.deleteMany({
          where: {
            contactListId: listId,
            contactId: contact.id
          }
        })
      }

      return { success: true }
    } catch (error) {
      console.error("Toggle List Error:", error)
      return { success: false, error: "Database error" }
    }
  }

  /**
   * Log a preference update event
   */
  static async logPreferenceUpdate(token: string, metadata: any = {}) {
    const data = this.decodeToken(token)
    if (!data) return

    const { cid, cam, em } = data

    try {
      // Deduplication check
      const recentUpdate = await prisma.campaignActivityLog.findFirst({
        where: { 
          campaignId: cam, 
          contactId: cid || undefined, 
          action: 'PREFERENCES_UPDATED',
          createdAt: {
            gte: new Date(Date.now() - 5000) // 5 seconds ago
          }
        }
      })

      if (recentUpdate) return

      await prisma.campaignActivityLog.create({
        data: {
          campaignId: cam,
          action: 'PREFERENCES_UPDATED',
          actorId: cid || 'anonymous',
          contactId: cid || undefined,
          metadata: {
            ...metadata,
            email: em,
            timestamp: new Date().toISOString()
          }
        }
      })
    } catch (error) {
      console.error("Log Preference Update Error:", error)
    }
  }

  /**
   * Performs the re-subscribe action
   */
  static async resubscribe(token: string) {
    const data = this.decodeToken(token)
    if (!data) return { success: false, error: "Invalid token" }

    const { cid, em, cam } = data

    try {
      let contactId = cid;
      
      // 1. Update contact status to ACTIVE
      if (cid && cid !== 'unknown') {
        await prisma.contact.update({
          where: { id: cid },
          data: { status: 'ACTIVE' }
        })
      } else if (em) {
        const contact = await prisma.contact.findFirst({ where: { email: em } });
        if (contact) {
          contactId = contact.id;
          await prisma.contact.update({
            where: { id: contact.id },
            data: { status: 'ACTIVE' }
          })
        }
      }

      // 2. Log EMAIL_RESUBSCRIBED with deduplication
      if (contactId && contactId !== 'unknown') {
        const recentResub = await prisma.campaignActivityLog.findFirst({
          where: { 
            campaignId: cam, 
            contactId: contactId, 
            action: 'EMAIL_RESUBSCRIBED',
            createdAt: {
              gte: new Date(Date.now() - 10000) // 10 seconds ago
            }
          }
        })

        if (!recentResub) {
          await prisma.campaignActivityLog.create({
            data: {
              campaignId: cam,
              action: 'EMAIL_RESUBSCRIBED',
              actorId: contactId,
              contactId: contactId,
              metadata: {
                source: 'preferences_center_resubscribe',
                email: em,
                timestamp: new Date().toISOString()
              }
            }
          })
        }
      }

      return { success: true }
    } catch (error) {
      console.error("Resubscribe Error:", error);
      return { success: false, error: "Database error" }
    }
  }
}
