import "dotenv/config"
import { NextRequest } from "next/server"
import { GET as openGet } from "../app/api/track/open/[token]/route"
import { GET as clickGet } from "../app/api/track/click/[token]/route"
import { TrackingTokenService } from "../lib/security/tracking-tokens"
import { QueueService } from "../lib/services/queue.service"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient() as any
const TEST_USER_ID = "cmqav8tnn0000tahoebfdik6q" // Saheel's User ID

async function runTests() {
  console.log("Tracking Ingestion Routes Tests Starting...\n")

  let allPassed = true

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✓ ${testName} passed`)
    } else {
      console.error(`✗ ${testName} failed`)
      allPassed = false
    }
  }

  let testCampaign: any = null
  let testLink: any = null

  try {
    // 1. Setup mock Campaign and TrackedLink
    testCampaign = await prisma.campaign.create({
      data: {
        createdBy: TEST_USER_ID,
        name: "test_routes_campaign",
        subject: "Subject",
      }
    })

    testLink = await prisma.trackedLink.create({
      data: {
        campaignId: testCampaign.id,
        originalUrl: "https://example.com/pricing-target",
        urlHash: "dummyhash123"
      }
    })

    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").trim().replace(/\/$/, "")

    // Mock QueueService to verify events are enqueued
    let enqueuedEvent: any = null
    const originalEnqueue = QueueService.enqueueAnalyticsEvent
    QueueService.enqueueAnalyticsEvent = async (event: any) => {
      enqueuedEvent = event
    }

    // --- Test 1: Open Token Round Trip ---
    try {
      const token = TrackingTokenService.encrypt({ t: "o", d: "delivery_open_123" })
      const req = new NextRequest(`${appUrl}/api/track/open/${token}`, {
        headers: { "user-agent": "MailFlow-Tester" }
      })

      enqueuedEvent = null
      const res = await openGet(req, { params: Promise.resolve({ token }) })

      const isGif = res.headers.get("content-type") === "image/gif"
      const isEnqueued = enqueuedEvent !== null && enqueuedEvent.type === "OPEN" && enqueuedEvent.deliveryId === "delivery_open_123"

      assert(res.status === 200 && isGif && isEnqueued, "Open token round trip")
    } catch (e: any) {
      console.error("Test 1 failed:", e.message)
      allPassed = false
    }

    // --- Test 2: Click Token Round Trip ---
    try {
      const token = TrackingTokenService.encrypt({ t: "c", d: "delivery_click_123", l: testLink.id })
      const req = new NextRequest(`${appUrl}/api/track/click/${token}`, {
        headers: { "user-agent": "MailFlow-Tester" }
      })

      enqueuedEvent = null
      const res = await clickGet(req, { params: Promise.resolve({ token }) })

      const isRedirect = res.status === 302 || res.status === 307
      const redirectUrl = res.headers.get("location")?.trim().replace(/\/$/, "")
      const isEnqueued = enqueuedEvent !== null && enqueuedEvent.type === "CLICK" && enqueuedEvent.deliveryId === "delivery_click_123" && enqueuedEvent.trackedLinkId === testLink.id

      assert(isRedirect && redirectUrl === "https://example.com/pricing-target" && isEnqueued, "Click token round trip")
    } catch (e: any) {
      console.error("Test 2 failed:", e.message)
      allPassed = false
    }

    // --- Test 3: Invalid Token Fallbacks ---
    try {
      const invalidToken = "invalid_token_xyz"
      const openReq = new NextRequest(`${appUrl}/api/track/open/${invalidToken}`)
      const clickReq = new NextRequest(`${appUrl}/api/track/click/${invalidToken}`)

      const openRes = await openGet(openReq, { params: Promise.resolve({ token: invalidToken }) })
      const clickRes = await clickGet(clickReq, { params: Promise.resolve({ token: invalidToken }) })

      const isOpenSafe = openRes.status === 200 && openRes.headers.get("content-type") === "image/gif"
      const redirectUrl = clickRes.headers.get("location")?.trim().replace(/\/$/, "")
      const isClickSafe = (clickRes.status === 302 || clickRes.status === 307) && redirectUrl === appUrl

      assert(isOpenSafe && isClickSafe, "Invalid token fallbacks")
    } catch (e: any) {
      console.error("Test 3 failed:", e.message)
      allPassed = false
    }

    // --- Test 4: Queue Failure Safety ---
    try {
      // Mock QueueService to throw an error
      QueueService.enqueueAnalyticsEvent = async () => {
        throw new Error("Simulated SQS Connection Timeout")
      }

      const tokenOpen = TrackingTokenService.encrypt({ t: "o", d: "delivery_open_fail" })
      const tokenClick = TrackingTokenService.encrypt({ t: "c", d: "delivery_click_fail", l: testLink.id })

      const openReq = new NextRequest(`${appUrl}/api/track/open/${tokenOpen}`)
      const clickReq = new NextRequest(`${appUrl}/api/track/click/${tokenClick}`)

      const openRes = await openGet(openReq, { params: Promise.resolve({ token: tokenOpen }) })
      const clickRes = await clickGet(clickReq, { params: Promise.resolve({ token: tokenClick }) })

      const isOpenSafe = openRes.status === 200 && openRes.headers.get("content-type") === "image/gif"
      const redirectUrl = clickRes.headers.get("location")?.trim().replace(/\/$/, "")
      const isClickSafe = (clickRes.status === 302 || clickRes.status === 307) && redirectUrl === "https://example.com/pricing-target"

      assert(isOpenSafe && isClickSafe, "Queue failure safety")
    } catch (e: any) {
      console.error("Test 4 failed:", e.message)
      allPassed = false
    }

    // Restore original QueueService
    QueueService.enqueueAnalyticsEvent = originalEnqueue

  } catch (dbSetupErr: any) {
    console.error("Database setup failed:", dbSetupErr.message)
    allPassed = false
  } finally {
    // Clean up DB mock records
    if (testLink) {
      await prisma.trackedLink.delete({ where: { id: testLink.id } }).catch(() => {})
    }
    if (testCampaign) {
      await prisma.campaign.delete({ where: { id: testCampaign.id } }).catch(() => {})
    }
    await prisma.$disconnect()
  }

  console.log("")
  if (allPassed) {
    console.log("All tracking route tests passed.")
  } else {
    console.error("Some tracking route tests failed.")
    process.exit(1)
  }
}

runTests()
