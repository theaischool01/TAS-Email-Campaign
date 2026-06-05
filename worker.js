const logger = require('./lib/worker-logger');
const { PrismaClient } = require('@prisma/client');
// FORCE DEPLOY TIMESTAMP: 2026-05-11 00:39 AM
const cron = require('node-cron');
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, GetQueueUrlCommand, CreateQueueCommand, SendMessageCommand, ChangeMessageVisibilityCommand, GetQueueAttributesCommand, SetQueueAttributesCommand } = require('@aws-sdk/client-sqs');
const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// --- Startup env validation ---
const REQUIRED_ENV_VARS = [
  'AWS_REGION',
  'AWS_SECRET_ACCESS_KEY',
  'SES_FROM_EMAIL',
  'NEXTAUTH_SECRET',
];

// At least one of these must be present for AWS access key
const hasAwsKey = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY;
if (!hasAwsKey) {
  console.error('FATAL: Missing required env var: AWS_ACCESS_KEY_ID or AWS_ACCESS_KEY');
  process.exit(1);
}

const missingVars = REQUIRED_ENV_VARS.filter(key => !process.env[key]);
if (missingVars.length > 0) {
  console.error(`FATAL: Missing required env vars: ${missingVars.join(', ')}`);
  process.exit(1);
}
// --- End env validation ---
const http = require('http');

const UnsubscribeTokenService = require('./lib/services/unsubscribe-token');

