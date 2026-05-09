// Campaign Status enum matching Prisma schema
export enum CampaignStatus {
  DRAFT = 'DRAFT',
  SCHEDULED = 'SCHEDULED',
  SENDING = 'SENDING',
  SENT = 'SENT',
  PAUSED = 'PAUSED',
  CANCELLED = 'CANCELLED'
}

// Contact Status enum matching Prisma schema
export enum ContactStatus {
  ACTIVE = 'ACTIVE',
  UNSUBSCRIBED = 'UNSUBSCRIBED',
  BOUNCED = 'BOUNCED',
  COMPLAINED = 'COMPLAINED'
}

export interface ContactListMember {
  id: string
  contactListId: string
  contactId: string
  createdAt: Date
}

export interface Contact {
  id: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
  city?: string
  tags?: string[]
  status: ContactStatus
}

export interface Campaign {
  id: string
  name: string
  subject: string
  previewText?: string
  senderName?: string
  senderEmail?: string
  replyToEmail?: string
  status: CampaignStatus
  scheduledAt?: Date
  sentAt?: Date
  timezone?: string
  recipientCount: number
  estimatedRecipients?: number
  openRate?: number
  clickRate?: number
  totalSent: number
  totalOpened: number
  totalClicked: number
  tags?: string[]
  templateId?: string
  createdBy: string
  createdAt: Date
  updatedAt: Date
  
  // Relations
  user?: {
    id: string
    name: string
    email: string
  }
  template?: {
    id: string
    name: string
    thumbnail?: string
  }
  recipientLists?: CampaignRecipientList[]
  excludedLists?: CampaignExcludedList[]
  testSends?: CampaignTestSend[]
  activityLogs?: CampaignActivityLog[]
}

export interface CampaignRecipientList {
  id: string
  campaignId: string
  contactListId: string
  createdAt: Date
  
  // Relations
  campaign?: Campaign
  contactList?: ContactList
}

export interface CampaignExcludedList {
  id: string
  campaignId: string
  contactListId: string
  createdAt: Date
  
  // Relations
  campaign?: Campaign
  contactList?: ContactList
}

export interface CampaignTestSend {
  id: string
  campaignId: string
  email: string
  sentBy: string
  sentAt: Date
  
  // Relations
  campaign?: Campaign
}

export interface CampaignActivityLog {
  id: string
  campaignId: string
  actorId: string
  action: string
  metadata?: any
  createdAt: Date
  
  // Relations
  campaign?: Campaign
}

export interface ContactList {
  id: string
  name: string
  description?: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
  
  // Relations
  owner?: {
    id: string
    name: string
    email: string
  }
  members?: ContactListMember[]
  contacts?: Contact[]
  recipientLists?: CampaignRecipientList[]
  excludedLists?: CampaignExcludedList[]
}

export interface CampaignFormData {
  name: string
  subject: string
  previewText?: string
  senderName?: string
  senderEmail?: string
  replyToEmail?: string
  templateId?: string
  tags?: string[]
}

export interface CampaignWizardData {
  step1: {
    name: string
    subject: string
    previewText?: string
    senderName?: string
    senderEmail?: string
    replyToEmail?: string
  }
  step2: {
    recipientListIds: string[]
    excludedListIds: string[]
  }
  step3: {
    templateId?: string
    templateHtml?: string
    templateJson?: string
  }
  step4: {
    // Review step - no data needed, just validation
  }
}

export interface CampaignFilters {
  search?: string
  status?: CampaignStatus
  dateRange?: {
    start: Date
    end: Date
  }
  tags?: string[]
  creator?: string
  page?: number
  limit?: number
}

export interface CampaignAnalytics {
  totalSent: number
  totalOpened: number
  totalClicked: number
  openRate: number
  clickRate: number
  bounceRate?: number
  unsubscribeRate?: number
  revenue?: number
}

export interface CampaignTestSendRequest {
  emails: string[]
  campaignId: string
}

export interface CampaignScheduleRequest {
  campaignId: string
  scheduledAt: Date
  timezone: string
}

export interface CampaignSendRequest {
  campaignId: string
}

export interface CampaignDuplicateRequest {
  campaignId: string
  newName?: string
}
