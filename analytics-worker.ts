import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs"
import { PrismaClient } from "@prisma/client"
import { UAParser } from "ua-parser-js"
import crypto from "crypto"
import dotenv from "dotenv"
import { isBot as botDetector } from "./lib/analytics/bot-detector"
import * as Sentry from "@sentry/node"
import os from "os"
import http from "http"

// Load env variables
dotenv.config()

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,
  sendDefaultPii: false,
  environment: process.env.NODE_ENV || "production",
  release: process.env.APP_VERSION || "1.0.0",
})

const HOSTNAME = os.hostname()
const WORKER_ID = `${HOSTNAME}-${process.pid}-${Date.now()}`

Sentry.setTag("workerId", WORKER_ID)
Sentry.setTag("service", "analytics-worker")
Sentry.setTag("environment", process.env.NODE_ENV || "production")
Sentry.setTag("version", process.env.APP_VERSION || "1.0.0")

process.on("uncaughtException", (err) => {
  console.error("CRASH: uncaughtException", err)
  Sentry.captureException(err)
  Sentry.close(2000).then(() => process.exit(1))
})

process.on("unhandledRejection", (reason) => {
  console.error("CRASH: unhandledRejection", reason)
  const err = reason instanceof Error ? reason : new Error(String(reason))
  Sentry.captureException(err)
  Sentry.close(2000).then(() => process.exit(1))
})

const prisma = new PrismaClient()

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

const QUEUE_URL = process.env.AWS_ANALYTICS_QUEUE_URL
const IP_SALT = process.env.ANALYTICS_IP_SALT || "default-salt-key-value"

if (!QUEUE_URL) {
  console.error("FATAL: AWS_ANALYTICS_QUEUE_URL is not defined in environment variables.")
  process.exit(1)
}

console.log("Analytics worker started.")
console.log(`Listening on queue: ${QUEUE_URL}`)

const PORT = process.env.PORT || 3002;
let globalEventsProcessed = 0;
let globalLastProcessedAt: string | null = null;
let isPollingActive = false;

if (process.env.ENABLE_WORKER_HEALTH_SERVER === "true") {
  http.createServer((req, res) => {
    const health = {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      metrics: {
        eventsProcessed: globalEventsProcessed,
        lastProcessedAt: globalLastProcessedAt,
        isPollingActive: isPollingActive
      }
    };
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify(health));
  }).listen(PORT, () => {
    console.log(`🏥 Analytics worker health endpoint running on port ${PORT}`);
  });
}

// Helper: Hash IP
function hashIp(ip: string): string {
  return crypto.createHash("sha256").update(ip + IP_SALT).digest("hex")
}

// Helper: Parse User-Agent details
function parseUserAgent(ua: string) {
  const parser = new UAParser(ua)
  const result = parser.getResult()

  const browser = result.browser.name || null
  const os = result.os.name || null
  const deviceType = result.device.type || "desktop"
  const userAgentHash = crypto.createHash("sha256").update(ua).digest("hex")

  return { browser, os, deviceType, userAgentHash }
}

async function pollAnalyticsQueue() {
  isPollingActive = true
  while (true) {
    try {
      const response = await sqsClient.send(new ReceiveMessageCommand({
        QueueUrl: QUEUE_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20, // Long polling
      }))

      if (!response.Messages || response.Messages.length === 0) {
        continue
      }

      for (const message of response.Messages) {
        try {
          if (!message.Body) continue

          const event = JSON.parse(message.Body)

          // 1. Validate Event Shape
          if (
            event.version === 1 &&
            (event.type === "OPEN" || event.type === "CLICK") &&
            typeof event.deliveryId === "string" &&
            typeof event.timestamp === "string" &&
            typeof event.ip === "string" &&
            typeof event.userAgent === "string"
          ) {
            // Further Click Validation
            if (event.type === "CLICK" && !event.trackedLinkId) {
              console.warn("Received CLICK event without trackedLinkId, skipping message delete")
              continue
            }

            const { type, deliveryId, trackedLinkId, ip, userAgent } = event
            const isBot = botDetector(userAgent)
            const ipHash = hashIp(ip)
            const { browser, os, deviceType, userAgentHash } = parseUserAgent(userAgent)

            // --- 2. Process Event inside Database Transaction ---
            if (type === "OPEN") {
              await prisma.$transaction(async (tx) => {
                // Insert raw log
                await tx.emailOpenEvent.create({
                  data: {
                    deliveryId,
                    isBot,
                    deviceType,
                    browser,
                    os,
                    userAgentHash,
                    ipHash
                  }
                })

                // Only process counters if it is NOT a bot
                if (!isBot) {
                  const affectedRows = await tx.$executeRaw`
                    INSERT INTO unique_email_opens ("deliveryId")
                    VALUES (${deliveryId})
                    ON CONFLICT DO NOTHING
                  `
                  const isNewUnique = affectedRows > 0

                  const delivery = await tx.emailDelivery.findUnique({
                    where: { id: deliveryId },
                    select: { campaignId: true }
                  })

                  if (delivery) {
                    await tx.campaign.update({
                      where: { id: delivery.campaignId },
                      data: {
                        totalOpens: { increment: 1 },
                        uniqueOpens: isNewUnique ? { increment: 1 } : undefined
                      }
                    })
                  }
                }
              })
            } else if (type === "CLICK") {
              await prisma.$transaction(async (tx) => {
                // Insert raw log
                await tx.emailClickEvent.create({
                  data: {
                    deliveryId,
                    trackedLinkId: trackedLinkId!,
                    isBot,
                    deviceType,
                    browser,
                    os,
                    userAgentHash,
                    ipHash
                  }
                })

                // Only process counters if it is NOT a bot
                if (!isBot) {
                  const affectedRows = await tx.$executeRaw`
                    INSERT INTO unique_email_clicks ("deliveryId", "trackedLinkId")
                    VALUES (${deliveryId}, ${trackedLinkId!})
                    ON CONFLICT DO NOTHING
                  `
                  const isNewUnique = affectedRows > 0

                  const delivery = await tx.emailDelivery.findUnique({
                    where: { id: deliveryId },
                    select: { campaignId: true }
                  })

                  if (delivery) {
                    await tx.campaign.update({
                      where: { id: delivery.campaignId },
                      data: {
                        totalClicks: { increment: 1 },
                        uniqueClicks: isNewUnique ? { increment: 1 } : undefined
                      }
                    })
                  }
                }
              })
            }

            globalEventsProcessed++
            globalLastProcessedAt = new Date().toISOString()

            console.log(`Processed ${type} event for delivery ${deliveryId} (Bot: ${isBot})`)

            // Delete SQS Message (Acknowledge)
            if (message.ReceiptHandle) {
              await sqsClient.send(new DeleteMessageCommand({
                QueueUrl: QUEUE_URL,
                ReceiptHandle: message.ReceiptHandle
              }))
            }
          } else {
            console.warn("Received malformed event shape or unsupported version, skipping message delete:", event)
          }
        } catch (e: any) {
          console.error("Error processing analytics message:", e.message)
          Sentry.withScope((scope) => {
            scope.setTags({
              workerId: WORKER_ID,
              version: process.env.APP_VERSION || "1.0.0",
              environment: process.env.NODE_ENV || "production",
              sqsMessageId: message.MessageId || "unknown"
            })
            Sentry.captureException(e)
          })
        }
      }
    } catch (error: any) {
      console.error("SQS ReceiveMessage error:", error.message)
      Sentry.captureException(error)
      // Wait 5 seconds before retrying on SQS error
      await new Promise(r => setTimeout(r, 5000))
    }
  }
}

pollAnalyticsQueue()
