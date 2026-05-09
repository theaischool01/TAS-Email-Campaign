/**
 * API Type Definitions
 * Centralized types for API request/response handling
 */

import { CampaignStatus } from './campaign'

// Base API response types
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success?: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Campaign API types
export interface CampaignListRequest {
  page?: number
  limit?: number
  search?: string
  status?: CampaignStatus
  createdBy?: string
  tags?: string[]
}

export interface CampaignCreateRequest {
  name: string
  subject: string
  previewText?: string
  senderName?: string
  senderEmail?: string
  replyToEmail?: string
  tags?: string[]
  templateId?: string
}

export interface CampaignUpdateRequest extends Partial<CampaignCreateRequest> {
  status?: CampaignStatus
  scheduledAt?: string
  timezone?: string
}

// Template API types
export interface TemplateListRequest {
  page?: number
  limit?: number
  search?: string
  category?: string
  isPublic?: boolean
}

export interface TemplateCreateRequest {
  name: string
  description?: string
  category?: string
  subject?: string
  previewText?: string
  htmlContent?: string
  cssContent?: string
  jsonContent?: string
  isPublic?: boolean
}

// Contact API types
export interface ContactListRequest {
  page?: number
  limit?: number
  search?: string
  status?: string
  source?: string
}

export interface ContactCreateRequest {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  company?: string
  city?: string
  tags?: string
  status?: string
  source?: string
}

// Error response types
export interface ApiError {
  error: string
  details?: string
  code?: string
  timestamp?: string
}

// Success response types
export interface SuccessResponse<T = any> {
  success: true
  data: T
  message?: string
}

// Validation error types
export interface ValidationError {
  field: string
  message: string
  code?: string
}

export interface ValidationErrorResponse extends ApiResponse {
  errors: ValidationError[]
}