// EMERGENCY LOGGING: Catch any crash and write it to a file
const logPath = path.join(process.cwd(), 'worker-error.log');
function logError(err) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] CRASH: ${err.stack || err}\n`;
  fs.appendFileSync(logPath, message);
  logger.error(message);
}

process.on('uncaughtException', logError);
process.on('unhandledRejection', logError);

logger.info('🚀 Worker is initializing...');
fs.appendFileSync(logPath, `\n--- Worker Started at ${new Date().toISOString()} ---\n`);

const PORT = process.env.PORT || 3001;
let globalEmailsProcessed = 0;
let globalLastProcessedAt = null;
let isPollingActive = false;

http.createServer((req, res) => {
  const health = {
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    metrics: {
      emailsProcessed: globalEmailsProcessed,
      lastProcessedAt: globalLastProcessedAt,
      isPollingActive: isPollingActive
    }
  }
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(health));
}).listen(PORT, () => {
  logger.info(`🏥 Worker health endpoint running on port ${PORT}`);
});

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

const QUEUE_NAME = process.env.SQS_QUEUE_NAME || "EmailDispatchQueue";
let queueUrl = null;

const SES_RATE_PER_SECOND = parseInt(process.env.SES_RATE_PER_SECOND) || 10
const SES_MIN_DELAY_MS = Math.ceil(1000 / SES_RATE_PER_SECOND)

async function getQueueUrl() {
  if (queueUrl) return queueUrl;

  const DLQ_NAME = `${QUEUE_NAME}_DLQ`;

  // Step 1: Create or retrieve DLQ
  let dlqUrl;
  try {
    const dlqRes = await sqsClient.send(new CreateQueueCommand({
      QueueName: DLQ_NAME,
      Attributes: { VisibilityTimeout: '120' }
    }));
    dlqUrl = dlqRes.QueueUrl;
    logger.info({ dlqUrl }, 'DLQ created');
  } catch (err) {
    logger.info('DLQ already exists, fetching URL...');
    const dlqRes = await sqsClient.send(new GetQueueUrlCommand({ QueueName: DLQ_NAME }));
    dlqUrl = dlqRes.QueueUrl;
  }

  // Step 2: Get DLQ ARN
  const attrsRes = await sqsClient.send(new GetQueueAttributesCommand({
    QueueUrl: dlqUrl,
    AttributeNames: ['QueueArn']
  }));
  const dlqArn = attrsRes.Attributes?.QueueArn;
  if (!dlqArn) throw new Error('Failed to get DLQ ARN');
  logger.info({ dlqArn }, 'DLQ ARN resolved');

  // Step 3: Create or update primary queue with RedrivePolicy
  const queueAttributes = {
    VisibilityTimeout: '120',
    RedrivePolicy: JSON.stringify({
      deadLetterTargetArn: dlqArn,
      maxReceiveCount: '3'
    })
  };

  try {
    const res = await sqsClient.send(new CreateQueueCommand({
      QueueName: QUEUE_NAME,
      Attributes: queueAttributes
    }));
    queueUrl = res.QueueUrl;
    logger.info({ queueUrl }, 'Primary queue created with DLQ attached');
  } catch (err) {
    if (
      err.name === 'QueueAlreadyExists' ||
      (err.message && err.message.includes('already exists'))
    ) {
      logger.info('Primary queue exists, updating RedrivePolicy...');
      const res = await sqsClient.send(new GetQueueUrlCommand({ QueueName: QUEUE_NAME }));
      queueUrl = res.QueueUrl;
      await sqsClient.send(new SetQueueAttributesCommand({
        QueueUrl: queueUrl,
        Attributes: queueAttributes
      }));
      logger.info({ queueUrl }, 'Primary queue RedrivePolicy updated');
    } else {
      throw err;
    }
  }

  return queueUrl;
}

function classifyError(error) {
  const msg = error.message || '';
  const code = error.code || '';
  const status = error.$metadata?.httpStatusCode || error.statusCode || null;

  // Non-retryable: explicit permanent failure codes
  if (
    code === 'InvalidParameterException' ||
    code === 'MessageRejected' ||
    code === 'InvalidClientTokenId' ||
    code === 'AuthFailure'
  ) {
    return false;
  }

  // Non-retryable: message string signals
  if (
    msg.includes('invalid') ||
    msg.includes('malformed') ||
    msg.includes('ValidationException') ||
    msg.includes('not verified') ||
    msg.includes('Email address is not verified')
  ) {
    return false;
  }

  // Retryable: rate limit
  if (status === 429 || code === 'Throttling' || msg.includes('throttl')) {
    return true;
  }

  // Retryable: server-side errors
  if (status >= 500 && status <= 599) {
    return true;
  }

  // Non-retryable: all other 4xx client errors
  if (status >= 400 && status <= 499) {
    return false;
  }

  // Default to retryable for unknown errors
  return true;
}

// ─── Scheduler ───────────────────────────────────────────────────────────────
cron.schedule('* * * * *', async () => {
  try {
    const now = new Date();
    const scheduledCampaigns = await prisma.campaign.findMany({
      where: { status: 'SCHEDULED', scheduledAt: { lte: now } },
      include: {
        recipientLists: { include: { contactList: { include: { members: { include: { contact: true } } } } } },
        excludedLists: { include: { contactList: { include: { members: { select: { contactId: true } } } } } },
        template: true
      }
    });

    for (const campaign of scheduledCampaigns) {
      logger.info(`🚀 Launching Campaign: ${campaign.name}`);
      // Fetch all suppressed emails to filter them out efficiently
      const suppressedEmails = await prisma.suppressionList.findMany({
        select: { email: true },
        take: 50000
      });
      logger.info({ count: suppressedEmails.length }, 'Suppression list loaded')
      const suppressedSet = new Set(suppressedEmails.map(s => s.email));

      // Build excluded contact ID set from excludedLists
      const excludedContactIds = new Set();
      (campaign.excludedLists || []).forEach(el => {
        (el.contactList?.members || []).forEach(m => {
          excludedContactIds.add(m.contactId);
        });
      });
      logger.info({ count: excludedContactIds.size }, 'Excluded contacts loaded');

      const recipientsMap = new Map();
      campaign.recipientLists.forEach(rl => {
        rl.contactList.members.forEach(m => {
          if (
            m.contact &&
            m.contact.status === 'ACTIVE' &&
            !suppressedSet.has(m.contact.email) &&
            !excludedContactIds.has(m.contact.id)
          ) {
            if (!recipientsMap.has(m.contact.email)) {
              recipientsMap.set(m.contact.email, {
                email: m.contact.email,
                firstName: m.contact.firstName || undefined,
                lastName: m.contact.lastName || undefined,
                contactId: m.contact.id || undefined
              });
            }
          }
        });
      });
      const recipients = Array.from(recipientsMap.values());

      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'SENDING', recipientCount: recipients.length, sentAt: new Date(), totalSent: 0, totalFailed: 0 }
      });

      const qUrl = await getQueueUrl();
      for (const recipient of recipients) {
        await sqsClient.send(new SendMessageCommand({
          QueueUrl: qUrl,
          MessageBody: JSON.stringify({ campaignId: campaign.id, recipient })
        }));
      }
    }

    // Stale campaign check
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
    const staleCampaigns = await prisma.campaign.findMany({
      where: {
        status: 'SENDING',
        updatedAt: { lt: tenMinutesAgo }
      },
      select: { id: true, name: true, updatedAt: true }
    })

    for (const campaign of staleCampaigns) {
      logger.warn({ updatedAt: campaign.updatedAt }, `⚠️ [STALE CAMPAIGN] ${campaign.name} stuck in SENDING since ${campaign.updatedAt}. Marking as FAILED.`)
      await prisma.campaign.update({
        where: { id: campaign.id },
        data: { status: 'FAILED' }
      })
      logger.warn(`✅ [STALE CAMPAIGN] ${campaign.name} marked as FAILED`)
    }
  } catch (error) {
    logger.error({ error }, '❌ Scheduler Error');
  }
});

// ─── Queue Processor ─────────────────────────────────────────────────────────
async function processQueue() {
  logger.info('📬 Worker initialized and listening for messages...');
  isPollingActive = true;

  // Recurring ping every 4 minutes to keep Neon PostgreSQL connection alive
  setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info('🔌 Database connection keep-alive ping successful');
    } catch (err) {
      logger.error({ error: err.message }, '🔌 Database connection keep-alive ping failed');
    }
  }, 4 * 60 * 1000);

  let qUrl = null;

  let waitTime = 20;
  while (true) {
    try {
      if (!qUrl) {
        qUrl = await getQueueUrl();
      }

      const response = await sqsClient.send(new ReceiveMessageCommand({
        QueueUrl: qUrl,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: waitTime,
        AttributeNames: ['ApproximateReceiveCount']
      }));

      if (!response.Messages || response.Messages.length === 0) {
        waitTime = 20;
        continue;
      }

      waitTime = 0;

      for (const message of response.Messages) {
        const { campaignId, recipient } = JSON.parse(message.Body);
        console.log('PROCESSING MESSAGE:', recipient.email, 'contactId:', recipient.contactId)
        const contactId = recipient.contactId || 'unknown';
        const idPart = contactId && contactId !== 'unknown' ? contactId : recipient.email;
        const lockId = `send:${campaignId}:${idPart}`;
        console.log('LOCK ID:', lockId)
        
        try {
          // Attempt to create lock
          try {
            await prisma.campaignActivityLog.create({
              data: {
                id: lockId,
                campaignId,
                actorId: contactId,
                contactId: contactId === 'unknown' ? null : contactId,
                action: 'EMAIL_SEND_IN_PROGRESS',
                metadata: { email: recipient.email, timestamp: new Date().toISOString() }
              }
            });
          } catch (createError) {
            if (createError.code === 'P2002') {
              console.log('LOCK COLLISION on:', lockId)
              const existingLock = await prisma.campaignActivityLog.findUnique({
                where: { id: lockId }
              });

              if (!existingLock) {
                throw new Error("Lock deleted mid-flight. Retry.");
              }

              if (existingLock.action === 'EMAIL_SENT') {
                logger.info(`⏩ Email already sent for ${recipient.email}. Deleting SQS message.`);
                await sqsClient.send(new DeleteMessageCommand({ QueueUrl: qUrl, ReceiptHandle: message.ReceiptHandle }));
                continue;
              }

              if (existingLock.action === 'EMAIL_SEND_IN_PROGRESS') {
                const lockAgeMs = Date.now() - new Date(existingLock.createdAt).getTime();
                const STALE_LOCK_THRESHOLD = 5 * 60 * 1000;

                if (lockAgeMs < STALE_LOCK_THRESHOLD) {
                  throw new Error(`Lock is fresh for ${recipient.email}. Retrying later.`);
                } else {
                  logger.warn(`⚠️ Stale lock detected for ${recipient.email}. Reclaiming.`);
                  const updateRes = await prisma.campaignActivityLog.updateMany({
                    where: { id: lockId, createdAt: existingLock.createdAt },
                    data: { createdAt: new Date() }
                  });
                  if (updateRes.count === 0) {
                    throw new Error("Stale lock reclamation race lost.");
                  }
                }
              }
            } else {
              throw createError;
            }
          }

          const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            select: {
              id: true,
              name: true,
              status: true,
              senderEmail: true,
              senderName: true,
              subject: true,
              totalSent: true,
              totalFailed: true,
              recipientCount: true,
              template: {
                select: {
                  html: true
                }
              }
            }
          });

          if (!campaign || campaign.status !== 'SENDING') {
            await prisma.campaignActivityLog.delete({ where: { id: lockId } }).catch(() => {});
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
            logger.info(`⏩ Skipping ${recipient.email}: Contact is ${contact?.status || 'UNKNOWN'} or suppressed.`);
            await prisma.campaignActivityLog.delete({ where: { id: lockId } }).catch(() => {});
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
          
          // Secure Unsubscribe Token (uid)
          const uid = UnsubscribeTokenService.encodeToken({
            cid: contactId,
            cam: campaignId,
            em: recipient.email
          });

          const footerUnsubscribeUrl = `${appUrl}/unsubscribe?uid=${uid}`;
          const trackingPixel = `<img src="${appUrl}/api/track/open/${campaignId}/${contactId}" width="1" height="1" alt="" style="border:0;width:1px;height:1px;" />`;
          
          let emailHtml = campaign.template?.html || "No content";
          
          // 1. Core replacements
          emailHtml = emailHtml.replace(/{{first_name}}/gi, recipient.firstName || 'Friend');
          emailHtml = emailHtml.replace(/{{last_name}}/gi, recipient.lastName || '');
          emailHtml = emailHtml.replace(/{{email}}/gi, recipient.email);
          emailHtml = emailHtml.replace(/{{UNSUBSCRIBE_URL}}/gi, footerUnsubscribeUrl);

          // 2. Click Tracking (Safe wrap)
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

          const sendResult = await transporter.sendMail({
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

          await new Promise(r => setTimeout(r, SES_MIN_DELAY_MS))
          logger.info(`⏱️ [RATE LIMIT] Waiting ${SES_MIN_DELAY_MS}ms before next send`)

          // Inline database retry loop for EMAIL_SENT updates
          let dbSuccess = false;
          let updatedCampaign = null;
          for (let attempt = 1; attempt <= 5; attempt++) {
            try {
              const transactionResult = await prisma.$transaction(async (tx) => {
                await tx.campaignActivityLog.update({
                  where: { id: lockId },
                  data: {
                    action: 'EMAIL_SENT',
                    metadata: {
                      email: recipient.email,
                      timestamp: new Date().toISOString(),
                      sesMessageId: sendResult?.messageId || sendResult?.info?.messageId || 'unknown'
                    }
                  }
                });

                const campaignUpdated = await tx.campaign.update({
                  where: { id: campaignId },
                  data: { totalSent: { increment: 1 } }
                });

                return campaignUpdated;
              });

              updatedCampaign = transactionResult;
              dbSuccess = true;
              globalEmailsProcessed++
              globalLastProcessedAt = new Date().toISOString()
              break;
            } catch (dbError) {
              logger.warn({ error: dbError.message }, `[DB RETRY] Attempt ${attempt} failed to update lock to EMAIL_SENT:`);
              if (attempt < 5) {
                await new Promise(r => setTimeout(r, 2000));
              }
            }
          }

          if (!dbSuccess) {
            throw new Error(`Failed to commit EMAIL_SENT status to database after 5 attempts.`);
          }

          if (updatedCampaign && updatedCampaign.totalSent + updatedCampaign.totalFailed >= updatedCampaign.recipientCount) {
            await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'SENT' } });
          }

          console.log('SUCCESS:', recipient.email)
          await sqsClient.send(new DeleteMessageCommand({ QueueUrl: qUrl, ReceiptHandle: message.ReceiptHandle }));
        } catch (innerError) {
          console.log('FAILED:', recipient.email, innerError.message)
          const isRetryable = classifyError(innerError);
          
          if (isRetryable) {
            logger.warn({ error: innerError.message }, `[RETRYABLE ERROR] SQS Message for ${recipient.email} will be retried:`);
            // Release lock to allow immediate re-processing
            await prisma.campaignActivityLog.delete({ where: { id: lockId } }).catch(() => {});

            // Adjust Visibility Timeout with exponential backoff
            const receiveCount = Number(message.Attributes?.ApproximateReceiveCount) || 1;
            const backoffSeconds = Math.min(300, Math.pow(2, receiveCount) * 10);
            
            await sqsClient.send(new ChangeMessageVisibilityCommand({
              QueueUrl: qUrl,
              ReceiptHandle: message.ReceiptHandle,
              VisibilityTimeout: backoffSeconds
            })).catch((visibilityErr) => logger.error({ error: visibilityErr.message }, "Failed to change visibility timeout:"));
          } else {
            logger.error({ error: innerError.message }, `[NON-RETRYABLE ERROR] SQS Message for ${recipient.email} failed permanently:`);
            // Release lock
            await prisma.campaignActivityLog.delete({ where: { id: lockId } }).catch(() => {});

            await prisma.campaign.update({
              where: { id: campaignId },
              data: { totalFailed: { increment: 1 } }
            }).catch(() => {});
            
            await prisma.campaignActivityLog.create({
              data: {
                campaignId,
                action: 'SEND_FAILED',
                actorId: 'system-worker',
                metadata: { email: recipient.email, error: innerError.message }
              }
            }).catch(() => {});

            await sqsClient.send(new DeleteMessageCommand({ QueueUrl: qUrl, ReceiptHandle: message.ReceiptHandle }));
          }
        }
      }
    } catch (error) {
      logger.error({ error }, '❌ Queue Error:');
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

processQueue();

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — shutting down worker gracefully...')
  await new Promise(r => setTimeout(r, 2000))
  logger.info('Worker shutdown complete')
  process.exit(0)
})

process.on('SIGINT', async () => {
  logger.info('SIGINT received — shutting down worker gracefully...')
  await new Promise(r => setTimeout(r, 2000))
  logger.info('Worker shutdown complete')
  process.exit(0)
})
