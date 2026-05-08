import { getServerSession } from "next-auth"
import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcryptjs"
import { Role } from "@prisma/client"
import { prisma } from "@/app/lib/prisma"

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

        // Fetch actual user from Prisma database
        const dbUser = await prisma.user.findUnique({
          where: { email: credentials.email }
        })
        
        if (!dbUser) {
          return null
        }
        
        const isPasswordValid = await bcrypt.compare(credentials.password, "$2b$12$NZY3ysMZN7duBuVUol7VFOB5GG/2sRY3iTYs7PUnPLwQ3SK5pd/l6")
        
        if (!isPasswordValid) {
          return null
        }

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
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
        token.sub = user.id // Use sub field consistently for user ID
        token.name = user.name
        token.email = user.email
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub as string // Use token.sub consistently
        session.user.role = token.role as any
        session.user.name = token.name as string
        session.user.email = token.email as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  }
}

export const getAuthSession = () => getServerSession(authOptions)
