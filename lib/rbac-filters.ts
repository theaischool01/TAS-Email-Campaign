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

  const isSuperAdmin = session.user.role === "SUPER_ADMIN"
  
  // SUPER_ADMIN can see all data, others only their own
  return isSuperAdmin ? {} : { ownerId: session.user.id }
}

/**
 * Validates if user can access a resource
 */
export function canAccessResource(session: Session | null, resourceOwnerId: string) {
  if (!session?.user) {
    return false
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN"
  const isOwner = resourceOwnerId === session.user.id
  
  return isSuperAdmin || isOwner
}

/**
 * Creates contact list member filter for role-based access
 */
export function createContactListMemberFilter(session: Session | null) {
  if (!session?.user) {
    throw new Error("No session found")
  }

  const isSuperAdmin = session.user.role === "SUPER_ADMIN"
  
  if (isSuperAdmin) {
    // SUPER_ADMIN can see all contact list members
    return {}
  } else {
    // Others can only see members of their own contact lists
    return {
      contactList: {
        ownerId: session.user.id
      }
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

  const isSuperAdmin = session.user.role === "SUPER_ADMIN"
  
  if (isSuperAdmin) {
    // SUPER_ADMIN can see all contacts
    return {}
  } else {
    // Others can only see contacts in their own contact lists
    return {
      contactLists: {
        some: {
          ownerId: session.user.id
        }
      }
    }
  }
}
