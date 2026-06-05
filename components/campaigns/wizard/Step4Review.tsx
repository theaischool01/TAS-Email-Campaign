"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Mail, Users, Palette, Send, CheckCircle, AlertCircle, CalendarClock, Pause, XCircle, Loader2, Pencil, Layout, Eye, Search, Filter } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState, useMemo, useEffect } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import dynamic from "next/dynamic"

const TemplateBuilder = dynamic(
  () => import("@/components/templates/TemplateBuilder"),
  { 
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center p-20">Loading editor...</div>
  }
)

interface Step4ReviewProps {
  campaignDetails: {
    name: string
    subject: string
    previewText?: string
    senderName?: string
    senderEmail?: string
    replyToEmail?: string
  }
  selectedRecipients: string[]
  excludedRecipients?: string[]
  selectedTemplate?: string
  contactLists: any[]
  templates: any[]
  campaignId?: string
  status?: string
  onFinish: () => void
  isLaunching?: boolean
  excludedContacts: Record<string, string[]>
  allContactLists: any[]
  onUpdateDetails: (details: Partial<any>) => void
  onUpdateRecipients: (selected: string[], excluded: string[], selectedSegments: string[]) => void
  onUpdateExcluded: (excluded: Record<string, string[]>) => void
  onUpdateTemplate: (templateId: string) => void
}

