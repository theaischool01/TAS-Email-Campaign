import { NextResponse } from "next/server"
import { prisma as prismaClient } from "@/app/lib/prisma"

export async function GET() {
  const health: {
    status: "ok" | "degraded";
    timestamp: string;
    environment: string;
    checks: {
      database: "ok" | "error" | "unknown";
      workers: "ok" | "no_healthy_workers" | "error" | "unknown";
    };
    api: "healthy";
    workers: {
      healthy: number;
      status: "healthy" | "offline";
    };
  } = {
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    checks: {
      database: "unknown",
      workers: "unknown"
    },
    api: "healthy",
    workers: {
      healthy: 0,
      status: "offline"
    }
  }

  try {
    await prismaClient.$queryRaw`SELECT 1`
    health.checks.database = "ok"
  } catch (err) {
    health.status = "degraded"
    health.checks.database = "error"
  }

  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000)
    const healthyWorkersCount = await prismaClient.workerHeartbeat.count({
      where: {
        status: "HEALTHY",
        lastSeenAt: { gte: fiveMinutesAgo }
      }
    })

    health.workers.healthy = healthyWorkersCount

    if (healthyWorkersCount > 0) {
      health.checks.workers = "ok"
      health.workers.status = "healthy"
    } else {
      health.status = "degraded"
      health.checks.workers = "no_healthy_workers"
      health.workers.status = "offline"
    }
  } catch (err) {
    health.status = "degraded"
    health.checks.workers = "error"
    health.workers.status = "offline"
  }

  return NextResponse.json(health, { status: 200 })
}
