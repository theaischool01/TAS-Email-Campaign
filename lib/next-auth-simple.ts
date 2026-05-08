import { getServerSession } from "next-auth"
import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"
import { PrismaClient } from "@prisma/client"

// Simple Prisma client for NextAuth
const prisma = new PrismaClient({
  log: ['error'],
})

export const authOptions: NextAuthOptions = {
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

        // For now, return a mock user to test auth flow
        const isPasswordValid = await bcrypt.compare(credentials.password, "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS")
        
        if (!isPasswordValid) {
          return null
        }

        return {
          id: "admin_123",
          email: "admin@example.com",
          name: "Super Admin",
          role: "SUPER_ADMIN",
        } as any
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as any
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  }
}

export const getAuthSession = () => getServerSession(authOptions)
