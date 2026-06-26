import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs"
import crypto from "crypto"

const prisma = new PrismaClient()

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || "ap-south-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
})

const QUEUE_URL = process.env.AWS_ANALYTICS_QUEUE_URL

async function runTests() {
  console.log("Analytics Worker Integration Test Starting...\n")
  let allPassed = true

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✓ ${testName} passed`)
    } else {
      console.error(`✗ ${testName} failed`)
      allPassed = false
    }
  }

  // 1. Resolve a valid user
  const user = await prisma.user.findFirst()
  if (!user) {
    console.error("No user found in database. Please seed or register a user first.")
    process.exit(1)
  }

  let testCampaign: any = null
  let testContact: any = null
  let testDelivery: any = null
  let testLink: any = null

  try {
    // 2. Setup mock campaign, contact, delivery, tracked link
    testCampaign = await prisma.campaign.create({
      data: {
        createdBy: user.id,
        name: "analytics_test_campaign",
        subject: "Test Subject",
        totalOpens: 0,
        uniqueOpens: 0,
        totalClicks: 0,
        uniqueClicks: 0,
      }
    })

    testContact = await prisma.contact.create({
      data: {
        userId: user.id,
        email: `analytics_test_${Date.now()}@example.com`,
        firstName: "Test",
        lastName: "User",
      }
    })

    testDelivery = await prisma.emailDelivery.create({
      data: {
        campaignId: testCampaign.id,
        userId: user.id,
        contactId: testContact.id,
        recipientEmail: testContact.email,
        status: "SENT",
      }
    })

    testLink = await prisma.trackedLink.create({
      data: {
        campaignId: testCampaign.id,
        originalUrl: "https://google.com",
        urlHash: crypto.createHash("md5").update("https://google.com").digest("hex").substring(0, 10),
      }
    })

    console.log(`Setup complete: Campaign ID=${testCampaign.id}, Delivery ID=${testDelivery.id}, Link ID=${testLink.id}\n`)

    // --- TEST 1: Send Open Event (Non-Bot) via SQS ---
    console.log("Sending Non-Bot OPEN event to SQS...")
    const openEventPayload = {
      version: 1,
      type: "OPEN",
      deliveryId: testDelivery.id,
      timestamp: new Date().toISOString(),
      ip: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

    if (QUEUE_URL) {
      await sqsClient.send(new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify(openEventPayload),
      }))

      console.log("Waiting 5 seconds for background worker to consume SQS message...")
      await new Promise(resolve => setTimeout(resolve, 5000))

      // Verify DB updates
      const updatedCampaign = await prisma.campaign.findUnique({
        where: { id: testCampaign.id }
      })
      const openEvents = await prisma.emailOpenEvent.findMany({
        where: { deliveryId: testDelivery.id }
      })
      const uniqueOpens = await prisma.uniqueEmailOpen.findMany({
        where: { deliveryId: testDelivery.id }
      })

      assert(openEvents.length === 1, "Raw Open Event inserted")
      assert(!openEvents[0].isBot, "Raw Open Event is not bot")
      assert(uniqueOpens.length === 1, "Unique Open entry created")
      assert(updatedCampaign?.totalOpens === 1, "Campaign totalOpens incremented to 1")
      assert(updatedCampaign?.uniqueOpens === 1, "Campaign uniqueOpens incremented to 1")
    } else {
      console.warn("Skipping SQS portion of test: AWS_ANALYTICS_QUEUE_URL is undefined")
    }

    // --- TEST 2: Duplicate Open Event (Non-Bot) via SQS ---
    console.log("\nSending DUPLICATE Non-Bot OPEN event to SQS...")
    if (QUEUE_URL) {
      await sqsClient.send(new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify(openEventPayload),
      }))

      console.log("Waiting 5 seconds for background worker to consume SQS message...")
      await new Promise(resolve => setTimeout(resolve, 5000))

      const updatedCampaign = await prisma.campaign.findUnique({
        where: { id: testCampaign.id }
      })
      const openEvents = await prisma.emailOpenEvent.findMany({
        where: { deliveryId: testDelivery.id }
      })
      const uniqueOpens = await prisma.uniqueEmailOpen.findMany({
        where: { deliveryId: testDelivery.id }
      })

      assert(openEvents.length === 2, "Second Raw Open Event inserted (total = 2)")
      assert(uniqueOpens.length === 1, "Unique Open entry remains 1 (on conflict do nothing)")
      assert(updatedCampaign?.totalOpens === 2, "Campaign totalOpens incremented to 2")
      assert(updatedCampaign?.uniqueOpens === 1, "Campaign uniqueOpens remains 1")
    }

    // --- TEST 3: Send Open Event (Bot) via SQS ---
    console.log("\nSending Bot OPEN event (GoogleImageProxy) to SQS...")
    const botOpenEventPayload = {
      version: 1,
      type: "OPEN",
      deliveryId: testDelivery.id,
      timestamp: new Date().toISOString(),
      ip: "66.249.66.1",
      userAgent: "GoogleImageProxy"
    }

    if (QUEUE_URL) {
      await sqsClient.send(new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify(botOpenEventPayload),
      }))

      console.log("Waiting 5 seconds for background worker to consume SQS message...")
      await new Promise(resolve => setTimeout(resolve, 5000))

      const updatedCampaign = await prisma.campaign.findUnique({
        where: { id: testCampaign.id }
      })
      const openEvents = await prisma.emailOpenEvent.findMany({
        where: { deliveryId: testDelivery.id }
      })

      const botEvents = openEvents.filter(e => e.isBot)
      assert(botEvents.length === 1, "Bot Open Event inserted with isBot=true")
      assert(updatedCampaign?.totalOpens === 2, "Campaign totalOpens remains 2 (bot ignored)")
      assert(updatedCampaign?.uniqueOpens === 1, "Campaign uniqueOpens remains 1 (bot ignored)")
    }

    // --- TEST 4: Send Click Event (Non-Bot) via SQS ---
    console.log("\nSending Non-Bot CLICK event to SQS...")
    const clickEventPayload = {
      version: 1,
      type: "CLICK",
      deliveryId: testDelivery.id,
      trackedLinkId: testLink.id,
      timestamp: new Date().toISOString(),
      ip: "192.168.1.100",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    }

    if (QUEUE_URL) {
      await sqsClient.send(new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify(clickEventPayload),
      }))

      console.log("Waiting 5 seconds for background worker to consume SQS message...")
      await new Promise(resolve => setTimeout(resolve, 5000))

      const updatedCampaign = await prisma.campaign.findUnique({
        where: { id: testCampaign.id }
      })
      const clickEvents = await prisma.emailClickEvent.findMany({
        where: { deliveryId: testDelivery.id }
      })
      const uniqueClicks = await prisma.uniqueEmailClick.findMany({
        where: { deliveryId: testDelivery.id, trackedLinkId: testLink.id }
      })

      assert(clickEvents.length === 1, "Raw Click Event inserted")
      assert(!clickEvents[0].isBot, "Raw Click Event is not bot")
      assert(uniqueClicks.length === 1, "Unique Click entry created")
      assert(updatedCampaign?.totalClicks === 1, "Campaign totalClicks incremented to 1")
      assert(updatedCampaign?.uniqueClicks === 1, "Campaign uniqueClicks incremented to 1")
    }

  } catch (error: any) {
    console.error("Test execution failed:", error.message)
    allPassed = false
  } finally {
    // 3. Clean up
    console.log("\nCleaning up mock records...")
    if (testDelivery) {
      await prisma.emailDelivery.delete({ where: { id: testDelivery.id } }).catch(() => {})
    }
    if (testLink) {
      await prisma.trackedLink.delete({ where: { id: testLink.id } }).catch(() => {})
    }
    if (testContact) {
      await prisma.contact.delete({ where: { id: testContact.id } }).catch(() => {})
    }
    if (testCampaign) {
      await prisma.campaign.delete({ where: { id: testCampaign.id } }).catch(() => {})
    }
    await prisma.$disconnect()
  }

  if (allPassed) {
    console.log("\nAll Analytics Worker Integration tests passed successfully!")
  } else {
    console.error("\nSome tests failed. Check logs above.")
    process.exit(1)
  }
}

runTests()
