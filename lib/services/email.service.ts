import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"
import nodemailer from "nodemailer"
import { UnsubscribeService } from "./unsubscribe.service"
import { prisma as prismaClient } from "@/app/lib/prisma"
import { decrypt } from "../security/encryption"
import { resolveSenderIdentity } from "./sender-identity"

const prisma = prismaClient as any

// ─── SES Client ──────────────────────────────────────────────────────────────

const sesClient = new SESv2Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

// ─── Types ───────────────────────────────────────────────────────────────────

import logger from '@/lib/logger'

export interface EmailRecipient {
  email: string
  firstName?: string | null
  lastName?: string | null
  contactId?: string | null
}

export interface SendEmailParams {
  to: EmailRecipient
  subject: string
  html: string
  fromName?: string
  fromEmail?: string
  replyTo?: string
  campaignId?: string
  contactId?: string
  userId?: string
}

export interface BulkSendResult {
  totalSent: number
  totalFailed: number
  failedEmails: string[]
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Replaces {{merge_tags}} in HTML with actual recipient data
 */
function personalize(html: string, recipient: EmailRecipient): string {
  return html
    .replace(/\{\{first_name\}\}/gi, recipient.firstName || "Friend")
    .replace(/\{\{last_name\}\}/gi, recipient.lastName || "")
    .replace(/\{\{full_name\}\}/gi, [recipient.firstName, recipient.lastName].filter(Boolean).join(" ") || "Friend")
    .replace(/\{\{email\}\}/gi, recipient.email)
}

// ─── Core Send Functions ──────────────────────────────────────────────────────

const transporter = nodemailer.createTransport({
  SES: { sesClient, SendEmailCommand }
} as any)

/**
 * Send a single email via AWS SES with tracking and List-Unsubscribe
 */
export async function sendSingleEmail(params: SendEmailParams): Promise<void> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000"
  const { fromName, fromEmail, replyToEmail } = resolveSenderIdentity({
    senderName: params.fromName,
    senderEmail: params.fromEmail,
    replyToEmail: params.replyTo
  })
  const contactId = params.to.contactId || params.contactId || 'unknown'
  const encodedEmail = encodeURIComponent(params.to.email)

  let processedHtml = personalize(params.html, params.to)

  // Secure Unsubscribe Token (uid)
  const uid = UnsubscribeService.encodeToken({
    cid: contactId,
    cam: params.campaignId || 'unknown',
    em: params.to.email
  })

  // Headers for RFC 8058 One-Click Unsubscribe
  const listUnsubscribeUrl = `${baseUrl}/api/unsubscribe?uid=${uid}`
  const footerUnsubscribeUrl = `${baseUrl}/unsubscribe?uid=${uid}`
  
  const currentTransporter = transporter

  await currentTransporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: params.to.email,
    subject: personalize(params.subject, params.to),
    html: processedHtml,
    replyTo: replyToEmail || undefined,
    headers: {
      'List-Unsubscribe': `<${listUnsubscribeUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    }
  })
}

/**
 * Send emails to a batch of recipients with rate limiting
 * AWS SES free tier: 200/day, production: 14/s
 */
export async function sendBulkEmails(
  recipients: EmailRecipient[],
  subject: string,
  html: string,
  options: {
    fromName?: string
    fromEmail?: string
    replyTo?: string
    campaignId?: string
    batchSize?: number
    delayMs?: number
    userId?: string
  } = {}
): Promise<BulkSendResult> {
  const batchSize = options.batchSize || 10   // send 10 at a time
  const delayMs = options.delayMs || 500      // 500ms between batches → ~20 emails/sec

  const result: BulkSendResult = {
    totalSent: 0,
    totalFailed: 0,
    failedEmails: [],
  }

  // Process in batches
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize)

    await Promise.allSettled(
      batch.map(async (recipient) => {
        try {
          await sendSingleEmail({
            to: recipient,
            subject,
            html,
            fromName: options.fromName,
            fromEmail: options.fromEmail,
            replyTo: options.replyTo,
            campaignId: options.campaignId,
            userId: options.userId,
          })
          result.totalSent++
        } catch (error) {
          logger.error({
            campaignId: options.campaignId,
            recipientEmail: recipient.email,
            errorName: (error as Error).name,
            errorMessage: (error as Error).message
          }, 'Bulk email send failed for recipient')
          result.totalFailed++
          result.failedEmails.push(recipient.email)
        }
      })
    )

    // Rate limiting delay between batches (skip after last batch)
    if (i + batchSize < recipients.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs))
    }
  }

  return result
}

/**
 * Send a simple transactional email (no tracking, no unsubscribe injection)
 * Used for: password reset, account notifications, system emails
 */
export async function sendTransactionalEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}): Promise<void> {
  await transporter.sendMail({
    from: process.env.SES_FROM_EMAIL,
    to,
    subject,
    html,
  })
}

