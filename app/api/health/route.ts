import { NextResponse } from "next/server"
import { prisma as prismaClient } from "@/app/lib/prisma"

export async function GET() {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    checks: {
      database: "unknown",
    }
  }

  try {
    await prismaClient.$queryRaw`SELECT 1`
    health.checks.database = "ok"
  } catch (err) {
    health.status = "degraded"
    health.checks.database = "error"
  }

  const statusCode = health.status === "ok" ? 200 : 503
  return NextResponse.json(health, { status: statusCode })
}