export function Step4Review({
  campaignDetails,
  selectedRecipients,
  excludedRecipients = [],
  selectedTemplate,
  contactLists,
  templates,
  campaignId,
  status = 'DRAFT',
  onFinish,
  isLaunching = false,
  excludedContacts,
  allContactLists,
  onUpdateDetails,
  onUpdateRecipients,
  onUpdateExcluded,
  onUpdateTemplate
}: Step4ReviewProps) {
  const router = useRouter()
  const selectedTemplateData = templates.find(t => t.id === selectedTemplate)
  const selectedContactLists = contactLists.filter(list => 
    selectedRecipients.includes(list.id)
  )

  const totalRecipients = selectedContactLists.reduce((sum, list) => 
    sum + (list.activeCount || 0), 0
  )

  const totalMembers = selectedContactLists.reduce((sum, list) => 
    sum + (list.memberCount || 0), 0
  )

  const [testEmails, setTestEmails] = useState("")
  const [isSendingTest, setIsSendingTest] = useState(false)
  const [testDialogOpen, setTestDialogOpen] = useState(false)

  const [scheduleDate, setScheduleDate] = useState<Date>()
  const [scheduleTime, setScheduleTime] = useState("12:00")
  const [isScheduling, setIsScheduling] = useState(false)
  const [schedulePopoverOpen, setSchedulePopoverOpen] = useState(false)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceInterval, setRecurrenceInterval] = useState("DAILY")

  // Inline editing states
  const [activeEditSection, setActiveEditSection] = useState<'details' | 'recipients' | 'template' | null>(null)

  // Details editing states
  const [editDetails, setEditDetails] = useState({
    name: campaignDetails.name,
    subject: campaignDetails.subject,
    previewText: campaignDetails.previewText || "",
    senderName: campaignDetails.senderName || "",
    senderEmail: campaignDetails.senderEmail || "",
    replyToEmail: campaignDetails.replyToEmail || ""
  })

  // Sync details when prop updates
  useEffect(() => {
    setEditDetails({
      name: campaignDetails.name,
      subject: campaignDetails.subject,
      previewText: campaignDetails.previewText || "",
      senderName: campaignDetails.senderName || "",
      senderEmail: campaignDetails.senderEmail || "",
      replyToEmail: campaignDetails.replyToEmail || ""
    })
  }, [campaignDetails])

  const handleEditDetailsClick = () => {
    setEditDetails({
      name: campaignDetails.name,
      subject: campaignDetails.subject,
      previewText: campaignDetails.previewText || "",
      senderName: campaignDetails.senderName || "",
      senderEmail: campaignDetails.senderEmail || "",
      replyToEmail: campaignDetails.replyToEmail || ""
    })
    setActiveEditSection('details')
  }

  const handleSaveDetails = () => {
    onUpdateDetails(editDetails)
    setActiveEditSection(null)
    toast.success("Campaign details updated successfully!")
  }

  const handleCancelDetails = () => {
    setActiveEditSection(null)
  }

  // Recipients editing states
  const [recipientsSearchTerm, setRecipientsSearchTerm] = useState("")
  const [tempSelectedRecipients, setTempSelectedRecipients] = useState<string[]>(selectedRecipients)
  const [tempExcludedRecipients, setTempExcludedRecipients] = useState<string[]>(excludedRecipients || [])
  const [tempExcludedContacts, setTempExcludedContacts] = useState<Record<string, string[]>>(excludedContacts || {})
  const [expandedLists, setExpandedLists] = useState<Record<string, boolean>>({})
  const [listContacts, setListContacts] = useState<Record<string, any[]>>({})
  const [loadingLists, setLoadingLists] = useState<Record<string, boolean>>({})

  // Sync recipients when props update
  useEffect(() => {
    setTempSelectedRecipients(selectedRecipients)
    setTempExcludedRecipients(excludedRecipients || [])
    setTempExcludedContacts(excludedContacts || {})
  }, [selectedRecipients, excludedRecipients, excludedContacts])

  const handleEditRecipientsClick = () => {
    setTempSelectedRecipients(selectedRecipients)
    setTempExcludedRecipients(excludedRecipients || [])
    setTempExcludedContacts(excludedContacts || {})
    setActiveEditSection('recipients')
  }

  const handleListToggle = (listId: string, checked: boolean) => {
    let newSelected = [...tempSelectedRecipients]
    if (checked) {
      newSelected.push(listId)
    } else {
      newSelected = newSelected.filter(id => id !== listId)
    }
    setTempSelectedRecipients(newSelected)
  }

  const handleExclusionToggle = (listId: string, checked: boolean) => {
    let newExcluded = [...tempExcludedRecipients]
    if (checked) {
      newExcluded.push(listId)
      const newSelected = tempSelectedRecipients.filter(id => id !== listId)
      setTempSelectedRecipients(newSelected)
    } else {
      newExcluded = newExcluded.filter(id => id !== listId)
    }
    setTempExcludedRecipients(newExcluded)
  }

  const handleContactExcludeToggle = (listId: string, contactId: string, checked: boolean) => {
    setTempExcludedContacts(prev => {
      const currentExcluded = prev[listId] || []
      let newExcluded: string[]
      if (!checked) {
        if (!currentExcluded.includes(contactId)) {
          newExcluded = [...currentExcluded, contactId]
        } else {
          newExcluded = currentExcluded
        }
      } else {
        newExcluded = currentExcluded.filter(id => id !== contactId)
      }
      return {
        ...prev,
        [listId]: newExcluded
      }
    })
  }

  const toggleExpandList = async (listId: string) => {
    const isCurrentlyExpanded = !!expandedLists[listId]
    setExpandedLists(prev => ({
      ...prev,
      [listId]: !isCurrentlyExpanded
    }))

    if (!isCurrentlyExpanded && !listContacts[listId] && !loadingLists[listId]) {
      setLoadingLists(prev => ({ ...prev, [listId]: true }))
      try {
        const response = await fetch(`/api/contacts/lists/${listId}/contacts`)
        if (response.ok) {
          const data = await response.json()
          setListContacts(prev => ({
            ...prev,
            [listId]: data
          }))
        }
      } catch (error) {
        console.error("Failed to fetch contacts for list", listId, error)
      } finally {
        setLoadingLists(prev => ({ ...prev, [listId]: false }))
      }
    }
  }

  const handleSaveRecipients = () => {
    onUpdateRecipients(tempSelectedRecipients, tempExcludedRecipients, [])
    onUpdateExcluded(tempExcludedContacts)
    setActiveEditSection(null)
    toast.success("Recipients updated successfully!")
  }

  const handleCancelRecipients = () => {
    setActiveEditSection(null)
  }

  const filteredLists = useMemo(() => {
    if (!allContactLists || !Array.isArray(allContactLists)) return []
    return allContactLists.filter(list => 
      list.name.toLowerCase().includes(recipientsSearchTerm.toLowerCase()) ||
      list.description?.toLowerCase().includes(recipientsSearchTerm.toLowerCase())
    )
  }, [allContactLists, recipientsSearchTerm])

  // Template editing states
  const [tempSelectedTemplate, setTempSelectedTemplate] = useState<string | undefined>(selectedTemplate)
  const [templateCategory, setTemplateCategory] = useState("all")
  const [isEditorOpen, setIsEditorOpen] = useState(false)

  // Sync template when prop updates
  useEffect(() => {
    setTempSelectedTemplate(selectedTemplate)
  }, [selectedTemplate])

  const handleEditTemplateClick = () => {
    setTempSelectedTemplate(selectedTemplate)
    setActiveEditSection('template')
  }

  const handleSaveTemplate = () => {
    if (tempSelectedTemplate) {
      onUpdateTemplate(tempSelectedTemplate)
      setActiveEditSection(null)
      toast.success("Template updated successfully!")
    } else {
      toast.error("Please select a template first")
    }
  }

  const handleCancelTemplate = () => {
    setActiveEditSection(null)
  }

  const categories = [
    { id: "all", name: "All Templates", icon: Layout },
    { id: "newsletter", name: "Newsletter", icon: Palette },
    { id: "marketing", name: "Marketing", icon: Eye },
    { id: "transactional", name: "Transactional", icon: Layout }
  ]

  const filteredTemplates = useMemo(() => {
    return templates.filter(template => 
      templateCategory === "all" || template.category === templateCategory
    )
  }, [templates, templateCategory])

  const handleTestSend = async () => {
    if (!campaignId) return
    const emails = testEmails.split(",").map(e => e.trim()).filter(e => e)
    if (emails.length === 0 || emails.length > 5) {
      toast.error("Please provide between 1 and 5 valid email addresses.")
      return
    }

    setIsSendingTest(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails })
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to send test email")
      }
      toast.success("Test email sent successfully!")
      setTestDialogOpen(false)
      setTestEmails("")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsSendingTest(false)
    }
  }

  const handleSchedule = async () => {
    console.log("🕒 SCHEDULING: handleSchedule called")
    setIsScheduling(true)
    
    try {
      if (!campaignId) {
        toast.error("Campaign ID is missing. Please refresh the page.")
        return
      }

      if (!scheduleDate) {
        toast.error("Please select a date on the calendar.")
        return
      }

      // Combine date and time
      const [hours, minutes] = scheduleTime.split(':').map(Number)
      if (isNaN(hours) || isNaN(minutes)) {
        toast.error("Please enter a valid time.")
        return
      }

      const scheduledAt = new Date(scheduleDate)
      scheduledAt.setHours(hours, minutes, 0, 0)
      
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'

      console.log("🕒 SCHEDULING: Preparing request", { 
        campaignId, 
        scheduledAt: scheduledAt.toISOString(), 
        timezone: tz 
      })

      const response = await fetch(`/api/campaigns/${campaignId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          scheduledAt: scheduledAt.toISOString(),
          timezone: tz,
          isRecurring,
          recurrenceInterval
        })
      })
      
      console.log("🕒 SCHEDULING: Response received", { status: response.status })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        console.error("🕒 SCHEDULING: Error response", error)
        throw new Error(error.error || "Failed to schedule campaign")
      }
      
      toast.success("Campaign scheduled successfully!")
      setSchedulePopoverOpen(false)
      
      // Redirect using router
      console.log("🕒 SCHEDULING: Redirecting to /campaigns")
      router.push('/campaigns')
    } catch (error: any) {
      console.error("🕒 SCHEDULING: Fatal error", error)
      toast.error(error.message || "An unexpected error occurred")
    } finally {
      setIsScheduling(false)
    }
  }

  const [isPausing, setIsPausing] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const handlePause = async () => {
    if (!campaignId) return
    setIsPausing(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/pause`, { method: "POST" })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to pause campaign")
      }
      toast.success("Campaign paused successfully")
      router.refresh()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsPausing(false)
    }
  }

  const handleCancel = async () => {
    if (!campaignId) return
    setIsCancelling(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/cancel`, { method: "POST" })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to cancel campaign")
      }
      toast.success("Campaign cancelled successfully")
      router.push("/campaigns")
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setIsCancelling(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review Campaign</h2>
        <p className="text-muted-foreground">
          Review your campaign details before launching.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          {/* Campaign Details */}
          <Card className={cn(activeEditSection === 'details' && "bg-blue-50/50 border-blue-200")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Campaign Details
              </CardTitle>
              {activeEditSection !== 'details' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditDetailsClick}
                  disabled={activeEditSection !== null}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {activeEditSection === 'details' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-subject">Subject</Label>
                    <Input
                      id="edit-subject"
                      value={editDetails.subject}
                      onChange={(e) => setEditDetails(prev => ({ ...prev, subject: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-previewText">Preview Text</Label>
                    <Input
                      id="edit-previewText"
                      value={editDetails.previewText}
                      onChange={(e) => setEditDetails(prev => ({ ...prev, previewText: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Campaign Name</Label>
                    <Input
                      id="edit-name"
                      value={editDetails.name}
                      onChange={(e) => setEditDetails(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-senderName">Sender Name</Label>
                      <Input
                        id="edit-senderName"
                        value={editDetails.senderName}
                        onChange={(e) => setEditDetails(prev => ({ ...prev, senderName: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-senderEmail">Sender Email</Label>
                      <Input
                        id="edit-senderEmail"
                        value={editDetails.senderEmail}
                        onChange={(e) => setEditDetails(prev => ({ ...prev, senderEmail: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-replyToEmail">Reply-To Email</Label>
                      <Input
                        id="edit-replyToEmail"
                        value={editDetails.replyToEmail}
                        onChange={(e) => setEditDetails(prev => ({ ...prev, replyToEmail: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end pt-2">
                    <Button variant="outline" size="sm" onClick={handleCancelDetails}>
                      Cancel
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSaveDetails}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-muted-foreground">Subject</label>
                    <p className="font-medium text-lg">{campaignDetails.subject}</p>
                  </div>
                  {campaignDetails.previewText && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Preview Text</label>
                      <p className="font-medium">{campaignDetails.previewText}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Campaign Name</label>
                    <p className="font-medium">{campaignDetails.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Sender Name</label>
                    <p className="font-medium">{campaignDetails.senderName || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Sender Email</label>
                    <p className="font-medium">{campaignDetails.senderEmail || '-'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Reply-To Email</label>
                    <p className="font-medium">{campaignDetails.replyToEmail || '-'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
 
          {/* Recipients */}
          <Card className={cn(activeEditSection === 'recipients' && "bg-blue-50/50 border-blue-200")}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recipients
              </CardTitle>
              {activeEditSection !== 'recipients' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEditRecipientsClick}
                  disabled={activeEditSection !== null}
                >
                  <Pencil className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {activeEditSection === 'recipients' ? (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search lists..."
                      value={recipientsSearchTerm}
                      onChange={(e) => setRecipientsSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {filteredLists.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">No lists found</p>
                    ) : (
                      filteredLists.map((list) => {
                        const isListSelected = tempSelectedRecipients.includes(list.id)
                        const isListExcluded = tempExcludedRecipients.includes(list.id)
                        const isInactive = (list.activeCount || 0) === 0 && (list.memberCount || 0) > 0
                        const isEmpty = (list.memberCount || 0) === 0

                        return (
                          <div 
                            key={list.id} 
                            className={cn(
                              "border rounded-md p-3 transition-all",
                              isListSelected && "border-blue-500 bg-blue-50/30",
                              (isListExcluded || isInactive || isEmpty) && "opacity-60 bg-gray-50"
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <Checkbox
                                  checked={isListSelected}
                                  onCheckedChange={(checked: boolean) => handleListToggle(list.id, checked)}
                                  disabled={isListExcluded || isInactive || isEmpty}
                                />
                                <div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className={cn("font-medium", (isInactive || isEmpty) && "text-gray-400")}>{list.name}</span>
                                    <Badge variant="secondary">
                                      {list.activeCount || 0} / {list.memberCount || 0} active
                                    </Badge>
                                    {tempExcludedContacts[list.id]?.length > 0 && (
                                      <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 font-semibold">
                                        ({tempExcludedContacts[list.id].length} excluded)
                                      </Badge>
                                    )}
                                    {isListExcluded && <Badge variant="destructive">Excluded</Badge>}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleExclusionToggle(list.id, !isListExcluded)}
                                  className={isListExcluded ? "text-blue-600 h-8" : "text-orange-600 h-8"}
                                  disabled={isInactive || isEmpty}
                                >
                                  {isListExcluded ? "Include" : "Exclude"}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleExpandList(list.id)}
                                  className="p-1 h-8 w-8 text-gray-500 hover:text-gray-900"
                                  disabled={isInactive || isEmpty}
                                >
                                  <span 
                                    className="text-xs transition-transform duration-200 block" 
                                    style={{ transform: expandedLists[list.id] ? 'rotate(90deg)' : 'rotate(0deg)' }}
                                  >
                                    ▶
                                  </span>
                                </Button>
                              </div>
                            </div>
                            {expandedLists[list.id] && (
                              <div className="mt-3 p-3 bg-gray-50/50 border-t space-y-3">
                                {loadingLists[list.id] ? (
                                  <div className="flex items-center gap-2 text-sm text-gray-500 justify-center py-2">
                                    <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                                    Loading contacts...
                                  </div>
                                ) : (listContacts[list.id] || []).length === 0 ? (
                                  <div className="text-sm text-gray-500 text-center py-1">No contacts.</div>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                                    {(listContacts[list.id] || []).map(contact => {
                                      const isContactExcluded = (tempExcludedContacts[list.id] || []).includes(contact.id)
                                      return (
                                        <div key={contact.id} className="flex items-center gap-2 p-2 bg-white rounded border text-xs">
                                          <Checkbox
                                            checked={!isContactExcluded}
                                            onCheckedChange={(checked: boolean) => 
                                              handleContactExcludeToggle(list.id, contact.id, checked)
                                            }
                                          />
                                          <span className="truncate">
                                            {contact.firstName || ""} {contact.lastName || ""} 
                                            {(contact.firstName || contact.lastName) ? " — " : ""}
                                            <span className="text-gray-500">{contact.email}</span>
                                          </span>
                                        </div>
                                      )
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })
                    )}
                  </div>
                  <div className="flex gap-2 justify-end pt-2 border-t">
                    <Button variant="outline" size="sm" onClick={handleCancelRecipients}>
                      Cancel
                    </Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={handleSaveRecipients}>
                      Save Changes
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{totalRecipients.toLocaleString()} Eligible Recipients</p>
                      <p className="text-sm text-muted-foreground">
                        ({totalMembers.toLocaleString()} total members across {selectedContactLists.length} lists)
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {selectedContactLists.length} Lists
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedContactLists.map(list => (
                      <div key={list.id} className="flex items-center justify-between p-3 bg-muted rounded-md">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{list.name}</p>
                            {excludedContacts[list.id]?.length > 0 && (
                              <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 font-semibold">
                                ({excludedContacts[list.id].length} excluded)
                              </Badge>
                            )}
                            {excludedRecipients?.includes(list.id) && (
                              <Badge variant="destructive">Excluded</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {list.activeCount || 0} / {list.memberCount || 0} active
                          </p>
                        </div>
                        {(list.activeCount || 0) > 0 ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <AlertCircle className="h-5 w-5 text-orange-600" />
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
 
        {/* Email Preview */}
        <Card className={cn("flex flex-col overflow-hidden h-[600px] lg:h-auto", activeEditSection === 'template' && "bg-blue-50/50 border-blue-200")}>
          <CardHeader className="bg-muted border-b py-3 flex-row justify-between items-center space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4" />
              Email Preview
            </CardTitle>
            
            <div className="flex items-center gap-2">
              {activeEditSection !== 'template' ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleEditTemplateClick}
                    disabled={activeEditSection !== null}
                    className="h-8"
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm" className="h-8">Send Test</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Send Test Email</DialogTitle>
                        <DialogDescription>
                          Send a preview of this email to up to 5 email addresses (comma separated).
                        </DialogDescription>
                      </DialogHeader>
                      <div className="py-4 space-y-4">
                        <div className="space-y-2">
                          <Label>Email Addresses</Label>
                          <Input 
                            placeholder="test1@example.com, test2@example.com" 
                            value={testEmails}
                            onChange={(e) => setTestEmails(e.target.value)}
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setTestDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleTestSend} disabled={isSendingTest}>
                          {isSendingTest ? "Sending..." : "Send Test"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-8" onClick={handleCancelTemplate}>
                    Cancel
                  </Button>
                  <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white h-8" onClick={handleSaveTemplate}>
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <div className="flex-1 bg-white p-4 overflow-auto min-h-[500px]">
            {activeEditSection === 'template' ? (
              isEditorOpen ? (
                <div className="h-[700px] w-full">
                  <TemplateBuilder 
                    mode={tempSelectedTemplate ? "edit" : "create"} 
                    templateId={tempSelectedTemplate}
                    showSaveAndUse={true}
                    onSaved={async (id) => {
                      onUpdateTemplate(id)
                      setTempSelectedTemplate(id)
                      setIsEditorOpen(false)
                      toast.success("Template saved!")
                    }}
                    onSaveAndUse={async (id) => {
                      onUpdateTemplate(id)
                      setTempSelectedTemplate(id)
                      setIsEditorOpen(false)
                      toast.success("Template saved and applied!")
                    }}
                    onCancel={() => setIsEditorOpen(false)}
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex gap-1 flex-wrap">
                      {categories.map(category => {
                        const Icon = category.icon
                        return (
                          <Button
                            key={category.id}
                            variant={templateCategory === category.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setTemplateCategory(category.id)}
                            className="h-8"
                          >
                            <Icon className="h-3 w-3 mr-1" />
                            {category.name}
                          </Button>
                        )
                      })}
                    </div>
                    <Button variant="outline" size="sm" onClick={() => setIsEditorOpen(true)} className="h-8">
                      <Palette className="h-4 w-4 mr-1" />
                      Edit Content
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[500px] overflow-y-auto p-1">
                    {filteredTemplates.map(template => (
                      <Card 
                        key={template.id}
                        className={cn(
                          "cursor-pointer transition-all hover:shadow-sm border p-2",
                          tempSelectedTemplate === template.id ? "ring-2 ring-primary border-primary bg-primary/5" : ""
                        )}
                        onClick={() => setTempSelectedTemplate(template.id)}
                      >
                        <div className="aspect-video bg-muted rounded-md flex items-center justify-center mb-2 overflow-hidden">
                          {template.thumbnail ? (
                            <img src={template.thumbnail} alt={template.name} className="w-full h-full object-cover" />
                          ) : (
                            <Layout className="h-8 w-8 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold text-sm">{template.name}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{template.description}</p>
                          </div>
                          {tempSelectedTemplate === template.id && (
                            <Badge className="text-[10px] py-0 px-1 bg-green-600 hover:bg-green-700">Selected</Badge>
                          )}
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )
            ) : (
              selectedTemplateData?.html ? (
                <iframe
                  srcDoc={selectedTemplateData.html}
                  className="w-full h-full min-h-[500px] border-0"
                  title="Email Preview"
                  sandbox="allow-same-origin allow-scripts"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground space-y-2 py-20">
                  <p className="font-medium text-lg">{selectedTemplateData?.name || "No template selected"}</p>
                  <p className="text-sm">HTML preview is not available for this template.</p>
                </div>
              )
            )}
          </div>
        </Card>
      </div>

      <Separator />

      {/* Launch Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="font-medium text-lg">Ready to Launch?</h3>
          <p className="text-sm text-muted-foreground">
            Your campaign will be sent to {totalRecipients.toLocaleString()} recipients.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 justify-end w-full sm:w-auto">
          
          <Popover open={schedulePopoverOpen} onOpenChange={setSchedulePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2" disabled={isLaunching || isScheduling}>
                <CalendarClock className="h-4 w-4" />
                Schedule
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">Schedule Campaign</h4>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Calendar
                    mode="single"
                    selected={scheduleDate}
                    onSelect={setScheduleDate}
                    className="border rounded-md"
                    disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input 
                    type="time" 
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="recurring" 
                    checked={isRecurring} 
                    onCheckedChange={(checked) => setIsRecurring(checked === true)}
                  />
                  <Label htmlFor="recurring" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Recurring Campaign
                  </Label>
                </div>
                {isRecurring && (
                  <div className="space-y-2 pt-1">
                    <Label>Repeat Interval</Label>
                    <Select value={recurrenceInterval} onValueChange={setRecurrenceInterval}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <Button 
                  className="w-full flex items-center justify-center gap-2" 
                  onClick={handleSchedule} 
                  disabled={isScheduling}
                >
                  {isScheduling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scheduling...
                    </>
                  ) : (
                    "Confirm Schedule"
                  )}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
          
          {status !== 'DRAFT' && status !== 'SENT' && (
            <>
              {status === 'SENDING' && (
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  disabled={isLaunching || isPausing || isCancelling}
                  onClick={handlePause}
                >
                  {isPausing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pause className="h-4 w-4" />}
                  Pause
                </Button>
              )}

              {(['SCHEDULED', 'PAUSED', 'FAILED', 'SENDING'].includes(status)) && (
                <Button
                  variant="destructive"
                  className="flex items-center gap-2"
                  disabled={isLaunching || isPausing || isCancelling}
                  onClick={handleCancel}
                >
                  {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                  Cancel
                </Button>
              )}
            </>
          )}

          {!selectedTemplate && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-md flex items-center gap-3 mb-6 animate-pulse">
              <XCircle className="h-5 w-5" />
              <div>
                <p className="font-bold">Template Missing!</p>
                <p className="text-sm">You must go back to Step 3 and select an email template before you can launch this campaign.</p>
              </div>
            </div>
          )}

          <Button
            onClick={onFinish}
            disabled={isLaunching || isScheduling || !selectedTemplate}
            size="lg"
            className="flex items-center gap-2 sm:ml-4 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLaunching ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                Launching...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Now
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
