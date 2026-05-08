import { DefaultSession } from "next-auth"
import { Role } from "@prisma/client"

declare module "next-auth" {
  interface User {
    role?: Role
  }

  interface Session extends DefaultSession {
    user: {
      id: string
      role: Role
    } & DefaultSession["user"]
  }
}
