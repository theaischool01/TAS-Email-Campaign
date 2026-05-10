import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma as prismaClient } from "@/app/lib/prisma"

const prisma = prismaClient as any

export async function POST() {
  try {
    const email = 'admin@example.com'
    const password = 'admin123'
    const name = 'Super Admin'
    const role = 'SUPER_ADMIN'

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        name,
        role: 'SUPER_ADMIN'
      },
      create: {
        email,
        password: hashedPassword,
        name,
        role: 'SUPER_ADMIN'
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Admin user created/updated successfully',
      user: {
        email: user.email,
        name: user.name,
        role: user.role
      },
      credentials: {
        email,
        password
      }
    })
  } catch (error) {
    console.error('Error creating admin user:', error)
    return NextResponse.json(
      { error: 'Failed to create admin user', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
