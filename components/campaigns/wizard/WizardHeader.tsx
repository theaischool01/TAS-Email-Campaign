"use client"

import { ArrowLeft, Save, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface WizardHeaderProps {
  title: string
  subtitle?: string
  showSave?: boolean
  onSave?: () => void
  onClose?: () => void
  autosaveStatus: 'idle' | 'saving' | 'saved' | 'error'
  isDirty: boolean
  mode: 'create' | 'edit'
  campaignId?: string
}

export function WizardHeader({
  title,
  subtitle,
  showSave = true,
  onSave,
  onClose,
  autosaveStatus,
  isDirty,
  mode,
  campaignId
}: WizardHeaderProps) {
  const router = useRouter()

  const handleClose = () => {
    if (isDirty) {
      if (!confirm('You have unsaved changes. Are you sure you want to leave?')) {
        return
      }
    }

    if (onClose) {
      onClose()
    } else {
      router.push('/campaigns')
    }
  }

  const handleSave = async () => {
    if (onSave) {
      await onSave()
    }
  }

  const handleSaveAndClose = async () => {
    await handleSave()
    router.push('/campaigns')
  }

  return (
    <div className="border-b border-slate-200 bg-white px-6 py-3.5 shrink-0">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-slate-500 hover:text-slate-800 flex items-center gap-1.5 text-sm font-medium hover:bg-slate-100 rounded-lg px-3 py-1.5 transition-all"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
          
          <div className="border-l border-slate-200 h-5"></div>
          
          <div>
            <h1 className="text-base font-bold text-slate-900">{title}</h1>
            {subtitle && (
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-3">
          {/* Autosave Status */}
          <div className="flex items-center gap-2 text-sm">
            {autosaveStatus === 'saving' && (
              <>
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span className="text-yellow-600">Saving...</span>
              </>
            )}
            {autosaveStatus === 'saved' && campaignId && (
              <>
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600">Saved</span>
              </>
            )}
            {autosaveStatus === 'error' && (
              <>
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                <span className="text-red-600">Save failed</span>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {showSave && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSave}
                  disabled={autosaveStatus === 'saving' || !isDirty}
                  className="text-slate-600 border-slate-200 hover:border-slate-300 text-sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveAndClose}
                  disabled={autosaveStatus === 'saving'}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold"
                >
                  Save & Close
                </Button>
              </>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-gray-600 hover:text-gray-900"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Draft Indicator */}
      {mode === 'edit' && campaignId && (
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full"></div>
          <span>Editing draft campaign</span>
        </div>
      )}
    </div>
  )
}
