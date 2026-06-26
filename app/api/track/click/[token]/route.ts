import { NextRequest, NextResponse } from "next/server"
import { TrackingTokenService } from "@/lib/security/tracking-tokens"
import { QueueService } from "@/lib/services/queue.service"
import { prisma as prismaClient } from "@/app/lib/prisma"
import logger from "@/lib/logger"

const prisma = prismaClient as any

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  let originalUrl: string = appUrl

  try {
    const { token } = await params

    // 1. Decrypt token
    const payload = TrackingTokenService.decrypt(token)
    if (!payload || payload.t !== "c" || !payload.d || !payload.l) {
      logger.warn({ token }, "Click tracking token decryption or validation failed")
      return NextResponse.redirect(appUrl, 302)
    }

    const deliveryId = payload.d
    const trackedLinkId = payload.l

    // 2. Resolve trackedLinkId -> originalUrl
    const trackedLink = await prisma.trackedLink.findUnique({
      where: { id: trackedLinkId },
      select: { originalUrl: true },
    })

    if (!trackedLink) {
      logger.warn({ trackedLinkId, deliveryId }, "TrackedLink record not found in database during redirect")
      return NextResponse.redirect(appUrl, 302)
    }

    originalUrl = trackedLink.originalUrl

    const userAgent = request.headers.get("user-agent") || "unknown"
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
      request.headers.get("x-real-ip") ||
      (request as any).ip ||
      "127.0.0.1"

    // 3. Enqueue analytics event (non-blocking, inside try/catch)
    try {
      await QueueService.enqueueAnalyticsEvent({
        version: 1,
        type: "CLICK",
        deliveryId,
        trackedLinkId,
        timestamp: new Date().toISOString(),
        ip,
        userAgent,
      })
    } catch (queueError: any) {
      logger.error({ error: queueError.message, deliveryId, trackedLinkId }, "Failed to enqueue CLICK event to SQS")
    }

    return NextResponse.redirect(originalUrl, 302)
  } catch (error: any) {
    logger.error({ error: error.message }, "Unexpected error in click tracking redirect route")
    return NextResponse.redirect(originalUrl, 302)
  }
}
