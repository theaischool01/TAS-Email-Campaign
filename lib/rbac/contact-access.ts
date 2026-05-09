import { Session } from "next-auth"

/**
 * Centralized contact access control for consistent RBAC across the platform
 */
export class ContactAccessControl {
  /**
   * Creates filter for contact lists based on user role
   */
  static getContactListVisibilityFilter(session: Session | null) {
    if (!session?.user) {
      throw new Error("No session found")
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    
    // SUPER_ADMIN can see all contact lists, others only their own
    return isSuperAdmin ? {} : { ownerId: session.user.id }
  }

  /**
   * Validates if user can access a contact list
   */
  static canAccessContactList(session: Session | null, contactListOwnerId: string) {
    if (!session?.user) {
      return false
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    const isOwner = contactListOwnerId === session.user.id
    
    return isSuperAdmin || isOwner
  }

  /**
   * Creates filter for contact list members
   */
  static getContactListMemberFilter(session: Session | null) {
    if (!session?.user) {
      throw new Error("No session found")
    }

    const isSuperAdmin = session.user.role === "SUPER_ADMIN"
    
    // SUPER_ADMIN can see all contact list members, others only their own
    return isSuperAdmin ? {} : { 
      contactList: {
        ownerId: session.user.id
      }
    }
  }

  /**
   * Validates if user can access contact list members
   */
  static canAccessContactListMembers(session: Session | null, contactListOwnerId: string) {
    return this.canAccessContactList(session, contactListOwnerId)
  }
}
