const createLogger = require('./lib/worker-logger');
let logger = createLogger(); // pre-init: workerId not yet available
const { PrismaClient } = require('@prisma/client');
// FORCE DEPLOY TIMESTAMP: 2026-05-11 00:39 AM
const cron = require('node-cron');
const { z } = require('zod');

class InvalidCampaignError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidCampaignError';
  }
}

class InvalidPayloadError extends Error {
  constructor(message) {
    super(message);
    this.name = 'InvalidPayloadError';
  }
}

const QueuePayloadSchema = z.object({
  campaignId: z.string().min(1),
  userId: z.string().optional(),
  recipient: z.object({
    email: z.string().email(),
    contactId: z.string().optional()
  })
});

function isPermanentError(error) {
  return (
    error instanceof SyntaxError ||
    error instanceof z.ZodError ||
    error instanceof InvalidCampaignError ||
    error instanceof InvalidPayloadError
  );
}
const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand, GetQueueUrlCommand, CreateQueueCommand, SendMessageCommand, ChangeMessageVisibilityCommand, GetQueueAttributesCommand, SetQueueAttributesCommand } = require('@aws-sdk/client-sqs');
const { SESv2Client, SendEmailCommand } = require('@aws-sdk/client-sesv2');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  sendDefaultPii: false,
  environment: process.env.NODE_ENV || 'production',
  release: process.env.APP_VERSION || '1.0.0',
});

// --- Graceful Shutdown & Lifecycle State ---
const os = require('os');
const HOSTNAME = os.hostname();
const WORKER_ID = `${HOSTNAME}-${process.pid}-${Date.now()}`;

// Re-initialize logger with full worker identity context.
// Every log line from this point will automatically include
// workerId, version, and environment without manual field passing.
logger = createLogger({
  workerId: WORKER_ID,
  version: process.env.APP_VERSION || 'unknown',
  environment: process.env.NODE_ENV || 'production',
});

Sentry.setTag('workerId', WORKER_ID);
Sentry.setTag('service', 'email-campaign-worker');

let isShuttingDown = false;
let shutdownStarted = false;
let activeMessages = 0;
let successfulMessages = 0;
let failedMessages = 0;

let healthServer = null;
let heartbeatInterval = null;
let metricsInterval = null;
let cacheCleanupInterval = null;

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
const { decrypt } = require('./lib/security/encryption');

