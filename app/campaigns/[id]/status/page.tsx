"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter, useParams } from "next/navigation"
import { 
  ArrowLeft, 
  Clock, 
  Pause, 
  Play, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  CalendarClock,
  Send,
  BarChart3,
  XCircle,
  Edit
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"

export default function CampaignStatusPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const campaignId = params.id as string

  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  
  // Reschedule state
  const [newDate, setNewDate] = useState("")
  const [newTime, setNewTime] = useState("12:00")
  const [showReschedule, setShowReschedule] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/status`)
      if (response.ok) {
        const payload = await response.json()
        setStatus(payload.data)
      } else {
        toast.error("Failed to load campaign status")
      }
    } catch (error) {
      console.error("Failed to fetch campaign status:", error)
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    fetchStatus()
    // Poll for status every 5 seconds if sending
    let interval: any
    if (status?.status === 'SENDING') {
      interval = setInterval(fetchStatus, 5000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [campaignId, status?.status, fetchStatus])

  const handlePause = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/pause`, { method: 'POST' })
      if (response.ok) {
        toast.success("Campaign paused")
        fetchStatus()
      } else {
        toast.error("Failed to pause campaign")
      }
    } catch (error) {
      toast.error("An error occurred while pausing")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleResume = async () => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/resume`, { method: 'POST' })
      if (response.ok) {
        toast.success("Campaign resumed")
        fetchStatus()
      } else {
        toast.error("Failed to resume campaign")
      }
    } catch (error) {
      toast.error("An error occurred while resuming")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm("Are you sure you want to cancel this campaign? It cannot be resumed once cancelled.")) return
    
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/cancel`, { method: 'POST' })
      if (response.ok) {
        toast.success("Campaign cancelled")
        fetchStatus()
      } else {
        const err = await response.json()
        toast.error(err.error || "Failed to cancel campaign")
      }
    } catch (error) {
      toast.error("An error occurred while cancelling")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleReschedule = async () => {
    if (!newDate) {
      toast.error("Please select a date")
      return
    }

    const scheduledAt = new Date(`${newDate}T${newTime}`)
    if (scheduledAt <= new Date()) {
      toast.error("Scheduled time must be in the future")
      return
    }

    setIsUpdating(true)
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/schedule`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          scheduledAt: scheduledAt.toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        })
      })

      if (response.ok) {
        toast.success("Campaign rescheduled successfully")
        setShowReschedule(false)
        fetchStatus()
      } else {
        const err = await response.json()
        toast.error(err.error || "Failed to reschedule")
      }
    } catch (error) {
      toast.error("An error occurred while rescheduling")
    } finally {
      setIsUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!status) {
    return (
      <div className="container mx-auto py-12 text-center">
        <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Campaign Not Found</h1>
        <Button variant="link" onClick={() => router.push('/campaigns')} className="mt-4">
          Back to Campaigns
        </Button>
      </div>
    )
  }

  const progress = status.recipientCount > 0 
    ? (status.totalSent / status.recipientCount) * 100 
    : 0

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push('/campaigns')}
          className="flex items-center gap-2 mb-4 hover:bg-transparent p-0"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Campaigns
        </Button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Campaign Status</h1>
            <p className="text-muted-foreground mt-1">
              Campaign ID: <span className="font-mono text-xs">{campaignId}</span>
            </p>
          </div>
          <Badge className={`text-sm px-3 py-1 w-fit h-fit uppercase font-bold ${
            status.status === 'SENDING' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
            status.status === 'SCHEDULED' ? 'bg-blue-100 text-blue-800 border-blue-300' :
            status.status === 'SENT' ? 'bg-green-100 text-green-800 border-green-300' :
            status.status === 'PAUSED' ? 'bg-orange-100 text-orange-800 border-orange-300' :
            'bg-gray-100 text-gray-800'
          }`}>
            {status.status}
          </Badge>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Progress Card (Only for Sending/Paused/Sent) */}
        {['SENDING', 'PAUSED', 'SENT'].includes(status.status) && (
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-primary" />
                Delivery Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>{status.status === 'SENT' ? 'Complete' : 'Processing...'}</span>
                  <span>{status.totalSent?.toLocaleString()} of {status.recipientCount?.toLocaleString()} sent</span>
                </div>
                <Progress value={progress} className="h-4" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-muted p-4 rounded-xl text-center">
                  <p className="text-3xl font-bold">{status.totalSent?.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Sent</p>
                </div>
                <div className="bg-muted p-4 rounded-xl text-center">
                  <p className="text-3xl font-bold text-blue-600">{status.totalOpened?.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Opens</p>
                </div>
                <div className="bg-muted p-4 rounded-xl text-center">
                  <p className="text-3xl font-bold text-green-600">{status.totalClicked?.toLocaleString() || 0}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Clicks</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-muted/30 border-t flex justify-center gap-4 py-4">
              {status.status === 'SENDING' && (
                <Button variant="outline" size="lg" onClick={handlePause} disabled={isUpdating} className="w-40 border-2">
                  <Pause className="h-4 w-4 mr-2" /> Pause
                </Button>
              )}
              {status.status === 'PAUSED' && (
                <Button variant="default" size="lg" onClick={handleResume} disabled={isUpdating} className="w-40">
                  <Play className="h-4 w-4 mr-2" /> Resume
                </Button>
              )}
              {status.status === 'SENT' && (
                <Button variant="default" size="lg" onClick={() => router.push(`/campaigns/${campaignId}/report`)} className="w-48">
                  <BarChart3 className="h-4 w-4 mr-2" /> View Full Report
                </Button>
              )}
            </CardFooter>
          </Card>
        )}

        {/* Schedule Card (Only for Scheduled) */}
        {status.status === 'SCHEDULED' && (
          <Card className="border-2 border-blue-200">
            <CardHeader className="bg-blue-50/50">
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <CalendarClock className="h-5 w-5" />
                Scheduled Send
              </CardTitle>
              <CardDescription>
                This campaign is set to be delivered at the following time:
              </CardDescription>
            </CardHeader>
            <CardContent className="py-8 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-4 bg-blue-50 border-2 border-blue-100 rounded-2xl">
                <Clock className="h-8 w-8 text-blue-600" />
                <div className="text-left">
                  <p className="text-sm text-blue-600 font-medium uppercase tracking-wider">Scheduled At</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {new Date(status.scheduledAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-blue-50/30 border-t flex justify-center gap-4 py-4">
              <Dialog open={showReschedule} onOpenChange={setShowReschedule}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="lg" className="w-48 border-2 border-blue-200 text-blue-800 hover:bg-blue-100">
                    <Edit className="h-4 w-4 mr-2" /> Reschedule
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reschedule Campaign</DialogTitle>
                    <DialogDescription>
                      Pick a new date and time to send this campaign.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                      </div>
                      <div className="space-y-2">
                        <Label>Time</Label>
                        <Input type="time" value={newTime} onChange={(e) => setNewTime(e.target.value)} />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setShowReschedule(false)}>Cancel</Button>
                    <Button onClick={handleReschedule} disabled={isUpdating}>
                      {isUpdating ? "Saving..." : "Confirm New Time"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button variant="ghost" className="text-red-600 hover:bg-red-50" onClick={handleCancel}>
                <XCircle className="h-4 w-4 mr-2" /> Cancel Campaign
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* Details Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Campaign Details</CardTitle>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold">Status History</Label>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Created on {new Date(status.createdAt).toLocaleDateString()}</span>
                  </div>
                  {status.scheduledAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span>Scheduled for {new Date(status.scheduledAt).toLocaleString()}</span>
                    </div>
                  )}
                  {status.sentAt && (
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Fully sent on {new Date(status.sentAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold">Recipients</Label>
                <p className="text-2xl font-bold mt-1">{status.recipientCount?.toLocaleString()} Total</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Targeted contacts from your selected lists and segments.
                </p>
              </div>
              <div className="pt-2">
                <Button variant="outline" className="w-full" onClick={() => router.push(`/campaigns/${campaignId}/edit`)}>
                  <Edit className="h-4 w-4 mr-2" /> Edit Campaign Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
