import { getServerSession } from "next-auth"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"
import { PrismaClient } from "@prisma/client"
import { prisma as importedPrisma } from "../app/lib/prisma"

const prisma = importedPrisma || new PrismaClient()
import { headers } from "next/headers"
import { checkIpLock, recordFailedAttempt, resetAttempts } from "./auth-security"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        // Get client IP
        const headersList = await headers()
        const ip = (headersList as any).get?.("x-forwarded-for") || "127.0.0.1"

        // Check if IP is locked
        const { isLocked, remainingTime } = await checkIpLock(ip)
        if (isLocked) {
          throw new Error(`Too many failed attempts. Try again in ${remainingTime} minutes.`)
        }

        // Fetch actual user from Prisma database
        const dbUser = await (prisma as any).user.findUnique({
          where: { email: credentials.email }
        })
        
        if (!dbUser) {
          await recordFailedAttempt(ip)
          return null
        }
        
        // Verify password
        const isPasswordValid = await bcrypt.compare(credentials.password, dbUser.password)
        
        if (!isPasswordValid) {
          await recordFailedAttempt(ip)
          return null
        }

        // Success - reset attempts
        await resetAttempts(ip)

        return {
          id: dbUser.id,
          email: dbUser.email,
          name: dbUser.name,
          role: dbUser.role,
        } as any
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 15 * 60, // 15 minutes
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      try {
        if (user) {
          token.role = user.role
          token.sub = user.id
          token.name = user.name
          token.email = user.email
        }
        return token
      } catch (error: any) {
        console.error("NextAuth JWT callback error:", error)
        return token
      }
    },
    async session({ session, token }) {
      try {
        if (token) {
          session.user.id = token.sub as string
          session.user.role = token.role as any
          session.user.name = token.name as string
          session.user.email = token.email as string
        }
        return session
      } catch (error: any) {
        console.error("NextAuth session callback error:", error)
        return session
      }
    }
  },
  pages: {
    signIn: "/login",
  },
  debug: process.env.NODE_ENV === "development",
}

export const getAuthSession = () => getServerSession(authOptions)
