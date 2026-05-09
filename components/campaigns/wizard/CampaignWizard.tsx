"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { Campaign, CampaignStatus, CampaignFormData, CampaignWizardData } from "@/types/campaign"
import { CampaignAccessControl } from "@/lib/rbac/campaign-access"


// Wizard step types
export type WizardStep = 1 | 2 | 3 | 4
export type WizardMode = 'create' | 'edit'

// Wizard state interface
export interface WizardState {
  campaignId?: string
  currentStep: WizardStep
  mode: WizardMode
  campaignDetails: CampaignFormData
  selectedRecipients: string[]
  excludedRecipients: string[]
  selectedTemplate?: string
  editorState?: any
  reviewState: any
  validationErrors: Record<string, string>
  autosaveStatus: 'idle' | 'saving' | 'saved' | 'error'
  lastSavedAt?: Date
  isDirty: boolean
  hasInteracted: boolean
  submitAttempted: boolean
}

// Wizard context hook
export function useCampaignWizard() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  
  // Refs to track initialization and prevent race conditions
  const initializedRef = useRef(false)
  const loadingRef = useRef(false)
  const autosaveInFlightRef = useRef(false)
  const hydrationCompleteRef = useRef(false)
  
  const [state, setState] = useState<WizardState>({
    currentStep: 1,
    mode: 'create',
    campaignDetails: {
      name: '',
      subject: '',
      previewText: '',
      senderName: '',
      senderEmail: '',
      replyToEmail: '',
      tags: []
    },
    selectedRecipients: [],
    excludedRecipients: [],
    reviewState: {},
    validationErrors: {},
    autosaveStatus: 'idle',
    isDirty: false,
    hasInteracted: false,
    submitAttempted: false
  })

  const [loading, setLoading] = useState(true)
  const [contactLists, setContactLists] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])

  // Create stable autosave payload - only includes data that needs to be saved
  const autosavePayload = useMemo(() => ({
    currentStep: state.currentStep,
    campaignDetails: state.campaignDetails,
    selectedRecipients: state.selectedRecipients,
    excludedRecipients: state.excludedRecipients,
    selectedTemplate: state.selectedTemplate,
    mode: state.mode,
    campaignId: state.campaignId
  }), [
    state.currentStep,
    state.campaignDetails.name,
    state.campaignDetails.subject,
    state.campaignDetails.previewText,
    state.campaignDetails.senderName,
    state.campaignDetails.senderEmail,
    state.campaignDetails.replyToEmail,
    state.campaignDetails.tags,
    JSON.stringify(state.selectedRecipients),
    JSON.stringify(state.excludedRecipients),
    state.selectedTemplate,
    state.mode,
    state.campaignId
  ])

  // Create stable dirty state trigger
  const autosaveTrigger = useMemo(() => ({
    isDirty: state.isDirty,
    autosaveStatus: state.autosaveStatus
  }), [state.isDirty, state.autosaveStatus])

  // Determine mode from URL
  useEffect(() => {
    const isEdit = params.id && params.id !== 'new'
    setState(prev => ({
      ...prev,
      mode: isEdit ? 'edit' : 'create',
      campaignId: isEdit ? params.id as string : undefined
    }))
  }, [params])

  // Load campaign data for editing
  const loadCampaignData = useCallback(async (campaignId: string) => {
    // Prevent restore loops
    if (initializedRef.current) return
    
    let shouldRedirect = false
    let redirectPath = '/campaigns'
    let errorMessage = ''
    
    try {
      console.log("📥 CAMPAIGN LOAD: Starting load for", campaignId)
      
      const campaignUrl = `/api/campaigns/${campaignId}`
      console.log("🌐 FETCHING CAMPAIGN:", campaignUrl)
      
      const response = await fetch(campaignUrl)
      if (!response.ok) {
        if (response.status === 404) {
          errorMessage = 'Campaign not found'
          shouldRedirect = true
        } else if (response.status === 403) {
          errorMessage = 'You do not have permission to edit this campaign'
          shouldRedirect = true
        } else {
          throw new Error('Failed to load campaign')
        }
      }

      if (shouldRedirect) {
        toast.error(errorMessage)
        router.push(redirectPath)
        return
      }

      const payload = await response.json()
      console.log("📥 HYDRATION RESPONSE:", payload)
      const data = payload.data || payload
      const campaign: Campaign = data.campaign
      console.log("📥 SETTING STATE:", campaign)

      // Check if campaign can be edited
      if (!CampaignAccessControl.canAccessCampaign(session, campaign.createdBy)) {
        toast.error('This campaign cannot be edited')
        router.push('/campaigns')
        return
      }

      // Check campaign status
      if (campaign.status !== 'DRAFT') {
        toast.error('Only draft campaigns can be edited')
        router.push('/campaigns')
        return
      }

      // Extract recipient list IDs from relational data
      const selectedRecipients = campaign.recipientLists?.map((rl: any) => rl.contactList.id) || []
      
      // Parse tags from JSON string if needed
      let parsedTags: string[] = []
      if (campaign.tags) {
        try {
          const tagsString = String(campaign.tags)
          parsedTags = JSON.parse(tagsString)
          if (!Array.isArray(parsedTags)) {
            parsedTags = []
          }
        } catch (error) {
          console.warn("Failed to parse campaign tags:", error)
          parsedTags = []
        }
      }

      // Restore complete wizard state
      setState(prev => ({
        ...prev,
        campaignId: campaign.id, // CRITICAL: Set campaignId during hydration
        mode: 'edit', // CRITICAL: Set mode to edit
        currentStep: (campaign as any).currentStep || 1, // Will be added to schema
        campaignDetails: {
          name: campaign.name,
          subject: campaign.subject,
          previewText: campaign.previewText || '',
          senderName: campaign.senderName || '',
          senderEmail: campaign.senderEmail || '',
          replyToEmail: campaign.replyToEmail || '',
          tags: parsedTags
        },
        selectedRecipients,
        selectedTemplate: campaign.templateId || undefined,
        isDirty: false,
        validationErrors: {},
        autosaveStatus: 'saved'
      }))

      console.log("📥 HYDRATION COMPLETE:", {
        campaignId: campaign.id,
        mode: 'edit',
        currentStep: (campaign as any).currentStep || 1,
        selectedRecipients: selectedRecipients.length,
        selectedTemplate: campaign.templateId,
        campaignName: campaign.name
      })
      
      console.log("✅ CAMPAIGN LOAD: Successfully loaded campaign", campaign.id)
      
    } catch (error) {
      console.error('❌ CAMPAIGN LOAD: Error loading campaign data:', error)
      toast.error('Failed to load campaign data')
    }
  }, [session, router])

  // Load initial data - STRICT SINGLE INITIALIZATION
  useEffect(() => {
    // CRITICAL: Prevent multiple initializations
    if (initializedRef.current) return
    if (loadingRef.current) return
    if (!session) return

    loadingRef.current = true

    const initialize = async () => {
      try {
        console.log("🚀 WIZARD INIT: Starting initialization", {
          mode: state.mode,
          campaignId: state.campaignId
        })

        // Load campaign data if editing
        if (
          state.mode === "edit" &&
          state.campaignId
        ) {
          console.log("📥 WIZARD INIT: Loading campaign data")
          await loadCampaignData(state.campaignId)
        }

        // Load contact lists and templates in parallel
        console.log("📋 WIZARD INIT: Loading contact lists and templates")
        const listsUrl = '/api/contacts/lists'
        const templatesUrl = '/api/templates'
        console.log("🌐 FETCHING CONTACT LISTS:", listsUrl)
        console.log("🌐 FETCHING TEMPLATES:", templatesUrl)
        
        const [listsRes, templatesRes] = await Promise.all([
          fetch(listsUrl),
          fetch(templatesUrl)
        ])

        if (listsRes.ok) {
          const listsData = await listsRes.json()
          console.log("🔧 CONTACT LISTS DEBUG:", {
            count: Array.isArray(listsData.contactLists)
              ? listsData.contactLists.length
              : 0,
            rawData: listsData,
            hasContactLists: 'contactLists' in listsData
          })
          
          // MANDATORY SAFE PARSE
          const contactLists = 
            listsData.contactLists || 
            listsData.data || 
            []
          
          setContactLists(
            Array.isArray(contactLists)
              ? contactLists
              : []
          )
        } else {
          console.error("❌ WIZARD INIT: Failed to load contact lists", {
            status: listsRes.status,
            statusText: listsRes.statusText,
            url: listsUrl
          })
          setContactLists([])
        }

        if (templatesRes.ok) {
          const templatesData = await templatesRes.json()
          const templates = 
            templatesData.templates || 
            templatesData.data || 
            []
          
          setTemplates(
            Array.isArray(templates)
              ? templates
              : []
          )
        } else {
          console.error("❌ WIZARD INIT: Failed to load templates", {
            status: templatesRes.status,
            statusText: templatesRes.statusText,
            url: templatesUrl
          })
          setTemplates([])
        }

        // Mark initialization complete
        initializedRef.current = true
        hydrationCompleteRef.current = true
        console.log("✅ WIZARD INIT: Initialization complete")

      } catch (error) {
        console.error(
          "❌ WIZARD INIT: Initialization failed:",
          error
        )
        // Ensure empty state on error
        setContactLists([])
        setTemplates([])
      } finally {
        loadingRef.current = false
        setLoading(false)
      }
    }

    initialize()
  }, [session]) // ONLY depend on session - single initialization

  // Autosave functionality - with minimum threshold and race condition protection
  const autosave = useCallback(async () => {
    if (!session || !state.isDirty || state.autosaveStatus === 'saving') return

    // CRITICAL: Block autosave during hydration/initialization
    if (!hydrationCompleteRef.current) {
      console.log("🚫 AUTOSAVE DEBUG: Blocked - hydration not complete")
      return
    }

    // Prevent concurrent autosave requests
    if (autosaveInFlightRef.current) {
      console.log("🚫 AUTOSAVE DEBUG: Request skipped - autosave already in flight")
      return
    }

    // Check minimum threshold for draft creation
    const hasMinimumData = autosavePayload.campaignDetails.name?.trim() && 
                          autosavePayload.campaignDetails.subject?.trim()
    
    const isCreatingDraft = !state.campaignId
    const shouldSkipCreate = isCreatingDraft && !hasMinimumData

    if (shouldSkipCreate) {
      console.log(" AUTOSAVE DEBUG: Request skipped - minimum threshold not met", {
        hasName: !!autosavePayload.campaignDetails.name?.trim(),
        hasSubject: !!autosavePayload.campaignDetails.subject?.trim(),
        isCreatingDraft
      })
      return
    }

    try {
      console.log(" AUTOSAVE DEBUG: Starting autosave", {
        mode: isCreatingDraft ? 'CREATE' : 'UPDATE',
        hasMinimumData,
        campaignId: state.campaignId,
        currentMode: state.mode,
        hasCampaignId: !!state.campaignId
      })

      // Set lock and status
      autosaveInFlightRef.current = true
      setState(prev => ({ ...prev, autosaveStatus: 'saving' }))

      // Use stable payload for save data
      const campaignData = {
        name: autosavePayload.campaignDetails.name || '',
        subject: autosavePayload.campaignDetails.subject || '',
        previewText: autosavePayload.campaignDetails.previewText || undefined,
        senderName: autosavePayload.campaignDetails.senderName || undefined,
        senderEmail: autosavePayload.campaignDetails.senderEmail || undefined,
        replyToEmail: autosavePayload.campaignDetails.replyToEmail || undefined,
        templateId: autosavePayload.selectedTemplate || undefined,
        tags: autosavePayload.campaignDetails.tags || []
      }

      console.log(" AUTOSAVE DEBUG: Campaign data to save:", campaignData)

      let response
      const autosaveUrl = isCreatingDraft 
        ? '/api/campaigns' 
        : `/api/campaigns/${state.campaignId}`
      
      console.log("🌐 AUTOSAVE FETCH:", {
        url: autosaveUrl,
        method: isCreatingDraft ? 'POST' : 'PUT',
        isCreatingDraft
      })

      if (isCreatingDraft) {
        // Create new campaign
        response = await fetch(autosaveUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(campaignData)
        })
      } else {
        // Update existing campaign
        response = await fetch(autosaveUrl, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(campaignData)
        })
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error(" AUTOSAVE DEBUG: Save failed with status:", response.status)
        console.error(" AUTOSAVE DEBUG: Error response:", errorData)
        // Graceful error handling - don't throw during normal typing
        setState(prev => ({ ...prev, autosaveStatus: 'error' }))
        toast.error(`Failed to save campaign: ${response.status} ${errorData.error || 'Unknown error'}`)
        return
      }

      const payload = await response.json()
      const data = payload.data || payload
      // Handle both response formats: { campaign } and { data: { campaign } }
      const savedCampaign: Campaign = (data as any).campaign || (data as any)

      console.log(" AUTOSAVE DEBUG: Campaign saved successfully:", savedCampaign.id)

      // Lightweight state update - only update what's necessary
      setState(prev => {
        console.log("🔄 AUTOSAVE DEBUG: State updated", {
          oldCampaignId: prev.campaignId,
          newCampaignId: savedCampaign.id,
          oldMode: prev.mode,
          newMode: 'edit',
          timestamp: new Date().toISOString()
        })
        
        return {
          ...prev,
          campaignId: savedCampaign.id,
          mode: 'edit',
          autosaveStatus: 'saved',
          lastSavedAt: new Date(),
          isDirty: false
        }
      })

      // Update URL if this was a create operation
      if (isCreatingDraft) {
        console.log(" AUTOSAVE DEBUG: Updating URL to edit mode")
        router.replace(`/campaigns/${savedCampaign.id}/edit`)
        return // CRITICAL: Early return to prevent duplicate execution
      }

    } catch (error) {
      console.error(" AUTOSAVE DEBUG: Autosave failed:", error)
      setState(prev => ({ ...prev, autosaveStatus: 'error' }))
      toast.error('Failed to save campaign')
    } finally {
      // Always clear the autosave lock
      autosaveInFlightRef.current = false
    }
  }, [session, router, autosavePayload])

  // Debounced autosave - RE-ENABLED with stable dependencies
  useEffect(() => {
    if (!autosaveTrigger.isDirty) return

    const timer = setTimeout(() => {
      autosave()
    }, 2000) // 2 second debounce

    return () => clearTimeout(timer)
  }, [autosaveTrigger.isDirty, autosave])

  // Validate current step - returns errors without setting state (only for continue action)
  const validateCurrentStepErrors = useCallback((): Record<string, string> => {
    const errors: Record<string, string> = {}

    switch (state.currentStep) {
      case 1:
        // Only validate required fields for continue action
        if (!state.campaignDetails.name || state.campaignDetails.name.length < 3) {
          errors.name = 'Campaign name must be at least 3 characters'
        }
        if (!state.campaignDetails.subject) {
          errors.subject = 'Subject is required'
        }
        // Optional fields only validate if they have values
        if (state.campaignDetails.senderEmail && state.campaignDetails.senderEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.campaignDetails.senderEmail)) {
          errors.senderEmail = 'Invalid sender email'
        }
        if (state.campaignDetails.replyToEmail && state.campaignDetails.replyToEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.campaignDetails.replyToEmail)) {
          errors.replyToEmail = 'Invalid reply-to email'
        }
        break

      case 2:
        // Validate recipients
        if (state.selectedRecipients.length === 0) {
          errors.recipients = 'Please select at least one contact list'
        }
        break

      case 3:
        // Validate template
        if (!state.selectedTemplate) {
          errors.template = 'Please select a template'
        }
        break

      case 4:
        // Review step - no validation needed
        break
    }

    return errors
  }, [state.currentStep, state.campaignDetails.name, state.campaignDetails.subject, state.campaignDetails.senderEmail, state.campaignDetails.replyToEmail, state.selectedRecipients, state.selectedTemplate])

  // Boolean validation function for external use
  const validateCurrentStep = useCallback((): boolean => {
    const errors = validateCurrentStepErrors()
    return Object.keys(errors).length === 0
  }, [validateCurrentStepErrors])

  // Update validation errors when they change (but not on initial load)
  useEffect(() => {
    // Don't validate on initial load to prevent premature errors
    if (state.isDirty) {
      const errors = validateCurrentStepErrors()
      setState(prev => ({ ...prev, validationErrors: errors }))
    }
  }, [validateCurrentStepErrors, state.isDirty])

  // Update campaign details
  const updateCampaignDetails = useCallback((updates: Partial<CampaignFormData>) => {
    setState(prev => ({
      ...prev,
      campaignDetails: { ...prev.campaignDetails, ...updates },
      isDirty: true,
      hasInteracted: true, // Mark as interacted
      validationErrors: {} // Clear errors on update
    }))
  }, [])

  // Update recipients
  const updateRecipients = useCallback((selected: string[], excluded: string[]) => {
    setState(prev => ({
      ...prev,
      selectedRecipients: selected,
      excludedRecipients: excluded,
      isDirty: true,
      hasInteracted: true // Mark as interacted
    }))
  }, [])

  // Update template
  const updateTemplate = useCallback((templateId: string) => {
    setState(prev => ({
      ...prev,
      selectedTemplate: templateId,
      isDirty: true,
      hasInteracted: true // Mark as interacted
    }))
  }, [])

  // Navigate to step
  const goToStep = useCallback(async (step: WizardStep) => {
    // Validate current step before moving (this will show all validation errors)
    const errors = validateCurrentStepErrors()
    if (Object.keys(errors).length > 0) {
      // Set validation errors to show them to user and mark submit attempted
      setState(prev => ({ 
        ...prev, 
        validationErrors: errors,
        submitAttempted: true 
      }))
      return
    }

    // Update local state first for immediate UI response
    setState(prev => ({ ...prev, currentStep: step }))

    // Persist step to database if campaign exists
    if (state.campaignId && session) {
      try {
        console.log("💾 SAVING STEP TO DATABASE:", { step, campaignId: state.campaignId })
        
        const response = await fetch(`/api/campaigns/${state.campaignId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            currentStep: step
          })
        })

        if (!response.ok) {
          console.error("❌ Failed to save step to database:", response.status)
        } else {
          console.log("✅ Step saved to database successfully:", step)
        }
      } catch (error) {
        console.error("❌ Error saving step to database:", error)
        // Don't fail the navigation if database save fails
      }
    }
  }, [validateCurrentStepErrors, state.campaignId, session])

  // Save recipients to campaign
  const saveRecipients = useCallback(async () => {
    if (!state.campaignId || !session) return

    try {
      setState(prev => ({ ...prev, autosaveStatus: 'saving' }))

      const response = await fetch(`/api/campaigns/${state.campaignId}/recipients`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientListIds: state.selectedRecipients,
          excludedListIds: state.excludedRecipients
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save recipients')
      }

      toast.success('Recipients saved')
    } catch (error) {
      console.error('Error saving recipients:', error)
      toast.error('Failed to save recipients')
    }
  }, [state.campaignId, state.selectedRecipients, state.excludedRecipients, session])

  // Calculate recipient statistics
  const recipientStats = useMemo(() => {
    if (state.selectedRecipients.length === 0) {
      return {
        totalSelected: 0,
        duplicatesRemoved: 0,
        unsubscribedRemoved: 0,
        finalCount: 0
      }
    }

    // Calculate actual recipient count
    let totalContacts = 0
    const seenEmails = new Set<string>()
    let duplicatesRemoved = 0
    let unsubscribedRemoved = 0

    for (const listId of state.selectedRecipients) {
      const list = contactLists.find(l => l.id === listId)
      if (list) {
        // In a real implementation, this would query the database
        // For now, we'll estimate based on list member count
        const memberCount = list.memberCount || 0
        totalContacts += memberCount
      }
    }

    return {
      totalSelected: state.selectedRecipients.length,
      duplicatesRemoved,
      unsubscribedRemoved,
      finalCount: totalContacts
    }
  }, [state.selectedRecipients, state.excludedRecipients, contactLists])

  // Check if user can create campaigns
  const canCreate = useMemo(() => {
    return session ? CampaignAccessControl.canCreateCampaign(session) : false
  }, [session])

  return {
    // State
    state,
    loading,
    contactLists,
    templates,
    recipientStats,
    canCreate,
    
    // Actions
    updateCampaignDetails,
    updateRecipients,
    updateTemplate,
    goToStep,
    saveRecipients,
    
    // Computed
    validateCurrentStepErrors,
    validateCurrentStep,
    
    // Autosave status (expose status but not the function itself)
    autosaveStatus: state.autosaveStatus,
    lastSavedAt: state.lastSavedAt,
    
    // Interaction state
    hasInteracted: state.hasInteracted,
    submitAttempted: state.submitAttempted
  }
}
