"use client"

import { Check, Circle, Edit, Users, Palette, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WizardStep } from "./CampaignWizard"

interface WizardSidebarProps {
  currentStep: WizardStep
  onStepClick?: (step: WizardStep) => void
  validationErrors: Record<string, string>
  isDirty: boolean
  autosaveStatus: 'idle' | 'saving' | 'saved' | 'error'
  lastSavedAt?: Date
  hasInteracted: boolean
  submitAttempted: boolean
}

const steps = [
  {
    id: 1 as WizardStep,
    title: "Details",
    description: "Campaign information",
    icon: Edit,
    validationKey: 'name' as keyof Record<string, string>
  },
  {
    id: 2 as WizardStep,
    title: "Recipients", 
    description: "Choose your audience",
    icon: Users,
    validationKey: 'recipients' as keyof Record<string, string>
  },
  {
    id: 3 as WizardStep,
    title: "Design",
    description: "Select template",
    icon: Palette,
    validationKey: 'template' as keyof Record<string, string>
  },
  {
    id: 4 as WizardStep,
    title: "Review",
    description: "Preview & send",
    icon: Eye,
    validationKey: '' as keyof Record<string, string>
  }
]

export function WizardSidebar({ 
  currentStep, 
  onStepClick, 
  validationErrors, 
  isDirty,
  autosaveStatus,
  lastSavedAt,
  hasInteracted,
  submitAttempted 
}: WizardSidebarProps) {
  const getStepStatus = (step: WizardStep) => {
    if (step < currentStep) return 'completed'
    if (step === currentStep) return 'active'
    return 'pending'
  }

  const hasStepError = (step: WizardStep) => {
    const stepConfig = steps.find(s => s.id === step)
    const hasError = stepConfig && stepConfig.validationKey && validationErrors[stepConfig.validationKey]
    
    // Only show error state if user has interacted or submit was attempted
    if (!hasError) return false
    return submitAttempted || hasInteracted
  }

  const formatLastSaved = (date?: Date) => {
    if (!date) return ''
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    
    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="w-80 bg-white border-r border-gray-200 p-6 flex flex-col h-full">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest px-4 pt-5 pb-3">
          Campaign Setup
        </h2>
        <div className="flex items-center gap-2 text-sm px-4">
          {autosaveStatus === 'saving' && (
            <>
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-yellow-600">Saving...</span>
            </>
          )}
          {autosaveStatus === 'saved' && lastSavedAt && (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-600">Saved {formatLastSaved(lastSavedAt)}</span>
            </>
          )}
          {autosaveStatus === 'error' && (
            <>
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-red-600">Save failed</span>
            </>
          )}
          {autosaveStatus === 'idle' && isDirty && (
            <>
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span className="text-orange-600">Unsaved changes</span>
            </>
          )}
        </div>
      </div>

      {/* Steps */}
      <nav className="space-y-1">
        {steps.map((step) => {
          const status = getStepStatus(step.id)
          const hasError = hasStepError(step.id)
          const Icon = step.icon
          
          return (
            <button
              key={step.id}
              onClick={() => onStepClick?.(step.id)}
              disabled={status === 'pending'}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                status === 'active' && "bg-blue-50 text-blue-700 border border-blue-100 rounded-xl mx-2",
                status === 'completed' && !hasError && "text-green-700 hover:bg-green-50",
                status === 'pending' && "text-gray-400 cursor-not-allowed",
                hasError && "text-red-600 bg-red-50 border border-red-100 rounded-xl mx-2"
              )}
            >
              {/* Step Icon */}
              <div className="relative">
                {status === 'completed' && !hasError ? (
                  <div className="w-8 h-8 rounded-lg bg-green-500 text-white flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4" />
                  </div>
                ) : status === 'active' ? (
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-400 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "font-medium text-sm",
                    status === 'active' && "text-sm font-semibold text-blue-700",
                    status === 'completed' && !hasError && "text-sm font-medium text-slate-600",
                    status === 'pending' && "text-sm font-medium text-slate-400",
                    hasError && "text-red-600"
                  )}>
                    {step.title}
                  </p>
                  {hasError && (
                    <div className="w-2 h-2 bg-red-500 rounded-full" title="Has errors"></div>
                  )}
                </div>
                <p className={cn(
                  "text-xs",
                  status === 'active' && "text-xs text-blue-500",
                  status === 'completed' && !hasError && "text-xs text-slate-400",
                  status === 'pending' && "text-xs text-slate-300",
                  hasError && "text-red-500"
                )}>
                  {step.description}
                </p>
              </div>

              {/* Error indicator */}
              {hasError && (
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </button>
          )
        })}
      </nav>

      {/* Progress Bar */}
      <div className="mt-8 pt-8 border-t border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">Progress</span>
          <span className="text-xs font-semibold text-blue-600">{Math.round((currentStep / 4) * 100)}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-slate-100">
          <div 
            className="h-1.5 bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / 4) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Tips */}
      <div className="px-4 pb-5 mt-auto">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2.5">Tips</p>
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
            <p className="text-xs text-slate-500">
              Your work is automatically saved
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
            <p className="text-xs text-slate-500">
              You can navigate between steps
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
            <p className="text-xs text-slate-500">
              Draft campaigns can be edited anytime
            </p>
          </div>
          <div className="flex items-start gap-2">
            <div className="w-1 h-1 rounded-full bg-blue-400 mt-1.5 shrink-0" />
            <p className="text-xs text-slate-500">
              Test your campaign before sending
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
