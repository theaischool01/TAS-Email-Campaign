"use client"

import { useEffect } from "react"
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
import type { WizardStep } from "@/components/campaigns/wizard/CampaignWizard"

export default function NewCampaignPage() {
  const { data: session } = useSession()
  const router = useRouter()

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

  const handleFinish = () => {
    // This would handle campaign launch
    toast.success("Campaign ready for launch!")
    router.push(`/campaigns/${wizard.state.campaignId}`)
  }

  const renderStepContent = () => {
    switch (wizard.state.currentStep) {
      case 1:
        return (
          <Step1Details
            data={wizard.state.campaignDetails}
            onChange={wizard.updateCampaignDetails}
            validationErrors={wizard.state.validationErrors}
            onValidationChange={(isValid, errors) => {
              // Validation is handled in the wizard hook
            }}
          />
        )
      case 2:
        return (
          <Step2Recipients
            contactLists={wizard.contactLists}
            selectedRecipients={wizard.state.selectedRecipients}
            excludedRecipients={wizard.state.excludedRecipients}
            onChange={wizard.updateRecipients}
            validationErrors={wizard.state.validationErrors}
            onValidationChange={(isValid, errors) => {
              // Validation is handled in the wizard hook
            }}
          />
        )
      case 3:
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Template Selection</h3>
            <p className="text-gray-600">Template selection coming soon...</p>
          </div>
        )
      case 4:
        return (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Review & Launch</h3>
            <p className="text-gray-600">Review step coming soon...</p>
          </div>
        )
      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
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

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <WizardHeader
          title={wizard.state.mode === 'edit' ? 'Edit Campaign' : 'Create New Campaign'}
          subtitle={wizard.state.campaignDetails.name || 'Untitled Campaign'}
          autosaveStatus={wizard.state.autosaveStatus}
          isDirty={wizard.state.isDirty}
          mode={wizard.state.mode}
          campaignId={wizard.state.campaignId}
        />

        {/* Step Content */}
        <div className="flex-1 overflow-auto">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <StepNavigation
          currentStep={wizard.state.currentStep}
          onPrevious={handlePrevious}
          onNext={handleNext}
          onFinish={handleFinish}
          canGoPrevious={wizard.state.currentStep > 1}
          canGoNext={wizard.validateCurrentStep()}
          showFinish={wizard.state.currentStep === 4}
          validationErrors={wizard.state.validationErrors}
          hasInteracted={wizard.hasInteracted}
          submitAttempted={wizard.submitAttempted}
        />
      </div>
    </div>
  )
}