// EMERGENCY LOGGING: Catch any crash and write it to a file
const logPath = path.join(process.cwd(), 'worker-error.log');
async function logError(err) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] CRASH: ${err?.stack || err}\n`;
  fs.appendFileSync(logPath, message);
  logger.error(message);
  Sentry.captureException(err);
  await Sentry.close(2000);
  process.exit(1);
}

process.on('uncaughtException', logError);
process.on('unhandledRejection', (reason) => {
  logError(reason instanceof Error ? reason : new Error(String(reason)));
});

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

// --- In-Memory Caches ---
const campaignCache = new Map();
const settingsCache = new Map();
const suppressionCache = new Map();

// --- Cached Fetch Helpers ---
async function getCampaign(campaignId) {
  const now = Date.now();
  const cached = campaignCache.get(campaignId);
  if (cached && cached.expiresAt > now) {
    logger.info(`Campaign cache hit: ${campaignId}`);
    return cached.data;
  }

  logger.info(`Campaign cache miss: ${campaignId}`);
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
      createdBy: true,
      template: {
        select: {
          html: true
        }
      }
    }
  });

  if (campaign) {
    campaignCache.set(campaignId, {
      data: campaign,
      expiresAt: now + 30000 // 30 seconds
    });
  }
  return campaign;
}

async function getUserSettings(userId) {
  const now = Date.now();
  const cached = settingsCache.get(userId);
  if (cached && cached.expiresAt > now) {
    logger.info(`Settings cache hit: ${userId}`);
    return cached.settings;
  }

  logger.info(`Settings cache miss: ${userId}`);
  const settings = await prisma.settings.findUnique({
    where: { userId }
  });

  if (settings) {
    settingsCache.set(userId, {
      settings,
      expiresAt: now + 300000 // 5 minutes
    });
  }
  return settings;
}

async function getSuppressionSet(userId) {
  const now = Date.now();
  const cached = suppressionCache.get(userId);
  if (cached && cached.expiresAt > now) {
    logger.info(`Suppression cache hit: ${userId}`);
    return cached.emails;
  }

  logger.info(`Suppression cache miss: ${userId}`);
  const suppressionList = await prisma.suppressionList.findMany({
    where: { userId },
    select: { email: true }
  });

  const emailsSet = new Set(suppressionList.map(s => s.email.toLowerCase()));
  suppressionCache.set(userId, {
    emails: emailsSet,
    expiresAt: now + 120000 // 2 minutes
  });
  return emailsSet;
}

// Cleanup interval to avoid memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of campaignCache.entries()) {
    if (val.expiresAt <= now) campaignCache.delete(key);
  }
  for (const [key, val] of settingsCache.entries()) {
    if (val.expiresAt <= now) settingsCache.delete(key);
  }
  for (const [key, val] of suppressionCache.entries()) {
    if (val.expiresAt <= now) suppressionCache.delete(key);
  }
}, 60000);
const awsConfig = {
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
};

const sqsClient = new SQSClient(awsConfig);
const nodemailer = require('nodemailer');

const sesClient = new SESv2Client(awsConfig);
const globalTransporter = nodemailer.createTransport({
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

function classifyFailureCode(error) {
  const msg = error.message || '';
  const code = error.code || '';
  const status = error.$metadata?.httpStatusCode || error.statusCode || null;

  if (code === 'MessageRejected' || msg.includes('not verified') || msg.includes('verified')) {
    return 'SES_REJECTED';
  }
  if (code === 'InvalidParameterException' || msg.includes('invalid') || msg.includes('malformed')) {
    return 'INVALID_ADDRESS';
  }
  if (status === 429 || code === 'Throttling' || msg.includes('throttl')) {
    return 'RATE_LIMIT';
  }
  return 'SES_FAILED';
}

// ─── Scheduler ───────────────────────────────────────────────────────────────
const campaignWatchdogTask = cron.schedule('* * * * *', async () => {
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
        where: { userId: campaign.createdBy },
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
    const staleTimeoutMinutes = parseInt(process.env.CAMPAIGN_STALE_TIMEOUT_MINUTES || '15', 10);
    const startGraceMinutes = parseInt(process.env.CAMPAIGN_START_GRACE_MINUTES || '5', 10);

    const staleThreshold = new Date(Date.now() - staleTimeoutMinutes * 60 * 1000);
    const graceThreshold = new Date(Date.now() - startGraceMinutes * 60 * 1000);

    const sendingCampaigns = await prisma.campaign.findMany({
      where: { status: 'SENDING' },
      select: { id: true, name: true, sentAt: true, createdAt: true }
    });

    if (sendingCampaigns.length > 0) {
      const campaignIds = sendingCampaigns.map(c => c.id);
      const activeDeliveries = await prisma.emailDelivery.findMany({
        where: {
          campaignId: { in: campaignIds },
          updatedAt: { gte: staleThreshold }
        },
        select: { campaignId: true },
        distinct: ['campaignId']
      });
      const activeCampaignIds = new Set(activeDeliveries.map(d => d.campaignId));

      for (const campaign of sendingCampaigns) {
        const startedAt = campaign.sentAt ?? campaign.createdAt;
        if (startedAt >= graceThreshold) {
          logger.debug({ campaignId: campaign.id, name: campaign.name, startedAt }, 'Campaign is in startup grace period, ignoring watchdog check.');
          continue;
        }

        if (activeCampaignIds.has(campaign.id)) {
          logger.debug({ campaignId: campaign.id, name: campaign.name }, 'Campaign is active (recent deliveries found).');
          continue;
        }

        logger.warn(
          { campaignId: campaign.id, name: campaign.name, startedAt, staleThreshold },
          `⚠️ [STALE CAMPAIGN] ${campaign.name} has no delivery activity since ${staleThreshold}. Marking as FAILED.`
        );

        await prisma.$transaction([
          prisma.campaign.update({
            where: { id: campaign.id },
            data: {
              status: 'FAILED'
            }
          }),
          prisma.campaignActivityLog.create({
            data: {
              campaignId: campaign.id,
              actorId: 'system-watchdog',
              action: 'CAMPAIGN_FAILED_TIMEOUT',
              metadata: {
                reason: 'NO_DELIVERY_ACTIVITY_TIMEOUT',
                timeoutMinutes: staleTimeoutMinutes,
                graceMinutes: startGraceMinutes,
                lastCheckedAt: new Date().toISOString()
              }
            }
          })
        ]);

        logger.warn(`✅ [STALE CAMPAIGN] ${campaign.name} marked as FAILED with timeout log`);
      }
    }

    // Stale worker check (safe — heartbeat table may not exist on first deploy)
    try {
      const staleMinutes = parseInt(process.env.WORKER_STALE_TIMEOUT_MINUTES || '5', 10);
      const staleWorkerThreshold = new Date(Date.now() - staleMinutes * 60 * 1000);
      await prisma.workerHeartbeat.updateMany({
        where: {
          status: { in: ['HEALTHY', 'STARTING'] },
          lastSeenAt: { lt: staleWorkerThreshold }
        },
        data: { status: 'FAILED' }
      });

      // Cleanup old heartbeat records (older than 30 days and not healthy)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      await prisma.workerHeartbeat.deleteMany({
        where: {
          status: { not: 'HEALTHY' },
          lastSeenAt: { lt: thirtyDaysAgo }
        }
      });
    } catch (heartbeatErr) {
      logger.warn({
        message: heartbeatErr instanceof Error ? heartbeatErr.message : String(heartbeatErr)
      }, 'Worker heartbeat stale-check skipped (table may not be migrated yet)');
    }
  } catch (error) {
    logger.error({
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, '❌ Scheduler Error');
  }
});

// --- Worker Heartbeat Instrumentation ---
async function registerWorkerStartup() {
  try {
    await prisma.workerHeartbeat.create({
      data: {
        id: WORKER_ID,
        hostname: HOSTNAME,
        processId: process.pid,
        status: 'STARTING',
        version: process.env.APP_VERSION || 'development',
        environment: process.env.NODE_ENV || 'production',
        activeMessages: 0,
        successfulMessages: 0,
        failedMessages: 0,
        memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
        uptimeSeconds: Math.round(process.uptime())
      }
    });
    logger.info({ workerId: WORKER_ID }, 'Worker startup heartbeat registered successfully');
  } catch (err) {
    // Non-fatal: heartbeat is observability only — worker continues regardless
    logger.warn({
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    }, 'Worker heartbeat registration skipped — table may not be migrated yet. Worker will continue.');
  }
}

async function setWorkerHealthy() {
  try {
    await prisma.workerHeartbeat.update({
      where: { id: WORKER_ID },
      data: { status: 'HEALTHY' }
    });
    logger.info({ workerId: WORKER_ID }, 'Worker status changed to HEALTHY');
  } catch (err) {
    // Non-fatal: heartbeat is observability only — worker continues regardless
    logger.warn({
      message: err instanceof Error ? err.message : String(err)
    }, 'Worker HEALTHY status update skipped — heartbeat table may not be migrated yet.');
  }
}

function startHeartbeatInterval() {
  heartbeatInterval = setInterval(async () => {
    try {
      await prisma.workerHeartbeat.update({
        where: { id: WORKER_ID },
        data: {
          status: isShuttingDown ? 'SHUTTING_DOWN' : 'HEALTHY',
          memoryUsageMb: Math.round(process.memoryUsage().rss / 1024 / 1024),
          activeMessages,
          successfulMessages,
          failedMessages,
          uptimeSeconds: Math.round(process.uptime())
        }
      });
      logger.info({ workerId: WORKER_ID }, 'Worker heartbeat updated successfully');
    } catch (err) {
      // Non-fatal: heartbeat is observability only — worker continues regardless
      logger.warn({
        message: err instanceof Error ? err.message : String(err)
      }, 'Worker heartbeat update skipped — heartbeat table may not be migrated yet.');
    }
  }, 60000);
}

// ─── Queue Processor ─────────────────────────────────────────────────────────
async function processQueue() {
  await registerWorkerStartup();
  startHeartbeatInterval();

  logger.info('📬 Worker initialized and listening for messages...');
  isPollingActive = true;
  await setWorkerHealthy();

  // Recurring ping every 4 minutes to keep Neon PostgreSQL connection alive
  /*
  setInterval(async () => {
    try {
      await prisma.$queryRaw`SELECT 1`;
      logger.info('🔌 Database connection keep-alive ping successful');
    } catch (err) {
      logger.error({ error: err.message }, '🔌 Database connection keep-alive ping failed');
    }
  }, 4 * 60 * 1000);
  */

  let qUrl = null;

  let waitTime = 20;
  while (!isShuttingDown) {
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

      if (isShuttingDown) {
        logger.info('Shutdown started while waiting for SQS long poll. Returning messages to queue.');
        break;
      }

      if (!response.Messages || response.Messages.length === 0) {
        waitTime = 20;
        continue;
      }

      waitTime = 0;

      for (const message of response.Messages) {
        if (isShuttingDown) {
          logger.info('Skipping message processing due to active shutdown.');
          continue;
        }

        activeMessages++;
        let delivery = null;
        let campaignId = null;
        let recipient = null;
        let contactId = null;

        try {
          
          // 1. JSON Parse
          const parsedBody = JSON.parse(message.Body);
          
          // 2. Zod Payload Validation
          const payload = QueuePayloadSchema.parse(parsedBody);
          
          campaignId = payload.campaignId;
          recipient = payload.recipient;
          contactId = recipient.contactId && recipient.contactId !== 'unknown' ? recipient.contactId : null;
          const emailLower = recipient.email.toLowerCase();

          // 3. Fetch Campaign
          const campaign = await getCampaign(campaignId);
          if (!campaign) {
            throw new InvalidCampaignError(`Campaign not found: ${campaignId}`);
          }

          // 4. Validate campaign status
          if (campaign.status !== 'SENDING') {
            throw new InvalidCampaignError(`Campaign status is ${campaign.status} (not SENDING)`);
          }

          // 5. Resolve owner strictly from database creator
          const ownerId = campaign.createdBy;
          if (payload.userId && payload.userId !== campaign.createdBy) {
            logger.warn({
              campaignId: campaign.id,
              suppliedUserId: payload.userId,
              actualUserId: campaign.createdBy
            }, "🛡️ SQS tenant mismatch detected! Using actual campaign creator ID as the owner.");
          }

          // 6. Create EmailDelivery lock (status=SENDING)
          try {
            delivery = await prisma.emailDelivery.create({
              data: {
                campaignId,
                userId: ownerId,
                contactId,
                recipientEmail: emailLower,
                status: 'SENDING',
                startedAt: new Date()
              }
            });
          } catch (createError) {
            if (createError.code === 'P2002') {
              logger.warn(
                {
                  campaignId,
                  recipientEmail: emailLower,
                  sqsMessageId: message.MessageId
                },
                'Email delivery lock collision detected'
              );
              const existing = await prisma.emailDelivery.findUnique({
                where: {
                  campaignId_recipientEmail: {
                    campaignId,
                    recipientEmail: emailLower
                  }
                }
              });

              if (!existing) {
                throw new Error("Delivery record disappeared. Retry.");
              }

              if (existing.status === 'SENT') {
                logger.info(`⏩ Email already sent for ${recipient.email}. Deleting SQS message.`);
                await sqsClient.send(new DeleteMessageCommand({ QueueUrl: qUrl, ReceiptHandle: message.ReceiptHandle }));
                continue;
              }

              if (existing.status === 'FAILED') {
                if (existing.failureCode === 'TEMPORARY_ERROR') {
                  logger.info(`🔄 Retrying previously failed delivery for ${recipient.email} (Attempt ${existing.retryCount + 1}).`);
                  delivery = await prisma.emailDelivery.update({
                    where: { id: existing.id },
                    data: {
                      status: 'SENDING',
                      startedAt: new Date(),
                      retryCount: { increment: 1 }
                    }
                  });
                } else {
                  logger.info(`⏩ Email delivery permanently failed previously for ${recipient.email} (Code: ${existing.failureCode}). Deleting SQS message.`);
                  await sqsClient.send(new DeleteMessageCommand({ QueueUrl: qUrl, ReceiptHandle: message.ReceiptHandle }));
                  continue;
                }
              } else if (existing.status === 'SENDING') {
                const ageMs = Date.now() - new Date(existing.startedAt).getTime();
                const STALE_THRESHOLD = 15 * 60 * 1000; // 15 minutes

                if (ageMs < STALE_THRESHOLD) {
                  logger.info(`⏳ Lock is fresh for ${recipient.email} (age: ${Math.round(ageMs/1000)}s). Retrying later.`);
                  throw new Error(`Lock is fresh for ${recipient.email}. Retrying later.`);
                } else {
                  logger.warn(`⚠️ Stale delivery detected for ${recipient.email}. Setting status to FAILED and aborting (no resend).`);
                  await prisma.emailDelivery.update({
                    where: { id: existing.id },
                    data: {
                      status: 'FAILED',
                      failureCode: 'STALE_DELIVERY',
                      failureReason: 'STALE_DELIVERY_UNKNOWN_STATE'
                    }
                  });
                  await prisma.campaign.update({
                    where: { id: campaignId },
                    data: { totalFailed: { increment: 1 } }
                  }).catch(() => {});
                  await sqsClient.send(new DeleteMessageCommand({ QueueUrl: qUrl, ReceiptHandle: message.ReceiptHandle }));
                  continue;
                }
              }
            } else {
              throw createError;
            }
          }

          // FINAL PROTECTION: Check if recipient is suppressed using cached Set
          const suppressionSet = await getSuppressionSet(campaign.createdBy);
          
          if (suppressionSet.has(recipient.email.toLowerCase())) {
            logger.info(`⏩ Skipping ${recipient.email}: Contact is suppressed (cache check).`);
            await prisma.emailDelivery.update({
              where: { id: delivery.id },
              data: {
                status: 'FAILED',
                failureCode: 'INVALID_ADDRESS',
                failureReason: 'Contact is suppressed'
              }
            });
            // Increment failed/skipped count to ensure campaign completion logic works
            await prisma.campaign.update({
              where: { id: campaignId },
              data: { totalFailed: { increment: 1 } }
            });
            await sqsClient.send(new DeleteMessageCommand({ QueueUrl: qUrl, ReceiptHandle: message.ReceiptHandle }));
            continue;
          }

          const fromEmail = process.env.DEFAULT_FROM_EMAIL || process.env.SES_FROM_EMAIL || "official@campaign.theaischool.co";
          const fromName = process.env.DEFAULT_FROM_NAME || "THE AI SCHOOL";
          const appUrl = process.env.NEXT_PUBLIC_APP_URL;
          
          if (!appUrl) {
            throw new Error("CRITICAL: NEXT_PUBLIC_APP_URL is missing in environment variables.");
          }
          
          // Secure Unsubscribe Token (uid)
          const uid = UnsubscribeTokenService.encodeToken({
            cid: contactId || 'unknown',
            cam: campaignId,
            em: recipient.email
          });

          const footerUnsubscribeUrl = `${appUrl}/unsubscribe?uid=${uid}`;
          const trackingPixel = `<img src="${appUrl}/api/track/open/${campaignId}/${contactId || 'unknown'}" width="1" height="1" alt="" style="border:0;width:1px;height:1px;" />`;
          
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
            
            const trackingUrl = `${appUrl}/api/track/click/${campaignId}/${contactId || 'unknown'}?url=${encodeURIComponent(url)}`;
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

          const sendResult = await globalTransporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: recipient.email,
            subject: campaign.subject,
            html: finalHtml,
            headers: {
              'List-Unsubscribe': `<${listUnsubscribeUrl}>`,
              'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              'X-Campaign-ID': campaignId,
              'X-Contact-ID': contactId || 'unknown'
            },
            ses: {
              Tags: [
                { Name: 'campaignId', Value: campaignId },
                { Name: 'contactId', Value: contactId || 'unknown' }
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
                await tx.emailDelivery.update({
                  where: { id: delivery.id },
                  data: {
                    status: 'SENT',
                    sesMessageId: sendResult?.messageId || sendResult?.info?.messageId || 'unknown'
                  }
                });

                // Write the sent activity log for compatibility/user visibility
                await tx.campaignActivityLog.create({
                  data: {
                    campaignId,
                    actorId: contactId || 'unknown',
                    contactId,
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
              logger.warn({
                message: dbError instanceof Error ? dbError.message : String(dbError),
                stack: dbError instanceof Error ? dbError.stack : undefined
              }, `[DB RETRY] Attempt ${attempt} failed to update delivery status to SENT:`);
              if (attempt < 5) {
                await new Promise(r => setTimeout(r, 2000));
              }
            }
          }

          if (!dbSuccess) {
            throw new Error(`Failed to commit SENT status to database after 5 attempts.`);
          }

          if (updatedCampaign && updatedCampaign.totalSent + updatedCampaign.totalFailed >= updatedCampaign.recipientCount) {
            await prisma.campaign.update({ where: { id: campaignId }, data: { status: 'SENT' } });
          }

          const sesMessageId = sendResult?.messageId || sendResult?.info?.messageId || 'unknown';
          logger.info(
            {
              campaignId,
              recipientEmail: recipient.email,
              sqsMessageId: message.MessageId,
              deliveryId: delivery?.id,
              sesMessageId
            },
            'Email delivered successfully'
          );
          successfulMessages++;
          await sqsClient.send(new DeleteMessageCommand({ QueueUrl: qUrl, ReceiptHandle: message.ReceiptHandle }));
        } catch (innerError) {
          failedMessages++;
          logger.error(
            {
              campaignId,
              recipientEmail: recipient?.email ?? 'unknown',
              sqsMessageId: message.MessageId,
              deliveryId: delivery?.id,
              errorName: innerError.name,
              errorMessage: innerError.message,
              stack: innerError.stack
            },
            'Email delivery failed'
          );

          // Sentry should only capture unexpected/infrastructure failures
          const shouldReportToSentry = !(
            innerError instanceof InvalidCampaignError ||
            innerError instanceof InvalidPayloadError ||
            innerError.name === 'ZodError' ||
            (innerError.message && (
              innerError.message.includes('Lock is fresh') ||
              innerError.message.includes('not verified') ||
              innerError.message.includes('suppressed')
            ))
          );

          if (shouldReportToSentry) {
            const recipientDomain = recipient && recipient.email ? recipient.email.split('@')[1] : 'unknown';
            Sentry.withScope((scope) => {
              scope.setTags({
                campaignId: campaignId || 'unknown',
                sqsMessageId: message.MessageId || 'unknown',
                recipientDomain,
                deliveryId: delivery?.id || 'unknown',
                errorName: innerError.name || 'Error'
              });
              scope.setContext('email_job', {
                campaignId,
                sqsMessageId: message.MessageId,
                recipientDomain,
                deliveryId: delivery?.id
              });
              Sentry.captureException(innerError);
            });
          }

          if (isPermanentError(innerError)) {
            logger.error({
              message: innerError instanceof Error ? innerError.message : String(innerError),
              stack: innerError instanceof Error ? innerError.stack : undefined,
              type: innerError.name || 'Error'
            }, `[PERMANENT FAILURE] Poison message detected:`);
            
            // Delete message from SQS immediately to prevent poison retry loops
            await sqsClient.send(new DeleteMessageCommand({ QueueUrl: qUrl, ReceiptHandle: message.ReceiptHandle }));
            continue;
          }

          const isRetryable = classifyError(innerError);
          
          if (isRetryable) {
            logger.warn({
              message: innerError instanceof Error ? innerError.message : String(innerError),
              stack: innerError instanceof Error ? innerError.stack : undefined
            }, `[RETRYABLE ERROR] SQS Message for ${recipient ? recipient.email : 'unknown'} will be retried:`);
            
            if (delivery) {
              await prisma.emailDelivery.update({
                where: { id: delivery.id },
                data: {
                  status: 'FAILED',
                  failureCode: 'TEMPORARY_ERROR',
                  failureReason: innerError.message
                }
              }).catch(() => {});
            }

            // Adjust Visibility Timeout with exponential backoff
            const receiveCount = Number(message.Attributes?.ApproximateReceiveCount) || 1;
            const backoffSeconds = Math.min(300, Math.pow(2, receiveCount) * 10);
            
            await sqsClient.send(new ChangeMessageVisibilityCommand({
              QueueUrl: qUrl,
              ReceiptHandle: message.ReceiptHandle,
              VisibilityTimeout: backoffSeconds
            })).catch((visibilityErr) => logger.error({
              message: visibilityErr instanceof Error ? visibilityErr.message : String(visibilityErr),
              stack: visibilityErr instanceof Error ? visibilityErr.stack : undefined
            }, 'Failed to change visibility timeout:'));
          } else {
            logger.error({
              message: innerError instanceof Error ? innerError.message : String(innerError),
              stack: innerError instanceof Error ? innerError.stack : undefined
            }, `[NON-RETRYABLE ERROR] SQS Message for ${recipient ? recipient.email : 'unknown'} failed permanently:`);
            
            if (delivery) {
              await prisma.emailDelivery.update({
                where: { id: delivery.id },
                data: {
                  status: 'FAILED',
                  failureCode: classifyFailureCode(innerError),
                  failureReason: innerError.message
                }
              }).catch(() => {});
            }

            if (campaignId) {
              await prisma.campaign.update({
                where: { id: campaignId },
                data: { totalFailed: { increment: 1 } }
              }).catch(() => {});
              
              await prisma.campaignActivityLog.create({
                data: {
                  campaignId,
                  action: 'SEND_FAILED',
                  actorId: contactId || 'system-worker',
                  contactId,
                  metadata: { email: recipient ? recipient.email : 'unknown', error: innerError.message }
                }
              }).catch(() => {});
            }

            await sqsClient.send(new DeleteMessageCommand({ QueueUrl: qUrl, ReceiptHandle: message.ReceiptHandle }));
          }
        } finally {
          activeMessages--;
        }
      }
    } catch (error) {
      logger.error({
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      }, '❌ Queue Error:');
      Sentry.captureException(error);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

processQueue();

async function gracefulShutdown(signal) {
  if (shutdownStarted) {
    logger.warn(`Shutdown already in progress. Ignoring ${signal}`);
    return;
  }

  shutdownStarted = true;
  isShuttingDown = true;

  logger.info(`Received ${signal}. Starting graceful shutdown.`);

  // Stop heartbeat timer immediately to prevent sending new updates after setting isShuttingDown
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  // Update status to SHUTTING_DOWN in database
  try {
    await prisma.workerHeartbeat.update({
      where: { id: WORKER_ID },
      data: {
        status: 'SHUTTING_DOWN',
        lastSeenAt: new Date()
      }
    });
    logger.info('Worker status updated to SHUTTING_DOWN in database.');
  } catch (err) {
    logger.error({
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined
    }, 'Failed to update worker status to SHUTTING_DOWN');
  }

  // Stop new scheduled tasks
  if (campaignWatchdogTask) {
    campaignWatchdogTask.stop();
  }

  if (cacheCleanupInterval) {
    clearInterval(cacheCleanupInterval);
  }

  if (metricsInterval) {
    clearInterval(metricsInterval);
  }

  // Prevent infinite waiting
  const timeoutSeconds = parseInt(
    process.env.GRACEFUL_SHUTDOWN_TIMEOUT_SECONDS || '60',
    10
  );

  const forceExit = setTimeout(() => {
    logger.error(`Graceful shutdown exceeded ${timeoutSeconds}s. Forcing exit.`);
    process.exit(1);
  }, timeoutSeconds * 1000);

  forceExit.unref();

  // Wait for active messages to finish
  while (activeMessages > 0) {
    logger.info(`Waiting for ${activeMessages} active messages to finish.`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  logger.info('All active messages completed. Closing resources.');

  try {
    if (healthServer) {
      await new Promise(resolve => healthServer.close(resolve));
    }

    await prisma.$disconnect();
    logger.info('Prisma disconnected successfully.');
  } catch (error) {
    logger.error({
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Error during worker shutdown.');
  }

  try {
    await Sentry.close(2000);
    logger.info('Sentry closed successfully.');
  } catch (sentryErr) {
    logger.error({
      message: sentryErr instanceof Error ? sentryErr.message : String(sentryErr),
      stack: sentryErr instanceof Error ? sentryErr.stack : undefined
    }, 'Error closing Sentry.');
  }

  clearTimeout(forceExit);
  logger.info('Worker shutdown completed successfully.');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
