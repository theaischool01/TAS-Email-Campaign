import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { prisma as prismaClient } from "@/app/lib/prisma"

const prisma = prismaClient as any

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 })
    }

    const workers = await prisma.workerHeartbeat.findMany({
      orderBy: { lastSeenAt: "desc" },
      select: {
        id: true,
        hostname: true,
        processId: true,
        status: true,
        version: true,
        environment: true,
        activeMessages: true,
        successfulMessages: true,
        failedMessages: true,
        memoryUsageMb: true,
        uptimeSeconds: true,
        startedAt: true,
        lastSeenAt: true
      }
    })

    return NextResponse.json({ workers })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    )
  }
}
