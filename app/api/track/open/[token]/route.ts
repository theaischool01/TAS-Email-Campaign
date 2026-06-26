import { NextRequest, NextResponse } from "next/server"
import { TrackingTokenService } from "@/lib/security/tracking-tokens"
import { QueueService } from "@/lib/services/queue.service"
import { TRANSPARENT_GIF_BUFFER } from "@/lib/tracking/pixel"
import logger from "@/lib/logger"

function getPixelResponse() {
  return new NextResponse(TRANSPARENT_GIF_BUFFER, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0, proxy-revalidate",
      "Pragma": "no-cache",
      "Expires": "0",
    },
  })
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params

    // 1. Decrypt token
    const payload = TrackingTokenService.decrypt(token)
    if (!payload || payload.t !== "o" || !payload.d) {
      logger.warn({ token }, "Open tracking token decryption or validation failed")
      return getPixelResponse()
    }

    const deliveryId = payload.d
    const userAgent = request.headers.get("user-agent") || "unknown"
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      (request as any).ip ||
      "127.0.0.1"

    // 2. Enqueue analytics event (non-blocking)
    try {
      await QueueService.enqueueAnalyticsEvent({
        version: 1,
        type: "OPEN",
        deliveryId,
        timestamp: new Date().toISOString(),
        ip,
        userAgent,
      })
    } catch (queueError: any) {
      logger.error({ error: queueError.message, deliveryId }, "Failed to enqueue OPEN event to SQS")
    }

    return getPixelResponse()
  } catch (error: any) {
    logger.error({ error: error.message }, "Unexpected error in open tracking endpoint")
    return getPixelResponse()
  }
}
