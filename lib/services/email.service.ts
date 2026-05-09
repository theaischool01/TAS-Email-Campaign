import { SESClient, SendEmailCommand, SendBulkTemplatedEmailCommand } from "@aws-sdk/client-ses"

// ─── SES Client ──────────────────────────────────────────────────────────────

const sesClient = new SESClient({
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
  recipientEmail: string,
  baseUrl: string
): string {
  const encodedEmail = encodeURIComponent(recipientEmail)
  const unsubscribeUrl = `${baseUrl}/api/unsubscribe?email=${encodedEmail}&campaign=${campaignId}`
  const trackingPixel = `<img src="${baseUrl}/api/track/open?c=${campaignId}&e=${encodedEmail}" width="1" height="1" style="display:none;" alt="" />`
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
  if (html.includes("</body>")) {
    return html.replace("</body>", `${trackingPixel}${unsubscribeBar}</body>`)
  }
  return html + trackingPixel + unsubscribeBar
}

// ─── Core Send Functions ──────────────────────────────────────────────────────

/**
 * Send a single email via AWS SES
 */
export async function sendSingleEmail(params: SendEmailParams): Promise<void> {
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
  const fromEmail = params.fromEmail || process.env.SES_FROM_EMAIL || "noreply@example.com"
  const fromName = params.fromName || "Email Campaign Platform"
  const source = `"${fromName}" <${fromEmail}>`

  let processedHtml = personalize(params.html, params.to)

  if (params.campaignId) {
    processedHtml = injectTrackingAndUnsubscribe(
      processedHtml,
      params.campaignId,
      params.to.email,
      baseUrl
    )
  }

  const command = new SendEmailCommand({
    Source: source,
    Destination: {
      ToAddresses: [params.to.email],
    },
    Message: {
      Subject: {
        Data: personalize(params.subject, params.to),
        Charset: "UTF-8",
      },
      Body: {
        Html: {
          Data: processedHtml,
          Charset: "UTF-8",
        },
      },
    },
    ...(params.replyTo && {
      ReplyToAddresses: [params.replyTo],
    }),
  })

  await sesClient.send(command)
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
