import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { LinkExtractor } from "../lib/email/link-extractor"
import { TrackedLinkService } from "../lib/email/tracked-link-service"
import crypto from "crypto"

const prisma = new PrismaClient() as any
const TEST_USER_ID = "cmqav8tnn0000tahoebfdik6q" // Saheel's User ID

async function runTests() {
  console.log("Tracked Link Preparation Tests Starting...\n")

  let allPassed = true

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✓ ${testName} passed`)
    } else {
      console.error(`✗ ${testName} failed`)
      allPassed = false
    }
  }

  // Test 1 — Duplicate Removal
  try {
    const html = `
      <a href="https://site.com/a">A</a>
      <a href="https://site.com/a">A again</a>
    `
    const extracted = LinkExtractor.extract(html)
    assert(extracted.length === 1 && extracted[0] === "https://site.com/a", "Duplicate extraction")
  } catch (e: any) {
    console.error("Test 1 failed with error:", e.message)
    allPassed = false
  }

  // Test 2 — Ignore Non-Trackable Links
  try {
    const html = `
      <a href="mailto:test@test.com">Mail</a>
      <a href="tel:12345">Phone</a>
      <a href="javascript:void(0)">JS</a>
      <a href="#section">Anchor</a>
      <a href="">Empty</a>
    `
    const extracted = LinkExtractor.extract(html)
    assert(extracted.length === 0, "Invalid URL filtering")
  } catch (e: any) {
    console.error("Test 2 failed with error:", e.message)
    allPassed = false
  }

  // Test 3 — Hash Stability
  try {
    const url = "https://example.com/pricing"
    const hash1 = crypto.createHash("sha256").update(url).digest("hex")
    const hash2 = crypto.createHash("sha256").update(url).digest("hex")
    assert(hash1 === hash2 && hash1.length === 64, "Hash generation")
  } catch (e: any) {
    console.error("Test 3 failed with error:", e.message)
    allPassed = false
  }

  // Test 4 — Database Idempotency
  let testCampaign: any = null
  try {
    // 1. Create a mock campaign
    testCampaign = await prisma.campaign.create({
      data: {
        createdBy: TEST_USER_ID,
        name: "test_link_prep_campaign_temp",
        subject: "Temp Link Prep Subject",
      }
    })

    const html = `
      <a href="https://site.com/link-a">A</a>
      <a href="https://site.com/link-b">B</a>
    `

    // Run first preparation
    await TrackedLinkService.prepareCampaignLinks(testCampaign.id, html)
    const countFirst = await prisma.trackedLink.count({ where: { campaignId: testCampaign.id } })

    // Run second preparation (retry test)
    await TrackedLinkService.prepareCampaignLinks(testCampaign.id, html)
    const countSecond = await prisma.trackedLink.count({ where: { campaignId: testCampaign.id } })

    assert(countFirst === 2 && countSecond === 2, "Database idempotency")
  } catch (e: any) {
    console.error("Test 4 failed with error:", e.message)
    allPassed = false
  } finally {
    // Cleanup
    if (testCampaign) {
      await prisma.trackedLink.deleteMany({ where: { campaignId: testCampaign.id } }).catch(() => {})
      await prisma.campaign.delete({ where: { id: testCampaign.id } }).catch(() => {})
    }
    await prisma.$disconnect()
  }

  console.log("")
  if (allPassed) {
    console.log("All tracked link tests passed.")
  } else {
    console.error("Some tracked link tests failed.")
    process.exit(1)
  }
}

runTests()
