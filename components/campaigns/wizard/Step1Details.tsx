"use client"

import { useState, useEffect, useCallback } from "react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CampaignFormData } from "@/types/campaign"

// Validation schema
const campaignDetailsSchema = z.object({
  name: z.string().min(3, "Campaign name must be at least 3 characters").max(100, "Campaign name too long"),
  subject: z.string().min(1, "Subject is required").max(200, "Subject too long"),
  previewText: z.string().max(500, "Preview text too long").optional(),
  senderName: z.string().max(100, "Sender name too long").optional(),
  senderEmail: z.string().email("Invalid sender email").optional().or(z.literal("")),
  replyToEmail: z.string().email("Invalid reply-to email").optional().or(z.literal(""))
})

interface Step1DetailsProps {
  data: CampaignFormData
  onChange: (data: Partial<CampaignFormData>) => void
  validationErrors: Record<string, string>
  onValidationChange: (isValid: boolean, errors: Record<string, string>) => void
}

export function Step1Details({ 
  data, 
  onChange, 
  validationErrors,
  onValidationChange 
}: Step1DetailsProps) {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set())
  const [defaults, setDefaults] = useState<{ defaultFromName: string; defaultFromEmail: string } | null>(null)

  useEffect(() => {
    fetch('/api/settings/defaults')
      .then(res => res.json())
      .then(data => setDefaults(data))
      .catch(err => console.error("Failed to load default settings:", err))
  }, [])

  // Validate form data
  const validateForm = useCallback((formData: CampaignFormData, onlyTouched = false) => {
    const result = campaignDetailsSchema.safeParse(formData)
    const errors: Record<string, string> = {}
    
    if (!result.success) {
      result.error.issues.forEach(issue => {
        if (issue.path[0]) {
          const fieldName = issue.path[0] as string
          // Only show error if field was touched or if we're validating all fields
          if (!onlyTouched || touchedFields.has(fieldName)) {
            errors[fieldName] = issue.message
          }
        }
      })
    }

    // Add any external validation errors (only for touched fields)
    Object.keys(validationErrors).forEach(key => {
      if (!errors[key] && touchedFields.has(key)) {
        errors[key] = validationErrors[key]
      }
    })

    setFieldErrors(errors)
    onValidationChange(result.success, errors)
    return result.success
  }, [validationErrors, onValidationChange, touchedFields])

  // Validate only when external errors change or touched fields change
  useEffect(() => {
    validateForm(data, true)
  }, [validationErrors, touchedFields, validateForm])

  // Handle field change
  const handleFieldChange = (field: keyof CampaignFormData, value: string) => {
    const newData = { ...data, [field]: value }
    onChange(newData)
  }

  // Handle field blur with validation
  const handleFieldBlur = (field: keyof CampaignFormData) => {
    setTouchedFields(prev => new Set(prev).add(field))
    validateForm(data)
  }

  // Validate all fields (for continue button)
  const validateAllFields = useCallback(() => {
    // Mark all fields as touched
    const allFields = ['name', 'subject', 'previewText', 'senderName', 'senderEmail', 'replyToEmail']
    setTouchedFields(new Set(allFields))
    return validateForm(data, false) // Validate all fields regardless of touched state
  }, [data, validateForm])

  // Expose validation function for parent component
  useEffect(() => {
    // Pass validation function to parent
    if (onValidationChange) {
      onValidationChange(Object.keys(fieldErrors).length === 0, fieldErrors)
    }
  }, [fieldErrors, onValidationChange])

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">
          Campaign Details
        </h2>
        <p className="text-slate-500 text-sm mt-1 mb-8">
          Set up the basic information for your email campaign
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Campaign Name */}
        <Card className="border border-slate-200 rounded-2xl shadow-none mb-5">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Campaign Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-sm font-medium text-slate-700 mb-1.5">
                Campaign Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="name"
                value={data.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                onBlur={() => handleFieldBlur('name')}
                placeholder="e.g., Summer Sale 2024"
                className={`rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mt-1 ${fieldErrors.name ? 'border-red-500' : ''}`}
              />
              {fieldErrors.name && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.name}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1.5">
                Internal name to help you identify this campaign
              </p>
            </div>

            <div>
              <Label htmlFor="subject" className="text-sm font-medium text-slate-700 mb-1.5">
                Subject Line <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                value={data.subject || ''}
                onChange={(e) => handleFieldChange('subject', e.target.value)}
                onBlur={() => handleFieldBlur('subject')}
                placeholder="e.g., Don't miss our summer sale!"
                className={`rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mt-1 ${fieldErrors.subject ? 'border-red-500' : ''}`}
              />
              {fieldErrors.subject && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.subject}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1.5">
                This is what recipients will see in their inbox
              </p>
            </div>

            <div>
              <Label htmlFor="previewText" className="text-sm font-medium text-slate-700 mb-1.5">
                Preview Text
              </Label>
              <Input
                id="previewText"
                value={data.previewText || ''}
                onChange={(e) => handleFieldChange('previewText', e.target.value)}
                onBlur={() => handleFieldBlur('previewText')}
                placeholder="e.g., See our latest deals and save big..."
                className={`rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mt-1 ${fieldErrors.previewText ? 'border-red-500' : ''}`}
              />
              {fieldErrors.previewText && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.previewText}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1.5">
                Optional text that appears after the subject in most email clients
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Sender Information */}
        <Card className="border border-slate-200 rounded-2xl shadow-none mb-5">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Sender Information</CardTitle>
            <p className="text-sm text-gray-600">
              Configure who this email will appear to be from
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="senderName" className="text-sm font-medium text-slate-700 mb-1.5">
                Sender Name <span className="text-xs text-slate-400 font-normal">(Optional)</span>
              </Label>
              <Input
                id="senderName"
                value={data.senderName || ''}
                onChange={(e) => handleFieldChange('senderName', e.target.value)}
                onBlur={() => handleFieldBlur('senderName')}
                placeholder="e.g., Your Company Name"
                className={`rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mt-1 ${fieldErrors.senderName ? 'border-red-500' : ''}`}
              />
              {fieldErrors.senderName && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.senderName}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1.5">
                Leave blank to use default: <strong>{defaults?.defaultFromName || "THE AI SCHOOL"}</strong>
              </p>
            </div>

            <div>
              <Label htmlFor="senderEmail" className="text-sm font-medium text-slate-700 mb-1.5">
                Sender Email <span className="text-xs text-slate-400 font-normal">(Optional)</span>
              </Label>
              <Input
                id="senderEmail"
                type="email"
                value={data.senderEmail || ''}
                onChange={(e) => handleFieldChange('senderEmail', e.target.value)}
                onBlur={() => handleFieldBlur('senderEmail')}
                placeholder="e.g., campaigns@yourcompany.com"
                className={`rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mt-1 ${fieldErrors.senderEmail ? 'border-red-500' : ''}`}
              />
              {fieldErrors.senderEmail && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.senderEmail}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1.5">
                Leave blank to use default: <strong>{defaults?.defaultFromEmail || "official@campaign.theaischool.co"}</strong>
              </p>
            </div>

            <div>
              <Label htmlFor="replyToEmail" className="text-sm font-medium text-slate-700 mb-1.5">
                Reply-To Email
              </Label>
              <Input
                id="replyToEmail"
                type="email"
                value={data.replyToEmail || ''}
                onChange={(e) => handleFieldChange('replyToEmail', e.target.value)}
                onBlur={() => handleFieldBlur('replyToEmail')}
                placeholder="e.g., support@yourcompany.com"
                className={`rounded-xl border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mt-1 ${fieldErrors.replyToEmail ? 'border-red-500' : ''}`}
              />
              {fieldErrors.replyToEmail && (
                <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {fieldErrors.replyToEmail}
                </p>
              )}
              <p className="text-xs text-slate-400 mt-1.5">
                Optional: Where replies to this campaign will be sent
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Pro tip:</strong> Keep your subject line under 50 characters for best display on mobile devices. 
            Use preview text to provide additional context that doesn't fit in the subject.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
