import "dotenv/config"
import { TrackingTokenService } from "../lib/security/tracking-tokens"

async function runTests() {
  console.log("AES-GCM Tracking Token Tests Starting...\n")

  let allPassed = true

  // Helper function for assertion
  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✓ ${testName} passed`)
    } else {
      console.error(`✗ ${testName} failed`)
      allPassed = false
    }
  }

  // Test 1 — Open Token Round Trip
  try {
    const openPayload = { t: "o" as const, d: "delivery_123" }
    const encrypted = TrackingTokenService.encrypt(openPayload)
    const decrypted = TrackingTokenService.decrypt(encrypted)
    assert(
      decrypted !== null && decrypted.t === "o" && decrypted.d === "delivery_123",
      "Open token round trip"
    )
  } catch (e: any) {
    console.error("Test 1 error:", e.message)
    allPassed = false
  }

  // Test 2 — Click Token Round Trip
  try {
    const clickPayload = { t: "c" as const, d: "delivery_123", l: "link_456" }
    const encrypted = TrackingTokenService.encrypt(clickPayload)
    const decrypted = TrackingTokenService.decrypt(encrypted)
    assert(
      decrypted !== null && decrypted.t === "c" && decrypted.d === "delivery_123" && decrypted.l === "link_456",
      "Click token round trip"
    )
  } catch (e: any) {
    console.error("Test 2 error:", e.message)
    allPassed = false
  }

  // Test 3 — Token Tampering
  try {
    const clickPayload = { t: "c" as const, d: "delivery_123", l: "link_456" }
    const encrypted = TrackingTokenService.encrypt(clickPayload)
    // Modify one character in the token body
    const tampered = encrypted.substring(0, 10) + (encrypted[10] === "A" ? "B" : "A") + encrypted.substring(11)
    const decrypted = TrackingTokenService.decrypt(tampered)
    assert(decrypted === null, "Tamper detection")
  } catch (e: any) {
    console.error("Test 3 error:", e.message)
    allPassed = false
  }

  // Test 4 — Invalid Version
  try {
    const clickPayload = { t: "c" as const, d: "delivery_123", l: "link_456" }
    const encrypted = TrackingTokenService.encrypt(clickPayload)
    // Decode, modify version byte (first byte), encode back
    const buffer = Buffer.from(encrypted, "base64url")
    buffer.writeUInt8(99, 0) // write invalid version
    const corrupted = buffer.toString("base64url")
    const decrypted = TrackingTokenService.decrypt(corrupted)
    assert(decrypted === null, "Version validation")
  } catch (e: any) {
    console.error("Test 4 error:", e.message)
    allPassed = false
  }

  // Test 5 — Invalid Payload Shape
  try {
    const invalidPayload = { t: "x" as any, d: "delivery_123" }
    let threw = false
    try {
      TrackingTokenService.encrypt(invalidPayload)
    } catch (e) {
      threw = true
    }
    assert(threw, "Payload validation")
  } catch (e: any) {
    console.error("Test 5 error:", e.message)
    allPassed = false
  }

  console.log("")
  if (allPassed) {
    console.log("All tracking token tests passed.")
  } else {
    console.error("Some tracking token tests failed.")
    process.exit(1)
  }
}

runTests()
