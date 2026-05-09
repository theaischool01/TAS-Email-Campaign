import { prisma } from "@/app/lib/prisma"

const MAX_ATTEMPTS = 5
const LOCK_DURATION = 15 * 60 * 1000 // 15 minutes in milliseconds

export async function checkIpLock(ip: string): Promise<{ isLocked: boolean; remainingTime?: number }> {
  try {
    const attempt = await (prisma as any).loginAttempt.findUnique({
      where: { ip }
    })

    if (!attempt || !attempt.lockedUntil) {
      return { isLocked: false }
    }

    const now = new Date()
    if (now < new Date(attempt.lockedUntil)) {
      const remainingTime = Math.ceil((new Date(attempt.lockedUntil).getTime() - now.getTime()) / 60000)
      return { isLocked: true, remainingTime }
    }

    // Lock has expired, reset attempts
    await (prisma as any).loginAttempt.update({
      where: { ip },
      data: {
        attempts: 0,
        lockedUntil: null
      }
    })

    return { isLocked: false }
  } catch (error) {
    console.error("Error checking IP lock:", error)
    return { isLocked: false }
  }
}

export async function recordFailedAttempt(ip: string): Promise<void> {
  try {
    const attempt = await (prisma as any).loginAttempt.findUnique({
      where: { ip }
    })

    if (!attempt) {
      await (prisma as any).loginAttempt.create({
        data: {
          ip,
          attempts: 1
        }
      })
      return
    }

    const newAttempts = attempt.attempts + 1
    const shouldLock = newAttempts >= MAX_ATTEMPTS

    await (prisma as any).loginAttempt.update({
      where: { ip },
      data: {
        attempts: newAttempts,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCK_DURATION) : null
      }
    })
  } catch (error) {
    console.error("Error recording failed attempt:", error)
  }
}

export async function resetAttempts(ip: string): Promise<void> {
  try {
    await (prisma as any).loginAttempt.upsert({
      where: { ip },
      update: {
        attempts: 0,
        lockedUntil: null
      },
      create: {
        ip,
        attempts: 0
      }
    })
  } catch (error) {
    console.error("Error resetting attempts:", error)
  }
}
