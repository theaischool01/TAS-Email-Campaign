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
   * Decodes a token back into its data, verifying signature and performing database-backed legacy checks
   */
  static async decodeToken(token: string): Promise<UnsubscribeTokenData | null> {
    const data = UnsubscribeTokenService.decodeToken(token)
    if (!data) return null

    // Backward compatibility: If the token does not contain a "." (unsigned legacy token)
    // The token service sets _isLegacy=true on legacy tokens for explicit signaling
    if (!token.includes('.') || data._isLegacy) {
      console.warn(`[LEGACY TOKEN WARNING] Unsigned legacy token decoded: ${token}`)
      const { cid, cam, em } = data

      try {
        if (cid && cid !== 'unknown') {
          // Case 1: cid is present and valid
          const contact = await prisma.contact.findUnique({
            where: { id: cid }
          })
          if (!contact) {
            console.warn(`[LEGACY TOKEN REJECTED] Contact ID ${cid} not found for legacy token`)
            return null
          }
          if (contact.email !== em) {
            console.warn(`[LEGACY TOKEN REJECTED] Email mismatch for contact ${cid}: token has ${em}, DB has ${contact.email}`)
            return null
          }
        } else if (cam && em) {
          // Case 2: cid is missing/unknown, but cam and em exist. Check CampaignActivityLog to prevent forgery
          const contact = await prisma.contact.findFirst({
            where: { email: em }
          })
          if (!contact) {
            console.warn(`[LEGACY TOKEN REJECTED] Contact with email ${em} not found for legacy token`)
            return null
          }

          // Check if an EMAIL_SENT activity exists for this campaign and contact
          const sentLog = await prisma.campaignActivityLog.findFirst({
            where: {
              campaignId: cam,
              contactId: contact.id,
              action: 'EMAIL_SENT'
            }
          })
          if (!sentLog) {
            console.warn(`[LEGACY TOKEN REJECTED] Forgery attempt or no sent email found for campaign ${cam} and email ${em}`)
            return null
          }
        } else {
          // Lacks sufficient identifiers to validate, reject to prevent email-only forgery
          console.warn(`[LEGACY TOKEN REJECTED] Token lacks sufficient context: cid=${cid}, cam=${cam}, em=${em}`)
          return null
        }
      } catch (error) {
        console.error(`[LEGACY TOKEN ERROR] Database error during legacy verification:`, error)
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
          where: { email: contact.email },
          update: { reason: `Unsubscribed from campaign ${cam || 'unknown'}` },
          create: { 
            email: contact.email, 
            reason: `Unsubscribed from campaign ${cam || 'unknown'}` 
          }
        })
      } else if (em) {
        await prisma.contact.updateMany({
          where: { email: em },
          data: { status: 'UNSUBSCRIBED' }
        })

        // Add to suppression list (upsert)
        await prisma.suppressionList.upsert({
          where: { email: em },
          update: { reason: `Unsubscribed (email only) from campaign ${cam || 'unknown'}` },
          create: { 
            email: em, 
            reason: `Unsubscribed (email only) from campaign ${cam || 'unknown'}` 
          }
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
    const data = await this.decodeToken(token)
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
    const data = await this.decodeToken(token)
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
      console.error("Log Preference Update Error:", error)
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
          where: { email: contact.email }
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

        // Remove from suppression list (safe delete)
        await prisma.suppressionList.deleteMany({
          where: { email: em }
        })
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
