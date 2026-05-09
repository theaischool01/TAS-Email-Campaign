/**
 * RBAC Filter Types
 * Centralized type definitions for role-based access control filters
 */

// Base filter interface for impossible filters
export interface ImpossibleFilter {
  id: '__no_access_impossible__'
}

// Campaign visibility filter types
export type CampaignVisibilityFilter = 
  | {} // Super admin can see all campaigns
  | { OR: Array<{ createdBy: string; isPublic?: undefined }> }
  | { isPublic: boolean }
  | { id: string }
  | { createdBy: string }
  | ImpossibleFilter

// Template visibility filter types  
export type TemplateVisibilityFilter = 
  | { OR: Array<{ createdBy: string; isPublic?: undefined } | { isPublic: boolean; createdBy?: undefined }> }
  | { isPublic: boolean }
  | { id: string }
  | { id: string } // For admin access
  | ImpossibleFilter

// Helper function to check if filter is impossible
export function isImpossibleFilter(filter: CampaignVisibilityFilter | TemplateVisibilityFilter): filter is ImpossibleFilter {
  return 'id' in filter && filter.id === '__no_access_impossible__'
}

// Campaign status types for RBAC
export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'PAUSED' | 'CANCELLED'

// Campaign status filter types
export type CampaignStatusFilter = 
  | { status: CampaignStatus }
  | { status: { not: CampaignStatus } }
  | { status: CampaignStatus[] }

// Combined filter types for complex queries
export type CampaignDashboardFilter = CampaignVisibilityFilter & {
  status?: { not: CampaignStatus }
}
