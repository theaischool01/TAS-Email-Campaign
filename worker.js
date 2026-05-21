const { PrismaClient } = require('@prisma/client');
// FORCE DEPLOY TIMESTAMP: 2026-05-11 00:39 AM
const cron = require('node-cron');
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, GetQueueUrlCommand, CreateQueueCommand, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const http = require('http');

const UnsubscribeTokenService = require('./lib/services/unsubscribe-token');

// EMERGENCY LOGGING: Catch any crash and write it to a file
const logPath = path.join(process.cwd(), 'worker-error.log');
function logError(err) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] CRASH: ${err.stack || err}\n`;
  fs.appendFileSync(logPath, message);
  console.error(message);
}

process.on('uncaughtException', logError);
process.on('unhandledRejection', logError);

console.log('🚀 Worker is initializing...');
fs.appendFileSync(logPath, `\n--- Worker Started at ${new Date().toISOString()} ---\n`);

// Render requires a web server to stay alive on the free tier
const PORT = process.env.PORT || 3001;
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Worker is running and healthy!\n');
}).listen(PORT);

const prisma = new PrismaClient();
const awsConfig = {
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
};

const sqsClient = new SQSClient(awsConfig);
const sesClient = new SESv2Client(awsConfig);
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  SES: { sesClient, SendEmailCommand }
});

const QUEUE_NAME = "EmailDispatchQueue";
let queueUrl = null;

async function getQueueUrl() {
  if (queueUrl) return queueUrl;
  try {
    const command = new GetQueueUrlCommand({ QueueName: QUEUE_NAME });
    const response = await sqsClient.send(command);
    queueUrl = response.QueueUrl;
    return queueUrl;
  } catch (error) {
    console.log(`Queue detection error, attempting creation...`);
    const command = new CreateQueueCommand({ QueueName: QUEUE_NAME });
    const response = await sqsClient.send(command);
    queueUrl = response.QueueUrl;
    return queueUrl;
  }
}

// ─── Scheduler ───────────────────────────────────────────────────────────────
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const scheduledCampaigns = await prisma.campaign.findMany({
      where: { status: 'SCHEDULED', scheduledAt: { lte: now } },
      include: {
        recipientLists: { include: { contactList: { include: { members: { include: { contact: true } } } } } },
        excludedLists: true,
        template: true
      }
    });

    for (const campaign of scheduledCampaigns) {
      console.log(`🚀 Launching Campaign: ${campaign.name}`);

      let suppressedSet = new Set();
      try {
        const suppressedEmails = await prisma.suppressionList.findMany({
          select: { email: true }
        });
        suppressedSet = new Set(suppressedEmails.map(s => s.email));
      } catch (err) {
        if (err?.code === 'P2021') {
          console.warn('⚠️ suppression_list missing; continuing without suppression filter');
        } else {
          throw err;
        }
      }

      const excludedContactListIds = (campaign.excludedLists || []).map(el => el.contactListId);
      let excludedContactIds = new Set();
      if (excludedContactListIds.length > 0) {
        const excludedMembers = await prisma.contactListMember.findMany({
          where: { contactListId: { in: excludedContactListIds } },
          select: { contactId: true }
        });
        excludedContactIds = new Set(excludedMembers.map(m => m.contactId));
      }

      const recipientsMap = new Map();
      for (const rl of campaign.recipientLists || []) {
        for (const m of rl.contactList?.members || []) {
          const contact = m.contact;
          if (!contact) continue;
          if (excludedContactIds.has(contact.id)) continue;
          if (contact.status !== 'ACTIVE') continue;
          if (suppressedSet.has(contact.email)) continue;
          if (!recipientsMap.has(contact.email)) {
            recipientsMap.set(contact.email, {
              email: contact.email,
              firstName: contact.firstName,
              lastName: contact.lastName,
              contactId: contact.id
            });
          }
        }
      }

      const recipients = Array.from(recipientsMap.values());
      console.log('Scheduler recipients:', recipients.length);

      if (!recipients.length) {
        console.warn(`⚠️ No recipients for scheduled campaign ${campaign.id}; skipping`);
        continue;
      }

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'SENDING', recipientCount: recipients.length, sentAt: new Date(), totalSent: 0 }
      });

      const qUrl = await getQueueUrl();
      for (const recipient of recipients) {
        await sqsClient.send(new SendMessageCommand({
          QueueUrl: qUrl,
          MessageBody: JSON.stringify({ campaignId: campaign.id, recipient })
        }));
      }
    }
  } catch (error) {
    console.error('❌ Scheduler Error:', error);
  }
});

// ─── Queue Processor ─────────────────────────────────────────────────────────
async function processQueue() {
  console.log('📬 Worker initialized and listening for messages...');
  const qUrl = await getQueueUrl();

  while (true) {
    try {
      const response = await sqsClient.send(new ReceiveMessageCommand({
        QueueUrl: qUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20
      }));

      if (!response.Messages || response.Messages.length === 0) {
        continue;
      }

      for (const message of response.Messages) {
        const { campaignId, recipient } = JSON.parse(message.Body);
        
        try {
          const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            include: { template: true }
          });

          if (!campaign || campaign.status !== 'SENDING') {
            await sqsClient.send(new DeleteMessageCommand({ QueueUrl: qUrl, ReceiptHandle: message.ReceiptHandle }));
            continue;
          }

          // FINAL PROTECTION: Check if recipient unsubscribed or is suppressed right before sending
          const contact = await prisma.contact.findFirst({
            where: { email: recipient.email },
            select: { status: true }
          });
          
          const isSuppressed = await prisma.suppressionList.findUnique({
            where: { email: recipient.email }
          });

          if ((contact && contact.status !== 'ACTIVE') || isSuppressed) {
            console.log(`⏩ Skipping ${recipient.email}: Contact is ${contact?.status || 'UNKNOWN'} or suppressed.`);
            await sqsClient.send(new DeleteMessageCommand({ QueueUrl: qUrl, ReceiptHandle: message.ReceiptHandle }));
            
            // Increment failed/skipped count to ensure campaign completion logic works
            await prisma.campaign.update({
              where: { id: campaignId },
              data: { totalFailed: { increment: 1 } }
            });
            continue;
          }

          let fromEmail = campaign.senderEmail || process.env.SES_FROM_EMAIL;
          if (fromEmail.includes('example.com')) {
            fromEmail = process.env.SES_FROM_EMAIL;
          }
          
          const fromName = campaign.senderName || "Marketing Team";
          const appUrl = process.env.NEXT_PUBLIC_APP_URL;
          
          if (!appUrl) {
            throw new Error("CRITICAL: NEXT_PUBLIC_APP_URL is missing in environment variables.");
          }

          const contactId = recipient.contactId || 'unknown';
          
          // Secure Unsubscribe Token (uid)
          const uid = UnsubscribeTokenService.encodeToken({
            cid: contactId,
            cam: campaignId,
            em: recipient.email
          });

          const footerUnsubscribeUrl = `${appUrl}/unsubscribe?uid=${uid}`;
          const trackingPixel = `<img src="${appUrl}/api/track/open/${campaignId}/${contactId}" width="1" height="1" style="display:none !important;visibility:hidden;" />`;
          
          let emailHtml = campaign.template?.html || "No content";
          
          // 1. Core replacements
          emailHtml = emailHtml.replace(/{{first_name}}/gi, recipient.firstName || 'Friend');
          emailHtml = emailHtml.replace(/{{last_name}}/gi, recipient.lastName || '');
          emailHtml = emailHtml.replace(/{{email}}/gi, recipient.email);
          emailHtml = emailHtml.replace(/{{UNSUBSCRIBE_URL}}/gi, footerUnsubscribeUrl);

          // 2. Click Tracking (Safe wrap)
          // Restore manual wrapping only for normal external links
          emailHtml = emailHtml.replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi, (match, quote, url) => {
            if (url.startsWith('#') || url.startsWith('tel:') || url.startsWith('mailto:') || 
                url === footerUnsubscribeUrl || url.includes('/unsubscribe')) {
              return match;
            }
            if (!url.startsWith('http')) return match;
            
            const trackingUrl = `${appUrl}/api/track/click/${campaignId}/${contactId}?url=${encodeURIComponent(url)}`;
            return match.replace(url, trackingUrl);
          });

          // 3. Final Injection (Append tracking pixel at end of body if exists)
          if (emailHtml.includes('</body>')) {
            emailHtml = emailHtml.replace('</body>', `${trackingPixel}</body>`);
          } else {
            emailHtml = emailHtml + trackingPixel;
          }
          
          const fullHtml = emailHtml;

          // List-Unsubscribe Header implementation
          const listUnsubscribeUrl = `${appUrl}/api/unsubscribe?uid=${uid}`;
          
          // Inject unsubscribe footer securely
          const unsubscribeBar = `
            <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-top:20px;">
              <tr>
                <td style="padding:15px;text-align:center;font-family:Arial,sans-serif;font-size:11px;color:#888888;border-top:1px solid #e5e7eb;">
                  You received this email because you are subscribed to our mailing list.<br/>
                  <a href="${footerUnsubscribeUrl}" style="color:#888888;text-decoration:underline;">Unsubscribe</a> | 
                  <a href="${appUrl}/preferences?uid=${uid}" style="color:#888888;text-decoration:underline;">Manage Preferences</a>
                </td>
              </tr>
            </table>
          `;

          const finalHtml = fullHtml.includes('</body>') 
            ? fullHtml.replace('</body>', `${unsubscribeBar}</body>`) 
            : `${fullHtml}${unsubscribeBar}`;

          await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: recipient.email,
            subject: campaign.subject,
            html: finalHtml,
            headers: {
              'List-Unsubscribe': `<${listUnsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              'X-Campaign-ID': campaignId,
              'X-Contact-ID': contactId
            },
            ses: {
              Tags: [
                { Name: 'campaignId', Value: campaignId },
                { Name: 'contactId', Value: contactId }
              ]
            }
          });

          const updated = await prisma.campaign.update({
            where: { id: campaignId },
            data: { totalSent: { increment: 1 } }
          });

          // Log EMAIL_SENT activity
          await prisma.campaignActivityLog.create({
            data: {
              campaignId,
              action: 'EMAIL_SENT',
              actorId: contactId,
              contactId: contactId,
              metadata: {
                email: recipient.email,
                timestamp: new Date().toISOString()
              }
            }
          });

          if (updated.totalSent + updated.totalFailed >= updated.recipientCount) {
            await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'SENT' } });
          }

          await sqsClient.send(new DeleteMessageCommand({ QueueUrl: qUrl, ReceiptHandle: message.ReceiptHandle }));
        } catch (error) {
          console.error(`❌ Error sending to ${recipient.email}:`, error);
          await prisma.campaign.update({ where: { id: campaignId }, data: { totalFailed: { increment: 1 } } });
          
          await prisma.campaignActivityLog.create({
            data: {
              campaignId,
              action: 'SEND_FAILED',
              actorId: 'system-worker',
              metadata: { email: recipient.email, error: error.message }
            }
          });

          await sqsClient.send(new DeleteMessageCommand({ QueueUrl: qUrl, ReceiptHandle: message.ReceiptHandle }));
        }
      }
    } catch (error) {
      console.error('❌ Queue Error:', error);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

processQueue();
