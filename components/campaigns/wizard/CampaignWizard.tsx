"use client"
// FORCE DEPLOY: 2026-05-11 15:15 - FINAL CLEAN REWRITE

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
  selectedSegments: string[]
  excludedRecipients: string[]
  includedTags?: string
  excludedTags?: string
  audienceFilters?: any
  selectedTemplate?: string
  editorState?: any
  reviewState: any
  validationErrors: Record<string, string>
  autosaveStatus: 'idle' | 'saving' | 'saved' | 'error'
  lastSavedAt?: Date
  isDirty: boolean
  hasInteracted: boolean
  submitAttempted: boolean
  status: CampaignStatus
  excludedContacts: Record<string, string[]>
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
    selectedSegments: [],
    excludedRecipients: [],
    includedTags: '',
    excludedTags: '',
    audienceFilters: undefined,
    reviewState: {},
    validationErrors: {},
    autosaveStatus: 'idle',
    isDirty: false,
    hasInteracted: false,
    submitAttempted: false,
    status: CampaignStatus.DRAFT,
    excludedContacts: {}
  })

  const [loading, setLoading] = useState(true)
  const [contactLists, setContactLists] = useState<any[]>([])
  const [segments, setSegments] = useState<any[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [launching, setLaunching] = useState(false)

  // Create stable autosave payload - only includes data that needs to be saved
  const autosavePayload = useMemo(() => ({
    currentStep: state.currentStep,
    campaignDetails: state.campaignDetails,
    selectedRecipients: state.selectedRecipients,
    selectedSegments: state.selectedSegments,
    excludedRecipients: state.excludedRecipients,
    includedTags: state.includedTags,
    excludedTags: state.excludedTags,
    // Null-serialize empty audienceFilters before reaching the API boundary.
    // SegmentCriteriaSchema requires rules.length >= 1, so empty rule groups
    // must be represented as null, not { conjunction, rules: [] }.
    audienceFilters: (
      state.audienceFilters &&
      Array.isArray(state.audienceFilters.rules) &&
      state.audienceFilters.rules.length > 0
    ) ? state.audienceFilters : null,
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
    JSON.stringify(state.selectedSegments),
    JSON.stringify(state.excludedRecipients),
    state.includedTags,
    state.excludedTags,
    JSON.stringify(state.audienceFilters),
    state.selectedTemplate,
    state.mode,
    state.campaignId,
    state.status
  ])

  // Create stable dirty state trigger
  const autosaveTrigger = useMemo(() => ({
    isDirty: state.isDirty,
    autosaveStatus: state.autosaveStatus,
    status: state.status
  }), [state.isDirty, state.autosaveStatus, state.status])

  // Determine mode from URL
  useEffect(() => {
    const isEdit = params.id && params.id !== 'new'
    if (isEdit) {
      setState(prev => ({
        ...prev,
        mode: 'edit',
        campaignId: params.id as string
      }))
    } else {
      setState(prev => {
        // GUARD: Don't reset if campaignId was already set by 409 recovery
        if (prev.campaignId) return prev
        return {
          ...prev,
          mode: 'create',
          campaignId: undefined
        }
      })
    }
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
      const excludedRecipients = campaign.excludedLists?.map((el: any) => el.contactList.id) || []

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

      // Smart fallback for older campaigns where currentStep wasn't saved properly
      let calculatedStep = (campaign as any).currentStep || 1
      if (calculatedStep === 1) {
        if (campaign.templateId) {
          calculatedStep = 3
        } else if (selectedRecipients.length > 0 || excludedRecipients.length > 0) {
          calculatedStep = 2
        }
      }

      // Restore complete wizard state
      setState(prev => ({
        ...prev,
        campaignId: campaign.id, // CRITICAL: Set campaignId during hydration
        mode: 'edit', // CRITICAL: Set mode to edit
        currentStep: calculatedStep,
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
        excludedRecipients,
        includedTags: campaign.includedTags || '',
        excludedTags: campaign.excludedTags || '',
        // Hydrate audienceFilters from DB — null means no filters configured
        audienceFilters: (campaign as any).audienceFilters || undefined,
        selectedTemplate: campaign.templateId || undefined,
        isDirty: false,
        validationErrors: {},
        autosaveStatus: 'saved'
      }))

      console.log("📥 HYDRATION COMPLETE:", {
        campaignId: campaign.id,
        mode: 'edit',
        currentStep: calculatedStep,
        selectedRecipients: selectedRecipients.length,
        excludedRecipients: excludedRecipients.length,
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
        const segmentsUrl = '/api/segments'
        const templatesUrl = '/api/templates'
        console.log("🌐 FETCHING CONTACT LISTS:", listsUrl)
        console.log("🌐 FETCHING SEGMENTS:", segmentsUrl)
        console.log("🌐 FETCHING TEMPLATES:", templatesUrl)

        const [listsRes, segmentsRes, templatesRes] = await Promise.all([
          fetch(listsUrl),
          fetch(segmentsUrl),
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

        if (segmentsRes.ok) {
          const segmentsData = await segmentsRes.json()
          setSegments(segmentsData.data || [])
        } else {
          console.error("❌ WIZARD INIT: Failed to load segments")
          setSegments([])
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
    if (!session || !autosavePayload || state.autosaveStatus === 'saving' || state.status !== 'DRAFT') return

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

    const isCreatingDraft = !autosavePayload.campaignId

    if (!hasMinimumData) {
      console.log("🚫 AUTOSAVE DEBUG: Skipped - name and subject required", {
        hasName: !!autosavePayload.campaignDetails.name?.trim(),
        hasSubject: !!autosavePayload.campaignDetails.subject?.trim()
      })
      return
    }

    try {
      console.log(" AUTOSAVE DEBUG: Starting autosave", {
        mode: isCreatingDraft ? 'CREATE' : 'UPDATE',
        hasMinimumData,
        campaignId: autosavePayload.campaignId,
        currentMode: autosavePayload.mode,
        hasCampaignId: !!autosavePayload.campaignId
      })

      // Set lock and status
      autosaveInFlightRef.current = true
      setState(prev => ({ ...prev, autosaveStatus: 'saving' }))

      // Use stable payload for save data
      // Only include email fields when they have real values to avoid overwriting stored data
      const campaignData: Record<string, any> = {
        name: autosavePayload.campaignDetails.name || '',
        subject: autosavePayload.campaignDetails.subject || '',
        currentStep: autosavePayload.currentStep,
        tags: autosavePayload.campaignDetails.tags || [],
        // Always include audienceFilters: null clears existing filters,
        // a valid object sets them. autosavePayload already null-serialized
        // empty rule groups so SegmentCriteriaSchema is always satisfied.
        audienceFilters: autosavePayload.audienceFilters ?? null
      }

      if (autosavePayload.campaignDetails.previewText)
        campaignData.previewText = autosavePayload.campaignDetails.previewText
      if (autosavePayload.campaignDetails.senderName)
        campaignData.senderName = autosavePayload.campaignDetails.senderName
      if (autosavePayload.campaignDetails.senderEmail && autosavePayload.campaignDetails.senderEmail.trim())
        campaignData.senderEmail = autosavePayload.campaignDetails.senderEmail
      if (autosavePayload.campaignDetails.replyToEmail && autosavePayload.campaignDetails.replyToEmail.trim())
        campaignData.replyToEmail = autosavePayload.campaignDetails.replyToEmail
      if (autosavePayload.selectedTemplate)
        campaignData.templateId = autosavePayload.selectedTemplate

      console.log(" AUTOSAVE DEBUG: Campaign data to save:", campaignData)

      let response
      const autosaveUrl = isCreatingDraft
        ? '/api/campaigns'
        : `/api/campaigns/${autosavePayload.campaignId}`

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
        if (response.status === 409) {
          // Campaign name already exists — fetch its ID 
          // and recover by switching to edit mode
          const existingRes = await fetch(
            `/api/campaigns?name=${encodeURIComponent(
              autosavePayload.campaignDetails.name
            )}`
          )
          if (existingRes.ok) {
            const existingData = await existingRes.json()
            const campaignsList = existingData?.data?.campaigns || existingData?.campaigns || []
            const existingId = campaignsList?.[0]?.id
            if (existingId) {
              setState(prev => ({
                ...prev,
                campaignId: existingId,
                mode: 'edit',
                autosaveStatus: 'saved',
                lastSavedAt: new Date(),
                isDirty: false
              }))
              window.history.replaceState(
                null,
                '',
                `/campaigns/${existingId}/edit`
              )
              return
            }
          }
          // If recovery fails, show name conflict message
          setState(prev => ({ ...prev, autosaveStatus: 'error' }))
          toast.error('A campaign with this name already exists. Please use a different name.')
          return
        }

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

      // Additionally save recipients if we are on Step 2 or if we have recipients
      if (autosavePayload.selectedRecipients.length > 0 || autosavePayload.excludedRecipients.length > 0 || autosavePayload.includedTags || autosavePayload.excludedTags) {
        try {
          const recipResponse = await fetch(`/api/campaigns/${savedCampaign.id}/recipients`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientListIds: autosavePayload.selectedRecipients,
              recipientSegmentIds: autosavePayload.selectedSegments || [],
              excludedListIds: autosavePayload.excludedRecipients || [],
              includedTags: autosavePayload.includedTags || undefined,
              excludedTags: autosavePayload.excludedTags || undefined
            })
          })
          if (!recipResponse.ok) {
            console.error("❌ AUTOSAVE: Failed to save recipients:", recipResponse.status)
          }
        } catch (error) {
          console.error("❌ AUTOSAVE: Error saving recipients:", error)
        }
      }

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
          status: savedCampaign.status,
          isDirty: false
        }
      })

      // Update URL if this was a create operation
      if (isCreatingDraft) {
        console.log(" AUTOSAVE DEBUG: Updating URL to edit mode")
        window.history.replaceState(
          null,
          '',
          `/campaigns/${savedCampaign.id}/edit`
        )
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
  }, [session, autosavePayload])

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
  const updateRecipients = useCallback((selected: string[], excluded: string[], selectedSegments: string[], includedTags?: string, excludedTags?: string, audienceFilters?: any) => {
    setState(prev => ({
      ...prev,
      selectedRecipients: selected,
      excludedRecipients: excluded,
      selectedSegments: selectedSegments,
      includedTags: includedTags !== undefined ? includedTags : prev.includedTags,
      excludedTags: excludedTags !== undefined ? excludedTags : prev.excludedTags,
      // Store raw audienceFilters in state; null-serialization happens at payload build time
      audienceFilters: audienceFilters !== undefined ? audienceFilters : prev.audienceFilters,
      isDirty: true,
      hasInteracted: true // Mark as interacted
    }))
  }, [])

  // Update excluded contacts
  const updateExcludedContacts = useCallback((excluded: Record<string, string[]>) => {
    setState(prev => ({
      ...prev,
      excludedContacts: excluded,
      isDirty: true,
      hasInteracted: true
    }))
  }, [])

  // Refetch templates
  const refreshTemplates = useCallback(async () => {
    try {
      const templatesRes = await fetch('/api/templates')
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json()
        const templates = templatesData.templates || templatesData.data || []
        setTemplates(Array.isArray(templates) ? templates : [])
      }
    } catch (error) {
      console.error("Failed to refresh templates", error)
    }
  }, [])

  // Update template
  const updateTemplate = useCallback(async (templateId: string) => {
    // Update local state for immediate feedback
    setState(prev => ({
      ...prev,
      selectedTemplate: templateId,
      isDirty: true,
      hasInteracted: true
    }))

    // FORCE SAVE to database immediately to prevent race conditions
    if (state.campaignId && session) {
      try {
        console.log("🎯 FORCE SAVING TEMPLATE SELECTION:", templateId)
        const response = await fetch(`/api/campaigns/${state.campaignId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            templateId,
            currentStep: state.currentStep
          })
        })

        if (!response.ok) throw new Error("Failed to persist template selection")
        console.log("✅ Template selection saved successfully")
      } catch (error) {
        console.error("❌ Error force-saving template:", error)
        toast.error("Failed to save template selection. Please try selecting it again.")
      }
    }
  }, [state.campaignId, state.currentStep, session])

  // Update status
  const updateStatus = useCallback((status: CampaignStatus) => {
    setState(prev => ({ ...prev, status, isDirty: false }))
  }, [])

  // Navigate to step
  const goToStep = useCallback(async (step: WizardStep) => {
    // Validate current step before moving (this will show all validation errors)
    const errors = validateCurrentStepErrors()
    if (Object.keys(errors).length > 0) {
      setState(prev => ({
        ...prev,
        validationErrors: errors,
        submitAttempted: true
      }))
      return
    }

    // Update local state first for immediate UI response
    setState(prev => ({ ...prev, currentStep: step }))

    if (state.campaignId && session) {
      // When leaving Step 2 — persist recipient list associations to the DB.
      // The autosave only updates Campaign fields; it does NOT write to the
      // CampaignRecipientList junction table. We must do that explicitly here.
      if (state.currentStep === 2) {
        try {
          console.log("💾 SAVING RECIPIENTS TO DATABASE:", {
            campaignId: state.campaignId,
            selectedRecipients: state.selectedRecipients,
            excludedRecipients: state.excludedRecipients,
            includedTags: state.includedTags,
            excludedTags: state.excludedTags
          })

          const recipResponse = await fetch(`/api/campaigns/${state.campaignId}/recipients`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recipientListIds: state.selectedRecipients,
              recipientSegmentIds: state.selectedSegments || [],
              excludedListIds: state.excludedRecipients || [],
              includedTags: state.includedTags || undefined,
              excludedTags: state.excludedTags || undefined
            })
          })

          if (!recipResponse.ok) {
            const errData = await recipResponse.json().catch(() => ({}))
            console.error("❌ Failed to save recipients:", recipResponse.status, errData)
          } else {
            console.log("✅ Recipients saved to database successfully")
          }
        } catch (error) {
          console.error("❌ Error saving recipients to database:", error)
          // Don't block navigation if recipient save fails
        }
      }

      // Persist current step to database
      try {
        console.log("💾 SAVING PROGRESS TO DATABASE:", { step, campaignId: state.campaignId, templateId: state.selectedTemplate })

        // CRITICAL: Only send what's necessary for step navigation.
        // Spreading ...state.campaignDetails can cause race conditions with autosave.
        const saveBody: any = {
          currentStep: step,
          status: state.status
        }

        // Only include templateId if it's set in state to avoid overwriting with null
        if (state.selectedTemplate) {
          saveBody.templateId = state.selectedTemplate
        }

        const response = await fetch(`/api/campaigns/${state.campaignId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saveBody)
        })

        if (!response.ok) {
          console.error("❌ Failed to save campaign data to database:", response.status)
        } else {
          console.log("✅ Campaign data saved to database successfully:", step)
          setState(prev => ({ ...prev, isDirty: false, autosaveStatus: 'saved' }))
        }
      } catch (error) {
        console.error("❌ Error saving step to database:", error)
        // Don't fail the navigation if database save fails
      }
    }
  }, [validateCurrentStepErrors, state.campaignId, state.currentStep, state.selectedRecipients, state.excludedRecipients, state.includedTags, state.excludedTags, state.selectedTemplate, state.campaignDetails, state.status, session])

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
          excludedListIds: state.excludedRecipients,
          includedTags: state.includedTags || null,
          excludedTags: state.excludedTags || null
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
  }, [state.campaignId, state.selectedRecipients, state.excludedRecipients, state.includedTags, state.excludedTags, session])

  const handleFinish = async () => {
    try {
      setLaunching(true)

      // FORCE-SYNC: Save current state one last time before launching to ensure DB is up to date
      console.log("💾 LAUNCH: Performing pre-launch force-sync...")
      const syncResponse = await fetch(`/api/campaigns/${state.campaignId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: state.selectedTemplate,
          currentStep: state.currentStep,
          status: 'DRAFT' // Ensure it stays in draft for the launch API
        })
      })

      if (!syncResponse.ok) {
        console.warn("⚠️ LAUNCH: Pre-launch sync warning (non-fatal):", await syncResponse.text())
      } else {
        console.log("✅ LAUNCH: Pre-launch force-sync successful")
      }

      console.log("🚀 LAUNCH: Sending launch request for campaign:", state.campaignId)
      const response = await fetch(`/api/campaigns/${state.campaignId}/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          excludedContactIds: Object.values(state.excludedContacts).flat()
        })
      })

      const payload = await response.json()
      console.log("📡 LAUNCH: Response status:", response.status)
      console.log("📡 LAUNCH: Response payload:", payload)

      if (response.ok) {
        toast.success('Campaign launched successfully!')
        router.push(`/campaigns/${state.campaignId}/report`)
      } else {
        console.error("❌ LAUNCH: Failed:", payload)
        toast.error(payload.error || 'Failed to launch campaign')
      }
    } catch (error) {
      console.error("❌ LAUNCH: Critical error:", error)
      toast.error('An unexpected error occurred while launching')
    } finally {
      setLaunching(false)
    }
  }

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
    segments,
    templates,
    recipientStats,
    canCreate,
    launching,
    setLaunching,

    // Actions
    updateCampaignDetails,
    updateRecipients,
    updateExcludedContacts,
    updateTemplate,
    goToStep,
    saveRecipients,
    updateStatus,
    handleFinish,
    refreshTemplates,

    // Computed
    validateCurrentStepErrors,
    validateCurrentStep,

    // Autosave functionality
    autosave,
    autosaveStatus: state.autosaveStatus,
    lastSavedAt: state.lastSavedAt,

    // Interaction state
    hasInteracted: state.hasInteracted,
    submitAttempted: state.submitAttempted
  }
}
