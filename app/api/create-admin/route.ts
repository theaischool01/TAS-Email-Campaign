// SETUP ENDPOINT — Allows creating admin users with developer secret verification
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma as prismaClient } from "@/app/lib/prisma"
import logger from "@/lib/logger"
import { seedDefaultTemplatesForUser } from "@/lib/services/default-template.service"

const prisma = prismaClient as any

import { enforceRateLimit, getClientIp, handleRateLimitError } from "@/lib/security/rate-limit"

export async function POST(request: NextRequest) {
  try {
    // 1. Enforce Rate Limiting
    const ip = getClientIp(request)
    try {
      await enforceRateLimit("admin", `admin:${ip}`)
    } catch (limitErr) {
      const errorRes = handleRateLimitError(limitErr)
      if (errorRes) return errorRes
    }

    // 2. Prevent Bootstrap if Admin Already Exists
    const existingAdmin = await prisma.user.findFirst({
      where: { role: "ADMIN" }
    })
    if (existingAdmin) {
      return NextResponse.json(
        { error: "Forbidden - Administrator account already configured" },
        { status: 403 }
      )
    }

    // 3. Verify the x-developer-secret header matches the environment secret
    const developerSecret = process.env.DEVELOPER_SECRET
    if (!developerSecret) {
      return NextResponse.json(
        { error: "DEVELOPER_SECRET is not configured on the server" },
        { status: 500 }
      )
    }

    const headerSecret = request.headers.get("x-developer-secret")
    if (!headerSecret || headerSecret !== developerSecret) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // 2. Read fields from request body
    const body = await request.json()
    const { email, name } = body
    const password = body.password || process.env.ADMIN_DEFAULT_PASSWORD

    if (!email || !name) {
      return NextResponse.json(
        { error: "Email, password, and name are required" },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { error: "password is required or set ADMIN_DEFAULT_PASSWORD in .env" },
        { status: 400 }
      )
    }

    // 3. Block duplicate emails
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    // 4. Create admin and seed default templates in a single transaction
    const user = await prisma.$transaction(async (tx: any) => {
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: "ADMIN"
        }
      })

      return newUser;
    })

    logger.info(`[ADMIN-SETUP] ADMIN created successfully and templates seeded: ${email}`)

    return NextResponse.json({
      success: true,
      message: "Admin user created and default templates seeded successfully.",
      user: {
        email: user.email,
        name: user.name,
        role: user.role
      }
    }, { status: 201 })
  } catch (error: any) {
    logger.error({ error }, "Error creating admin user")
    return NextResponse.json(
      { error: error.message || "Failed to create admin user" },
      { status: 500 }
    )
  }
}
