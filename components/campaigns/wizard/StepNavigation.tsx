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
    <div className="border-t border-slate-200 bg-white px-8 py-3.5 shrink-0">
      <div className="flex items-center justify-between">
        {/* Left Section - Step Info */}
        <div className="flex items-center gap-4">
          <div>
            <h3 className="text-sm font-medium text-slate-600">
              Step {currentStep} of 4: {getStepTitle(currentStep)}
            </h3>
            {shouldShowError && (
              <p className="text-xs text-red-500 mt-0.5 flex items-center gap-1">
                Please fix the errors above before continuing
              </p>
            )}
          </div>
        </div>

        {/* Right Section - Navigation Buttons */}
        <div className="flex items-center gap-3">
          {/* Previous Button */}
          <Button
            onClick={onPrevious}
            disabled={!canGoPrevious || isNextLoading || isFinishLoading}
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 rounded-xl transition-all disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>

          {/* Next/Finish Button */}
          {showFinish ? (
            <Button
              onClick={onFinish}
              disabled={!canGoNext || hasErrors || isFinishLoading}
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-green-600 hover:bg-green-700 rounded-xl transition-all disabled:opacity-40"
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
              className="flex items-center gap-1.5 px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
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

    </div>
  )
}
