import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { z } from "zod"
import { prisma } from "@/app/lib/prisma"
import { sendTransactionalEmail } from "@/lib/services/email.service"
import logger from "@/lib/logger"

const schema = z.object({
  email: z.string().email(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      // Return the same message to prevent enumeration
      return NextResponse.json(
        { message: "If this email exists, a reset link has been sent" },
        { status: 200 }
      )
    }

    const { email } = parsed.data
    const user = await (prisma as any).user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Always return the same response — prevents email enumeration attacks
    if (!user) {
      return NextResponse.json(
        { message: "If this email exists, a reset link has been sent" },
        { status: 200 }
      )
    }

    // Generate a secure random token
    const token = crypto.randomBytes(32).toString("hex")
    const expiry = new Date(Date.now() + 60 * 60 * 1000) // 1 hour from now

    await (prisma as any).user.update({
      where: { id: user.id },
      data: {
        resetToken: token,
        resetTokenExpiry: expiry,
      },
    })

    const resetUrl =
      (process.env.NEXTAUTH_URL || "http://localhost:3000") +
      "/reset-password?token=" +
      token

    await sendTransactionalEmail({
      to: user.email,
      subject: "Reset your password",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8" />
            <style>
              body { font-family: Arial, sans-serif; background: #f9fafb; margin: 0; padding: 0; }
              .container { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 8px; padding: 40px; border: 1px solid #e5e7eb; }
              h1 { font-size: 22px; color: #111827; margin-bottom: 8px; }
              p { color: #6b7280; font-size: 15px; line-height: 1.6; }
              .btn { display: inline-block; margin: 24px 0; padding: 12px 28px; background: #2563eb; color: #ffffff; text-decoration: none; border-radius: 6px; font-size: 15px; font-weight: 600; }
              .footer { margin-top: 32px; font-size: 13px; color: #9ca3af; border-top: 1px solid #f3f4f6; padding-top: 20px; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>Reset Your Password</h1>
              <p>Click the link below to reset your password. This link expires in <strong>1 hour</strong>.</p>
              <a class="btn" href="${resetUrl}">Reset Password</a>
              <p>If you did not request this, you can safely ignore this email.</p>
              <div class="footer">This email was sent from Email Campaign Platform.</div>
            </div>
          </body>
        </html>
      `,
    })

    return NextResponse.json(
      { message: "If this email exists, a reset link has been sent" },
      { status: 200 }
    )
  } catch (error) {
    logger.error({ error }, "Forgot password error")
    // Return the same safe message even on internal errors
    return NextResponse.json(
      { message: "If this email exists, a reset link has been sent" },
      { status: 200 }
    )
  }
}
