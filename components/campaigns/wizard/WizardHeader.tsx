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
    <div className="border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </Button>
          
          <div className="border-l border-gray-300 h-6"></div>
          
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-600 mt-1">{subtitle}</p>
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
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSaveAndClose}
                  disabled={autosaveStatus === 'saving'}
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
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          <span>Editing draft campaign</span>
        </div>
      )}
    </div>
  )
}
