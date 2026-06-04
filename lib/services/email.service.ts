import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2"
import nodemailer from "nodemailer"
import { UnsubscribeService } from "./unsubscribe.service"

// ─── SES Client ──────────────────────────────────────────────────────────────

const sesClient = new SESv2Client({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

// ─── Types ───────────────────────────────────────────────────────────────────

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

/**
 * Injects an open-tracking pixel and unsubscribe link into campaign HTML
 */
function injectTrackingAndUnsubscribe(
  html: string,
  campaignId: string,
  recipient: EmailRecipient,
  baseUrl: string
): string {
  const contactId = recipient.contactId || 'unknown'
  const encodedEmail = encodeURIComponent(recipient.email)
  
  // 1. Unsubscribe URL
  const unsubscribeUrl = `${baseUrl}/unsubscribe?cid=${contactId}&campaign=${campaignId}&email=${encodedEmail}`
  
  // 2. Open Tracking Pixel (Path parameters as defined in API)
  const trackingPixel = `<img src="${baseUrl}/api/track/open/${campaignId}/${contactId}" width="1" height="1" alt="" style="border:0;width:1px;height:1px;" />`
  
  // 3. Link Wrapping (Click Tracking)
  // This regex finds all href="..." in <a> tags
  let processedHtml = html.replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi, (match, quote, url) => {
    // Skip anchor links, tel, mailto, and the unsubscribe link itself
    if (url.startsWith('#') || url.startsWith('tel:') || url.startsWith('mailto:') || url === unsubscribeUrl) {
      return match
    }
    const trackingUrl = `${baseUrl}/api/track/click/${campaignId}/${contactId}?url=${encodeURIComponent(url)}`
    return match.replace(url, trackingUrl)
  })

  const unsubscribeBar = `
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:20px;">
      <tr>
        <td style="padding:15px;text-align:center;font-family:Arial,sans-serif;font-size:11px;color:#888888;border-top:1px solid #e5e7eb;">
          You received this email because you are subscribed to our mailing list.<br/>
          <a href="${unsubscribeUrl}" style="color:#888888;text-decoration:underline;">Unsubscribe</a>
        </td>
      </tr>
    </table>
  `

  // Inject before </body> if present, otherwise append
  if (processedHtml.includes("</body>")) {
    return processedHtml.replace("</body>", `${trackingPixel}${unsubscribeBar}</body>`)
  }
  return processedHtml + trackingPixel + unsubscribeBar
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
  const fromEmail = params.fromEmail || process.env.SES_FROM_EMAIL || "noreply@example.com"
  const fromName = params.fromName || "Email Campaign Platform"
  const contactId = params.to.contactId || params.contactId || 'unknown'
  const encodedEmail = encodeURIComponent(params.to.email)

  let processedHtml = personalize(params.html, params.to)

  if (params.campaignId) {
    processedHtml = injectTrackingAndUnsubscribe(
      processedHtml,
      params.campaignId,
      params.to,
      baseUrl
    )
  }

  // Secure Unsubscribe Token (uid)
  const uid = UnsubscribeService.encodeToken({
    cid: contactId,
    cam: params.campaignId || 'unknown',
    em: params.to.email
  })

  // Headers for RFC 8058 One-Click Unsubscribe
  const listUnsubscribeUrl = `${baseUrl}/api/unsubscribe?uid=${uid}`
  const footerUnsubscribeUrl = `${baseUrl}/unsubscribe?uid=${uid}`
  
  await transporter.sendMail({
    from: `"${fromName}" <${fromEmail}>`,
    to: params.to.email,
    subject: personalize(params.subject, params.to),
    html: processedHtml,
    replyTo: params.replyTo,
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
          })
          result.totalSent++
        } catch (error) {
          console.error(`❌ EMAIL: Failed to send to ${recipient.email}:`, error)
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

