import "dotenv/config"
import { QueueService } from "../lib/services/queue.service"

async function test() {
  console.log("Enqueuing test analytics event...")
  try {
    await QueueService.enqueueAnalyticsEvent({
      type: "OPEN",
      deliveryId: "test_delivery_123",
      timestamp: new Date().toISOString(),
      ip: "127.0.0.1",
      userAgent: "MailFlow-Test-Agent"
    } as any)
    console.log("Success! Event enqueued to mailflow-analytics-queue.")
  } catch (err) {
    console.error("Failed to enqueue event:", err)
  }
}

test()
