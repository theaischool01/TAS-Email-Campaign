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

    // Scope to ownerId only
    return { ownerId: session.user.id }
  }

  /**
   * Validates if user can access a contact list
   */
  static canAccessContactList(session: Session | null, contactListOwnerId: string) {
    if (!session?.user) {
      return false
    }

    return contactListOwnerId === session.user.id
  }

  /**
   * Creates filter for contact list members
   */
  static getContactListMemberFilter(session: Session | null) {
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
   * Creates filter for individual contacts based on user role
   */
  static getContactVisibilityFilter(session: Session | null) {
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

  /**
   * Validates if user can access contact list members
   */
  static canAccessContactListMembers(session: Session | null, contactListOwnerId: string) {
    return this.canAccessContactList(session, contactListOwnerId)
  }
}
