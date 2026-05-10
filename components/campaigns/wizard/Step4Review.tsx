"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Mail, Users, Palette, Send, CheckCircle, CalendarClock, Pause, XCircle, Loader2 } from "lucide-react"
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
import { useState } from "react"
import { format } from "date-fns"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

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
  selectedTemplate?: string
  contactLists: any[]
  templates: any[]
  campaignId?: string
  status?: string
  onFinish: () => void
  isLaunching?: boolean
}

export function Step4Review({
  campaignDetails,
  selectedRecipients,
  selectedTemplate,
  contactLists,
  templates,
  campaignId,
  status = 'DRAFT',
  onFinish,
  isLaunching = false
}: Step4ReviewProps) {
  const router = useRouter()
  const selectedTemplateData = templates.find(t => t.id === selectedTemplate)
  const selectedContactLists = contactLists.filter(list => 
    selectedRecipients.includes(list.id)
  )

  const totalRecipients = selectedContactLists.reduce((sum, list) => 
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Campaign Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
            </CardContent>
          </Card>

          {/* Recipients */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Recipients
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{totalRecipients.toLocaleString()} Total Recipients</p>
                  <p className="text-sm text-muted-foreground">
                    Across {selectedContactLists.length} contact list{selectedContactLists.length !== 1 ? 's' : ''}
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
                      <p className="font-medium">{list.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {list.memberCount || 0} contacts
                      </p>
                    </div>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Email Preview */}
        <Card className="flex flex-col overflow-hidden h-[600px] lg:h-auto">
          <CardHeader className="bg-muted border-b py-3 flex-row justify-between items-center space-y-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Palette className="h-4 w-4" />
              Email Preview
            </CardTitle>
            
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

          </CardHeader>
          <div className="flex-1 bg-white p-4 overflow-auto">
            {selectedTemplateData?.html ? (
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

          <Button
            onClick={onFinish}
            disabled={isLaunching || isScheduling}
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
