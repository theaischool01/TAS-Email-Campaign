import "dotenv/config"
import { TrackingRewriter } from "../lib/email/tracking-rewriter"
import { TrackingTokenService } from "../lib/security/tracking-tokens"

async function runTests() {
  console.log("Tracking Rewriter Tests Starting...\n")

  let allPassed = true

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✓ ${testName} passed`)
    } else {
      console.error(`✗ ${testName} failed`)
      allPassed = false
    }
  }

  const deliveryId = "delivery_123"
  const trackedLinks = {
    "https://example.com/pricing": "link_abc",
    "http://example.com/blog": "link_def"
  }
  const appUrl = "https://mailflow.com"
  const unsubscribeLink = "https://mailflow.com/unsubscribe/recipient_abc"

  const options = {
    deliveryId,
    trackedLinks,
    appUrl,
    unsubscribeLink
  }

  // Test 1 — Normal URL rewritten
  try {
    const html = `<a href="https://example.com/pricing">Pricing</a>`
    const rewritten = TrackingRewriter.rewrite(html, options)
    assert(
      rewritten.includes(`${appUrl}/api/track/click/`) && !rewritten.includes("https://example.com/pricing"),
      "URL rewrite"
    )
  } catch (e: any) {
    console.error("Test 1 error:", e.message)
    allPassed = false
  }

  // Test 2 — mailto untouched
  try {
    const html = `<a href="mailto:test@example.com">Mail</a>`
    const rewritten = TrackingRewriter.rewrite(html, options)
    assert(rewritten.includes(`href="mailto:test@example.com"`), "Mailto protection")
  } catch (e: any) {
    console.error("Test 2 error:", e.message)
    allPassed = false
  }

  // Test 3 — tel untouched
  try {
    const html = `<a href="tel:+12345">Phone</a>`
    const rewritten = TrackingRewriter.rewrite(html, options)
    assert(rewritten.includes(`href="tel:+12345"`), "Tel protection")
  } catch (e: any) {
    console.error("Test 3 error:", e.message)
    allPassed = false
  }

  // Test 4 — javascript untouched
  try {
    const html = `<a href="javascript:void(0)">JS</a>`
    const rewritten = TrackingRewriter.rewrite(html, options)
    assert(rewritten.includes(`href="javascript:void(0)"`), "Javascript protection")
  } catch (e: any) {
    console.error("Test 4 error:", e.message)
    allPassed = false
  }

  // Test 5 — anchor untouched
  try {
    const html = `<a href="#section">Anchor</a>`
    const rewritten = TrackingRewriter.rewrite(html, options)
    assert(rewritten.includes(`href="#section"`), "Anchor protection")
  } catch (e: any) {
    console.error("Test 5 error:", e.message)
    allPassed = false
  }

  // Test 6 — unsubscribe untouched
  try {
    const html = `<a href="${unsubscribeLink}">Unsubscribe</a>`
    const rewritten = TrackingRewriter.rewrite(html, options)
    assert(rewritten.includes(`href="${unsubscribeLink}"`), "Unsubscribe protection")
  } catch (e: any) {
    console.error("Test 6 error:", e.message)
    allPassed = false
  }

  // Test 7 — already tracked URL untouched
  try {
    const html = `<a href="${appUrl}/api/track/click/token_already_present">Click</a>`
    const rewritten = TrackingRewriter.rewrite(html, options)
    assert(rewritten.includes(`href="${appUrl}/api/track/click/token_already_present"`), "Double rewrite protection")
  } catch (e: any) {
    console.error("Test 7 error:", e.message)
    allPassed = false
  }

  // Test 8 — missing trackedLinkId does not throw
  try {
    const html = `<a href="https://example.com/unregistered">Unregistered</a>`
    const rewritten = TrackingRewriter.rewrite(html, options)
    assert(rewritten.includes(`href="https://example.com/unregistered"`), "Missing tracked link protection")
  } catch (e: any) {
    console.error("Test 8 error:", e.message)
    allPassed = false
  }

  // Test 9 — pixel inserted before body tag
  try {
    const html = `<html><body><h1>Hello</h1></body></html>`
    const rewritten = TrackingRewriter.rewrite(html, options)
    assert(
      rewritten.includes("/api/track/open/") && rewritten.includes("</body></html>") && rewritten.indexOf("/api/track/open/") < rewritten.indexOf("</body>"),
      "Body pixel insertion"
    )
  } catch (e: any) {
    console.error("Test 9 error:", e.message)
    allPassed = false
  }

  // Test 10 — pixel inserted before html tag
  try {
    const html = `<html><h1>Hello</h1></html>`
    const rewritten = TrackingRewriter.rewrite(html, options)
    assert(
      rewritten.includes("/api/track/open/") && rewritten.includes("</html>") && rewritten.indexOf("/api/track/open/") < rewritten.indexOf("</html>"),
      "HTML pixel insertion"
    )
  } catch (e: any) {
    console.error("Test 10 error:", e.message)
    allPassed = false
  }

  // Test 11 — pixel appended when no body/html tag exists
  try {
    const html = `<h1>Hello Fragment</h1>`
    const rewritten = TrackingRewriter.rewrite(html, options)
    assert(
      rewritten.startsWith("<h1>Hello Fragment</h1><img src="),
      "Fragment pixel insertion"
    )
  } catch (e: any) {
    console.error("Test 11 error:", e.message)
    allPassed = false
  }

  // Test 12 — pixel idempotency works
  try {
    const html = `<h1>Hello</h1>`
    const firstRewrite = TrackingRewriter.rewrite(html, options)
    const secondRewrite = TrackingRewriter.rewrite(firstRewrite, options)
    assert(
      firstRewrite === secondRewrite,
      "Pixel idempotency"
    )
  } catch (e: any) {
    console.error("Test 12 error:", e.message)
    allPassed = false
  }

  console.log("")
  if (allPassed) {
    console.log("All tracking rewriter tests passed.")
  } else {
    console.error("Some tracking rewriter tests failed.")
    process.exit(1)
  }
}

runTests()
