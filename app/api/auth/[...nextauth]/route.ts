import NextAuth from "next-auth"
import { authOptions } from "@/lib/next-auth"
import { NextRequest } from "next/server"
import { enforceRateLimit, getClientIp, handleRateLimitError } from "@/lib/security/rate-limit"

const authHandler = NextAuth(authOptions)

async function handler(req: NextRequest, context: any) {
  if (req.method === "POST") {
    try {
      const ip = getClientIp(req)
      let identifier = "unknown"
      try {
        const clonedReq = req.clone()
        const body = await clonedReq.json()
        if (body && body.email) {
          identifier = body.email.trim().toLowerCase()
        } else if (body && body.username) {
          identifier = body.username.trim().toLowerCase()
        }
      } catch (e) {
        // Fallback on parse failure
      }

      const key = `login:${ip}:${identifier}`
      await enforceRateLimit("login", key)
    } catch (error) {
      const limitErrorResponse = handleRateLimitError(error)
      if (limitErrorResponse) return limitErrorResponse
    }
  }

  return authHandler(req, context)
}

export { handler as GET, handler as POST }
