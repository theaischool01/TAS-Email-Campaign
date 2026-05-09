"use client"

import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { WizardStep } from "./CampaignWizard"

interface StepNavigationProps {
  currentStep: WizardStep
  onPrevious?: () => void
  onNext?: () => void
  onFinish?: () => void
  canGoNext?: boolean
  canGoPrevious?: boolean
  isNextLoading?: boolean
  isFinishLoading?: boolean
  nextLabel?: string
  finishLabel?: string
  showFinish?: boolean
  validationErrors?: Record<string, string>
  hasInteracted?: boolean
  submitAttempted?: boolean
}

export function StepNavigation({
  currentStep,
  onPrevious,
  onNext,
  onFinish,
  canGoNext = true,
  canGoPrevious = true,
  isNextLoading = false,
  isFinishLoading = false,
  nextLabel,
  finishLabel = "Launch Campaign",
  showFinish = false,
  validationErrors = {},
  hasInteracted = false,
  submitAttempted = false
}: StepNavigationProps) {
  const hasErrors = Object.keys(validationErrors).length > 0
  const shouldShowError = hasErrors && (submitAttempted || hasInteracted)

  const getStepTitle = (step: WizardStep) => {
    switch (step) {
      case 1: return "Campaign Details"
      case 2: return "Recipients"
      case 3: return "Template Design"
      case 4: return "Review & Launch"
      default: return ""
    }
  }

  const getNextLabel = () => {
    if (nextLabel) return nextLabel
    
    switch (currentStep) {
      case 1: return "Continue to Recipients"
      case 2: return "Continue to Design"
      case 3: return "Continue to Review"
      default: return "Next"
    }
  }

  return (
    <div className="border-t border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section - Step Info */}
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-900">
              Step {currentStep} of 4: {getStepTitle(currentStep)}
            </h3>
            {shouldShowError && (
              <p className="text-sm text-red-600 mt-1">
                Please fix the errors above before continuing
              </p>
            )}
          </div>
        </div>

        {/* Right Section - Navigation Buttons */}
        <div className="flex items-center gap-3">
          {/* Previous Button */}
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={!canGoPrevious || isNextLoading || isFinishLoading}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {/* Next/Finish Button */}
          {showFinish ? (
            <Button
              onClick={onFinish}
              disabled={!canGoNext || hasErrors || isFinishLoading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              {isFinishLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </>
              ) : (
                <>
                  {finishLabel}
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={!canGoNext || hasErrors || isNextLoading}
              className="flex items-center gap-2"
            >
              {isNextLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </>
              ) : (
                <>
                  {getNextLabel()}
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mt-4 flex items-center justify-center gap-2">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={cn(
              "flex items-center",
              step < currentStep && "text-green-600",
              step === currentStep && "text-blue-600",
              step > currentStep && "text-gray-400"
            )}
          >
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2",
                step < currentStep && "bg-green-100 border-green-600 text-green-600",
                step === currentStep && "bg-blue-100 border-blue-600 text-blue-600",
                step > currentStep && "bg-white border-gray-300 text-gray-400"
              )}
            >
              {step < currentStep ? "✓" : step}
            </div>
            
            {step < 4 && (
              <div
                className={cn(
                  "w-8 h-0.5 mx-1",
                  step < currentStep && "bg-green-600",
                  step >= currentStep && "bg-gray-300"
                )}
              ></div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
