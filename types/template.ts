export interface EmailTemplate {
  id: string
  name: string
  description?: string
  category?: string
  thumbnail?: string
  html: string
  json?: string
  createdBy: string | null
  isPublic: boolean
  createdAt: string
  updatedAt: string
  isSystem?: boolean
  systemTemplateId?: string | null
  user?: {
    id: string
    name: string
    email: string
    role: string
  }
}

export interface TemplateBlock {
  id: string
  type: string
  content: any
  attributes: any
}

export interface TemplateCategory {
  id: string
  name: string
  count: number
}

export interface MergeTag {
  tag: string
  label: string
  description: string
}
