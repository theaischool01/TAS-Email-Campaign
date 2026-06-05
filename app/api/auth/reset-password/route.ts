import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/app/lib/prisma"
import logger from "@/lib/logger"

const schema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: (parsed.error as any).errors[0]?.message || "Invalid request" },
        { status: 400 }
      )
    }

    const { token, newPassword } = parsed.data

    const user = await (prisma as any).user.findUnique({
      where: { resetToken: token },
    })

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired link" },
        { status: 400 }
      )
    }

    if (!user.resetTokenExpiry || new Date() > new Date(user.resetTokenExpiry)) {
      return NextResponse.json(
        { error: "Invalid or expired link" },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await (prisma as any).user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    })

    return NextResponse.json(
      { message: "Password updated successfully" },
      { status: 200 }
    )
  } catch (error) {
    logger.error({ error }, "Reset password error")
    return NextResponse.json(
      { error: "Failed to reset password. Please try again." },
      { status: 500 }
    )
  }
}
