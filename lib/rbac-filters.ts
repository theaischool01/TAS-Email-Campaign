import { Session } from "next-auth"

export interface UserSession {
  id: string
  email: string
  name: string
  role: string
}

/**
 * Creates role-based where clauses for Prisma queries
 */
export function createOwnerFilter(session: Session | null) {
  if (!session?.user) {
    throw new Error("No session found")
  }

  return { createdBy: session.user.id }
}

/**
 * Validates if user can access a resource
 */
export function canAccessResource(session: Session | null, resourceOwnerId: string) {
  if (!session?.user) {
    return false
  }

  return resourceOwnerId === session.user.id
}

/**
 * Creates contact list member filter for role-based access
 */
export function createContactListMemberFilter(session: Session | null) {
  if (!session?.user) {
    throw new Error("No session found")
  }

  return {
    contactList: {
      ownerId: session.user.id
    }
  }
}

/**
 * Creates contact filter for role-based access
 */
export function createContactFilter(session: Session | null) {
  if (!session?.user) {
    throw new Error("No session found")
  }

  return {
    lists: {
      some: {
        contactList: {
          ownerId: session.user.id
        }
      }
    }
  }
}
