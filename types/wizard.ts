/**
 * Campaign Wizard Type Definitions
 * Centralized types for the campaign creation/editing wizard
 */

import { Campaign, CampaignStatus } from './campaign'
import { ContactList } from './contact'

// Wizard step types
export type WizardStep = 1 | 2 | 3 | 4
export type WizardMode = 'create' | 'edit'

// Campaign details form types
export interface CampaignFormData {
  name: string
  subject: string
  previewText?: string
  senderName?: string
  senderEmail?: string
  replyToEmail?: string
  tags: string[]
}

// Wizard state interface
export interface CampaignWizardState {
  // Basic state
  campaignId?: string
  mode: WizardMode
  currentStep: WizardStep
  isDirty: boolean
  lastSavedAt?: Date
  
  // Form data
  campaignDetails: CampaignFormData
  
  // Recipients
  selectedRecipients: string[]
  excludedRecipients: string[]
  
  // Design
  selectedTemplate?: string
  editorState?: any
  
  // Review
  reviewState: {
    scheduleData?: {
      scheduledAt?: string
      timezone?: string
    }
    testData?: {
      recipients: string[]
      subject: string
    }
  }
  
  // Validation
  validationErrors: Record<string, string>
  
  // Loading states
  isLoading: boolean
  isSaving: boolean
  isPublishing: boolean
}

// Wizard actions
export interface WizardActions {
  // Navigation
  goToStep: (step: WizardStep) => void
  nextStep: () => void
  previousStep: () => void
  
  // Form data
  updateCampaignDetails: (details: Partial<CampaignFormData>) => void
  updateRecipients: (selected: string[], excluded: string[]) => void
  updateTemplate: (templateId: string) => void
  updateEditorState: (state: any) => void
  updateReviewState: (state: any) => void
  
  // Validation
  validateCurrentStep: () => boolean
  setValidationErrors: (errors: Record<string, string>) => void
  
  // Persistence
  saveDraft: () => Promise<void>
  publishCampaign: () => Promise<void>
  testSend: () => Promise<void>
  
  // Loading states
  setLoading: (loading: boolean) => void
  setSaving: (saving: boolean) => void
  setPublishing: (publishing: boolean) => void
}

// Recipient statistics
export interface RecipientStats {
  totalSelected: number
  duplicatesRemoved: number
  unsubscribedRemoved: number
  finalCount: number
}

// Wizard validation rules
export interface WizardValidationRule {
  field: keyof CampaignFormData | 'recipients' | 'template'
  required: boolean
  validator?: (value: any) => string | null
}

// Wizard step configuration
export interface WizardStepConfig {
  step: WizardStep
  title: string
  description: string
  validationRules: WizardValidationRule[]
  isComplete: (state: CampaignWizardState) => boolean
}

// Autosave configuration
export interface AutosaveConfig {
  enabled: boolean
  debounceMs: number
  onSave?: (state: CampaignWizardState) => void
  onError?: (error: Error) => void
}

// Wizard context props
export interface CampaignWizardContextValue {
  state: CampaignWizardState
  actions: WizardActions
  contactLists: ContactList[]
  templates: any[]
}

// Wizard component props
export interface CampaignWizardProps {
  campaignId?: string
  mode?: WizardMode
  initialData?: Partial<CampaignFormData>
  onComplete?: (campaignId: string) => void
  onCancel?: () => void
}

// Step component props
export interface WizardStepProps {
  state: CampaignWizardState
  actions: WizardActions
  contactLists: ContactList[]
  templates: any[]
  onValidationChange: (isValid: boolean, errors: Record<string, string>) => void
}
