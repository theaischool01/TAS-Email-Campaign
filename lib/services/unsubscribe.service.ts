import { prisma as prismaClient } from "@/app/lib/prisma"

const prisma = prismaClient as any

export interface UnsubscribeTokenData {
  cid: string       // contactId
  cam: string       // campaignId
  em: string        // email
}

export class UnsubscribeService {
  /**
   * Encodes unsubscription data into a simple Base64 token
   * (In a real production app, this would be signed/encrypted)
   */
  static encodeToken(data: UnsubscribeTokenData): string {
    const json = JSON.stringify(data)
    return Buffer.from(json).toString('base64url')
  }

  /**
   * Decodes a token back into its data
   */
  static decodeToken(token: string): UnsubscribeTokenData | null {
    try {
      const json = Buffer.from(token, 'base64url').toString('utf8')
      return JSON.parse(json) as UnsubscribeTokenData
    } catch (e) {
      return null
    }
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

      // 2. Log activity
      if (cam) {
        await prisma.campaignActivityLog.create({
          data: {
            campaignId: cam,
            action: 'EMAIL_UNSUBSCRIBED',
            actorId: cid || 'anonymous',
            metadata: { 
              source,
              email: em,
              ip: metadata.ip,
              userAgent: metadata.userAgent,
              timestamp: new Date().toISOString()
            }
          }
        })
      }

      return { success: true, email: em }
    } catch (error) {
      console.error("Unsubscribe Action Error:", error)
      return { success: false, error: "Database error" }
    }
  }

  /**
   * Performs the re-subscribe action
   */
  static async resubscribe(token: string) {
    const data = this.decodeToken(token)
    if (!data) return { success: false, error: "Invalid token" }

    const { cid, em } = data

    try {
      if (cid && cid !== 'unknown') {
        await prisma.contact.update({
          where: { id: cid },
          data: { status: 'ACTIVE' }
        })
      } else if (em) {
        await prisma.contact.updateMany({
          where: { email: em },
          data: { status: 'ACTIVE' }
        })
      }
      return { success: true }
    } catch (error) {
      return { success: false, error: "Database error" }
    }
  }
}
