// SETUP ENDPOINT — Allows creating admin users with developer secret verification
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma as prismaClient } from "@/app/lib/prisma"
import logger from "@/lib/logger"

const prisma = prismaClient as any

export async function POST(request: NextRequest) {
  try {
    // 1. Verify the x-developer-secret header matches the environment secret
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

    // 4. Create admin with role 'ADMIN'
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "ADMIN"
      }
    })

    // 5. Copy system templates on admin creation
    const systemTemplates = await prisma.emailTemplate.findMany({
      where: { isSystem: true }
    })

    for (const template of systemTemplates) {
      await prisma.emailTemplate.create({
        data: {
          name: template.name,
          category: template.category,
          thumbnail: template.thumbnail,
          html: template.html,
          json: template.json,
          createdBy: user.id,
          isPublic: template.isPublic,
          isSystem: false
        }
      })
    }

    logger.info(`[ADMIN-SETUP] ADMIN created successfully: ${email}`)

    return NextResponse.json({
      success: true,
      message: "Admin user created and system templates seeded successfully.",
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
