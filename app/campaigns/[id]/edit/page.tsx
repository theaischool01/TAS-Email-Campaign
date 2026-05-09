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
import { Step3Design } from "@/components/campaigns/wizard/Step3Design"
import { Step4Review } from "@/components/campaigns/wizard/Step4Review"
import { Loader2, ArrowLeft } from "lucide-react"

export default function EditCampaignPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const wizard = useCampaignWizard()

  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }

    // Check if user can create campaigns
    if (!wizard.canCreate) {
      toast.error("You don't have permission to create campaigns")
      router.push('/campaigns')
      return
    }
  }, [session, wizard.canCreate, router])

  const handleFinish = async () => {
    // TODO: Implement campaign launch logic
    toast.success("Campaign launched successfully!")
    router.push('/campaigns')
  }

  const handleBack = () => {
    router.push('/campaigns')
  }

  if (wizard.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading campaign...</p>
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
            onStepClick={wizard.goToStep}
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
                  title={wizard.state.campaignDetails.name || "Edit Campaign"}
                  subtitle={`Step ${wizard.state.currentStep} of 4`}
                  autosaveStatus={wizard.state.autosaveStatus}
                  isDirty={wizard.state.isDirty}
                  mode={wizard.state.mode}
                  campaignId={wizard.state.campaignId}
                />
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="flex-1 overflow-auto p-6">
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
                selectedRecipients={wizard.state.selectedRecipients}
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
              />
            )}
          </div>

          {/* Navigation */}
          <div className="border-t bg-card px-6 py-4">
            <StepNavigation
              currentStep={wizard.state.currentStep}
              onPrevious={() => wizard.goToStep((wizard.state.currentStep - 1) as any)}
              onNext={() => wizard.goToStep((wizard.state.currentStep + 1) as any)}
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
      </div>
    </div>
  )
}
