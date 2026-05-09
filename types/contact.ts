/**
 * Contact Type Definitions
 * Centralized types for contact and contact list management
 */

// Contact status enum
export enum ContactStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
  BOUNCED = 'BOUNCED'
}

// Contact source enum
export enum ContactSource {
  MANUAL = 'MANUAL',
  IMPORT = 'IMPORT',
  FORM = 'FORM',
  API = 'API'
}

// Base contact interface
export interface Contact {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
  city?: string
  tags?: string
  status: ContactStatus
  source: ContactSource
  createdAt: Date
  updatedAt: Date
}

// Contact list interface
export interface ContactList {
  id: string
  name: string
  description?: string
  ownerId: string
  memberCount?: number
  createdAt: Date
  updatedAt: Date
  members?: ContactListMember[]
}

// Contact list member interface
export interface ContactListMember {
  id: string
  contactListId: string
  contactId: string
  contact?: Contact
  createdAt: Date
}

// Contact creation data
export interface ContactCreateData {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
  city?: string
  tags?: string
  status?: ContactStatus
  source?: ContactSource
}

// Contact list creation data
export interface ContactListCreateData {
  name: string
  description?: string
}

// Contact import data
export interface ContactImportData {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
  city?: string
  tags?: string
}

// Contact statistics
export interface ContactStats {
  totalContacts: number
  activeContacts: number
  unsubscribedContacts: number
  bouncedContacts: number
  totalLists: number
}

// Contact list statistics
export interface ContactListStats {
  totalMembers: number
  activeMembers: number
  unsubscribedMembers: number
  bouncedMembers: number
}
