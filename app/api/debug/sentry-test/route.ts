import { NextRequest, NextResponse } from "next/server";
import logger from "@/lib/logger";
import * as Sentry from "@sentry/nextjs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") || "all";

  // Mock Request ID for verification
  const testError = new Error("Sentry Verification Test Error");

  if (type === "console") {
    console.error("Triggering console.error test:", testError);
    return NextResponse.json({
      success: true,
      message: "console.error triggered",
      wasCaptured: (testError as any).__sentry_captured__ === true,
    });
  }

  if (type === "logger") {
    logger.error(testError, "Triggering logger.error test");
    return NextResponse.json({
      success: true,
      message: "logger.error triggered",
      wasCaptured: (testError as any).__sentry_captured__ === true,
    });
  }

  if (type === "uncaught") {
    throw new Error("Sentry Uncaught API Exception Verification Test");
  }

  // Test both console and logger together to verify deduplication
  const sharedError = new Error("Shared Deduplication Test Error");
  logger.error(sharedError, "Logged once via logger.error");
  console.error("Logged again via console.error:", sharedError);

  return NextResponse.json({
    success: true,
    message: "Deduplication test complete",
    wasCaptured: (sharedError as any).__sentry_captured__ === true,
  });
}
