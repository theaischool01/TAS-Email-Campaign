"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { useCampaignWizard } from "@/components/campaigns/wizard/CampaignWizard"
import { WizardSidebar } from "@/components/campaigns/wizard/WizardSidebar"
import { WizardHeader } from "@/components/campaigns/wizard/WizardHeader"
import { StepNavigation } from "@/components/campaigns/wizard/StepNavigation"
import { Step1Details } from "@/components/campaigns/wizard/Step1Details"
import { Step2Recipients } from "@/components/campaigns/wizard/Step2Recipients"
import { Step3Design } from "@/components/campaigns/wizard/Step3Design"
import { Step4Review } from "@/components/campaigns/wizard/Step4Review"
import { Loader2, ArrowLeft } from "lucide-react"
import { SendProgress } from "@/components/campaigns/wizard/SendProgress"
import type { WizardStep } from "@/components/campaigns/wizard/CampaignWizard"

export default function NewCampaignPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLaunching, setIsLaunching] = useState(false)
  const [showProgress, setShowProgress] = useState(false)
  const [campaignIdForProgress, setCampaignIdForProgress] = useState<string | null>(null)

  const wizard = useCampaignWizard()

  // Check permissions
  useEffect(() => {
    if (session && !wizard.canCreate) {
      toast.error("You don't have permission to create campaigns")
      router.push("/campaigns")
    }
  }, [session, wizard.canCreate, router])

  if (!session) {
    return null
  }

  const handleStepClick = (step: WizardStep) => {
    // Only allow going to previous steps or current step
    if (step <= wizard.state.currentStep) {
      wizard.goToStep(step)
    }
  }

  const handlePrevious = () => {
    if (wizard.state.currentStep > 1) {
      wizard.goToStep((wizard.state.currentStep - 1) as WizardStep)
    }
  }

  const handleNext = () => {
    if (wizard.state.currentStep < 4) {
      wizard.goToStep((wizard.state.currentStep + 1) as WizardStep)
    }
  }

  const handleFinish = async () => {
    if (!wizard.state.campaignId) {
      toast.error("Campaign must be saved before launching. Please wait for autosave.")
      return
    }

    setIsLaunching(true)
    try {
      console.log("🚀 LAUNCH: Sending launch request for campaign:", wizard.state.campaignId)

      const response = await fetch(`/api/campaigns/${wizard.state.campaignId}/launch`, {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      })

      console.log("📡 LAUNCH: Response status:", response.status, response.statusText)

      // Safely parse JSON — server might return HTML (e.g. 404 page) if route not found
      let payload: any = {}
      try {
        payload = await response.json()
      } catch (parseErr) {
        console.error("❌ LAUNCH: Response was not valid JSON. Route may not exist yet. Status:", response.status)
        toast.error(`Launch failed (${response.status}): Route not found. Ensure the dev server has restarted to pick up new routes.`)
        return
      }

      console.log("📡 LAUNCH: Response payload:", payload)

      if (!response.ok) {
        const errMsg = payload?.error || `Launch failed with status ${response.status}`
        console.error("❌ LAUNCH: Failed:", { status: response.status, payload })
        toast.error(errMsg)
        return
      }

      console.log("✅ LAUNCH: Campaign launched successfully:", payload)
      toast.success("Campaign launched successfully! 🎉")
      
      const newStatus = payload.data?.status || 'SENDING'
      wizard.updateStatus(newStatus)
      
      if (newStatus === 'SENDING') {
        setCampaignIdForProgress(wizard.state.campaignId)
        setShowProgress(true)
      } else if (newStatus === 'SCHEDULED') {
        router.push("/campaigns")
      } else {
        router.push("/campaigns")
      }
    } catch (error) {
      console.error("❌ LAUNCH: Unexpected error:", error)
      toast.error("An unexpected error occurred. Please try again.")
    } finally {
      setIsLaunching(false)
    }
  }

  const handleBack = () => {
    router.push("/campaigns")
  }

  if (wizard.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing campaign...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 border-r bg-card">
          <WizardSidebar
            currentStep={wizard.state.currentStep}
            onStepClick={handleStepClick}
            validationErrors={wizard.state.validationErrors}
            isDirty={wizard.state.isDirty}
            autosaveStatus={wizard.state.autosaveStatus}
            lastSavedAt={wizard.state.lastSavedAt}
            hasInteracted={wizard.hasInteracted}
            submitAttempted={wizard.submitAttempted}
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="border-b bg-card px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Campaigns
                </Button>
                <WizardHeader
                  title={wizard.state.campaignDetails.name || "New Campaign"}
                  subtitle={`Step ${wizard.state.currentStep} of 4`}
                  autosaveStatus={wizard.state.autosaveStatus}
                  isDirty={wizard.state.isDirty}
                  mode={wizard.state.mode}
                  campaignId={wizard.state.campaignId}
                  onSave={wizard.autosave}
                />
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-auto p-6">
            {showProgress && campaignIdForProgress ? (
              <div className="flex flex-col items-center justify-center min-h-[400px]">
                <SendProgress 
                  campaignId={campaignIdForProgress} 
                  onComplete={() => {
                    setTimeout(() => router.push("/campaigns"), 3000)
                  }}
                />
              </div>
            ) : (
              <>
                {wizard.state.currentStep === 1 && (
                  <Step1Details
                    data={wizard.state.campaignDetails}
                    onChange={wizard.updateCampaignDetails}
                    validationErrors={wizard.state.validationErrors}
                    onValidationChange={(isValid, errors) => {
                      // Validation is handled by the wizard hook
                    }}
                  />
                )}
                {wizard.state.currentStep === 2 && (
                  <Step2Recipients
                    contactLists={wizard.contactLists}
                    segments={wizard.segments}
                    selectedRecipients={wizard.state.selectedRecipients}
                    selectedSegments={wizard.state.selectedSegments}
                    excludedRecipients={wizard.state.excludedRecipients}
                    onChange={wizard.updateRecipients}
                    validationErrors={wizard.state.validationErrors}
                    onValidationChange={(isValid, errors) => {
                      // Validation is handled by the wizard hook
                    }}
                  />
                )}
                {wizard.state.currentStep === 3 && (
                  <Step3Design
                    selectedTemplate={wizard.state.selectedTemplate}
                    templates={wizard.templates}
                    onUpdate={wizard.updateTemplate}
                    validationErrors={wizard.state.validationErrors}
                  />
                )}
                {wizard.state.currentStep === 4 && (
                  <Step4Review
                    campaignDetails={wizard.state.campaignDetails}
                    selectedRecipients={wizard.state.selectedRecipients}
                    selectedTemplate={wizard.state.selectedTemplate}
                    contactLists={wizard.contactLists}
                    templates={wizard.templates}
                    campaignId={wizard.state.campaignId}
                    onFinish={handleFinish}
                    isLaunching={isLaunching}
                  />
                )}
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="border-t bg-card px-6 py-4">
            <StepNavigation
              currentStep={wizard.state.currentStep}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onFinish={handleFinish}
              canGoPrevious={wizard.state.currentStep > 1}
              canGoNext={wizard.validateCurrentStep()}
              showFinish={wizard.state.currentStep === 4}
              isFinishLoading={isLaunching}
              validationErrors={wizard.state.validationErrors}
              hasInteracted={wizard.hasInteracted}
              submitAttempted={wizard.submitAttempted}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
