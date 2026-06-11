import { prisma as prismaClient } from "@/app/lib/prisma"
import logger from '@/lib/logger'

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
   * Decodes a token back into its data, verifying signature and performing database-backed legacy checks
   */
  static async decodeToken(token: string): Promise<UnsubscribeTokenData | null> {
    const data = UnsubscribeTokenService.decodeToken(token)
    if (!data) return null

    // Backward compatibility: If the token does not contain a "." (unsigned legacy token)
    // The token service sets _isLegacy=true on legacy tokens for explicit signaling
    if (!token.includes('.') || data._isLegacy) {
      const { cid, cam, em } = data
      logger.warn({ cam, cid, em }, 'Legacy unsigned token detected — performing DB verification')

      try {
        if (cid && cid !== 'unknown') {
          const contact = await prisma.contact.findUnique({
            where: { id: cid }
          })
          if (!contact) {
            logger.warn({ cid, cam, em, reason: 'contact_not_found' }, 'Legacy token rejected')
            return null
          }
          if (contact.email !== em) {
            logger.warn({ cid, cam, reason: 'email_mismatch' }, 'Legacy token rejected')
            return null
          }
        } else if (cam && em) {
          const campaign = await prisma.campaign.findUnique({
            where: { id: cam },
            select: { createdBy: true }
          })
          if (!campaign) {
            logger.warn({ cam, em, reason: 'campaign_not_found' }, 'Legacy token rejected')
            return null
          }

          const contact = await prisma.contact.findFirst({
            where: { email: em, userId: campaign.createdBy }
          })
          if (!contact) {
            logger.warn({ cam, em, reason: 'contact_email_not_found' }, 'Legacy token rejected')
            return null
          }

          const sentLog = await prisma.campaignActivityLog.findFirst({
            where: {
              campaignId: cam,
              contactId: contact.id,
              action: 'EMAIL_SENT'
            }
          })
          if (!sentLog) {
            logger.warn({ cam, em, reason: 'no_sent_log_forgery_suspected' }, 'Legacy token rejected')
            return null
          }
        } else {
          logger.warn({ cid, cam, em, reason: 'insufficient_context' }, 'Legacy token rejected')
          return null
        }
      } catch (error) {
        logger.error({ cid, cam, em, errorName: (error as Error).name, errorMessage: (error as Error).message }, 'Legacy token DB verification failed')
        return null
      }
    }

    return data
  }

  /**
   * Performs the unsubscribe action
   */
  static async unsubscribe(
    token: string, 
    source: 'footer_link' | 'gmail_one_click' | 'preferences_center',
    metadata: { ip?: string, userAgent?: string } = {}
  ) {
    const data = await this.decodeToken(token)
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

      // 1. Update contact status and manage suppression list
      if (cid && cid !== 'unknown') {
        const contact = await prisma.contact.update({
          where: { id: cid },
          data: { status: 'UNSUBSCRIBED' }
        })
        
        // Add to suppression list (upsert)
        await prisma.suppressionList.upsert({
          where: {
            userId_email: {
              userId: contact.userId,
              email: contact.email
            }
          },
          update: { reason: `Unsubscribed from campaign ${cam || 'unknown'}` },
          create: { 
            userId: contact.userId,
            email: contact.email, 
            reason: `Unsubscribed from campaign ${cam || 'unknown'}` 
          }
        })
      } else if (em) {
        let campaignOwnerId = 'unknown'
        if (cam) {
          const campaign = await prisma.campaign.findUnique({
            where: { id: cam },
            select: { createdBy: true }
          })
          if (campaign) {
            campaignOwnerId = campaign.createdBy
          }
        }

        if (campaignOwnerId !== 'unknown') {
          await prisma.contact.updateMany({
            where: { email: em, userId: campaignOwnerId },
            data: { status: 'UNSUBSCRIBED' }
          })

          // Add to suppression list (upsert)
          await prisma.suppressionList.upsert({
            where: {
              userId_email: {
                userId: campaignOwnerId,
                email: em
              }
            },
            update: { reason: `Unsubscribed (email only) from campaign ${cam || 'unknown'}` },
            create: { 
              userId: campaignOwnerId,
              email: em, 
              reason: `Unsubscribed (email only) from campaign ${cam || 'unknown'}` 
            }
          })
        }
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
      logger.error({ campaignId: cam, contactId: cid, recipientEmail: em, errorName: (error as Error).name, errorMessage: (error as Error).message }, 'Unsubscribe action failed')
      return { success: false, error: "Database error" }
    }
  }

  /**
   * Gets all lists the contact belongs to
   */
  static async getContactLists(token: string) {
    const data = await this.decodeToken(token)
    if (!data) return null

    const { cid, em, cam } = data

    try {
      let contactWhere: any = {}
      if (cid && cid !== 'unknown') {
        contactWhere = { id: cid }
      } else if (em && cam) {
        const campaign = await prisma.campaign.findUnique({
          where: { id: cam },
          select: { createdBy: true }
        })
        if (campaign) {
          contactWhere = { email: em, userId: campaign.createdBy }
        } else {
          return null
        }
      } else {
        return null
      }

      // Find contact by ID or email
      const contact = await prisma.contact.findFirst({
        where: contactWhere,
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
      logger.error({ contactId: cid, recipientEmail: em, errorName: (error as Error).name, errorMessage: (error as Error).message }, 'Get contact lists failed')
      return null
    }
  }

  /**
   * Toggles subscription for a specific list
   * (NO LOGGING HERE - handled by page for bulk updates)
   */
  static async toggleListSubscription(token: string, listId: string, subscribe: boolean) {
    const data = await this.decodeToken(token)
    if (!data) return { success: false, error: "Invalid token" }

    const { cid, em, cam } = data

    try {
      let contactWhere: any = {}
      if (cid && cid !== 'unknown') {
        contactWhere = { id: cid }
      } else if (em && cam) {
        const campaign = await prisma.campaign.findUnique({
          where: { id: cam },
          select: { createdBy: true }
        })
        if (campaign) {
          contactWhere = { email: em, userId: campaign.createdBy }
        } else {
          return { success: false, error: "Campaign not found" }
        }
      } else {
        return { success: false, error: "Invalid identifier" }
      }

      // Find contact
      const contact = await prisma.contact.findFirst({
        where: contactWhere
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
      logger.error({ contactId: cid, listId, subscribe, errorName: (error as Error).name, errorMessage: (error as Error).message }, 'Toggle list subscription failed')
      return { success: false, error: "Database error" }
    }
  }

  /**
   * Log a preference update event
   */
  static async logPreferenceUpdate(token: string, metadata: any = {}) {
    const data = await this.decodeToken(token)
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
      logger.error({ campaignId: cam, contactId: cid, errorName: (error as Error).name, errorMessage: (error as Error).message }, 'Log preference update failed')
    }
  }

  /**
   * Performs the re-subscribe action
   */
  static async resubscribe(token: string) {
    const data = await this.decodeToken(token)
    if (!data) return { success: false, error: "Invalid token" }

    const { cid, em, cam } = data

    try {
      let contactId = cid;
      
      // 1. Update contact status to ACTIVE and remove from suppression list
      if (cid && cid !== 'unknown') {
        const contact = await prisma.contact.update({
          where: { id: cid },
          data: { status: 'ACTIVE' }
        })

        // Remove from suppression list (safe delete)
        await prisma.suppressionList.deleteMany({
          where: { userId: contact.userId, email: contact.email }
        })
      } else if (em) {
        let campaignOwnerId = 'unknown'
        if (cam) {
          const campaign = await prisma.campaign.findUnique({
            where: { id: cam },
            select: { createdBy: true }
          })
          if (campaign) {
            campaignOwnerId = campaign.createdBy
          }
        }

        if (campaignOwnerId !== 'unknown') {
          const contact = await prisma.contact.findFirst({
            where: { email: em, userId: campaignOwnerId }
          })
          if (contact) {
            contactId = contact.id;
            await prisma.contact.update({
              where: { id: contact.id },
              data: { status: 'ACTIVE' }
            })
          }

          // Remove from suppression list (safe delete)
          await prisma.suppressionList.deleteMany({
            where: { userId: campaignOwnerId, email: em }
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
      logger.error({ campaignId: cam, contactId: cid, recipientEmail: em, errorName: (error as Error).name, errorMessage: (error as Error).message }, 'Resubscribe action failed')
      return { success: false, error: "Database error" }
    }
  }
}
