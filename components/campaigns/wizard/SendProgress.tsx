"use client"

import { useState, useEffect } from "react"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Pause, Play, CheckCircle, AlertCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface SendProgressProps {
  campaignId: string
  onComplete?: () => void
}

export function SendProgress({ campaignId, onComplete }: SendProgressProps) {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)

  const fetchStatus = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/status`)
      if (response.ok) {
        const payload = await response.json()
        setStatus(payload.data)
        
        if (payload.data.status === 'SENT') {
          onComplete?.()
        }
      }
    } catch (error) {
      console.error("Failed to fetch campaign status:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 5000)
    return () => clearInterval(interval)
  }, [campaignId])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!status) return null

  const progress = status.recipientCount > 0 
    ? (status.totalSent / status.recipientCount) * 100 
    : 0

  return (
    <Card className="w-full max-w-2xl mx-auto border-2 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Campaign Progress</span>
          <span className="text-sm font-normal text-muted-foreground uppercase tracking-wider">
            {status.status}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex justify-between text-sm font-medium">
            <span>Sending Emails...</span>
            <span>{status.totalSent?.toLocaleString()} of {status.recipientCount?.toLocaleString()} sent</span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{status.totalSent?.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground uppercase">Sent</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{status.totalOpened?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground uppercase">Opened</p>
          </div>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-2xl font-bold">{status.totalClicked?.toLocaleString() || 0}</p>
            <p className="text-xs text-muted-foreground uppercase">Clicked</p>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4">
          {status.status === 'SENDING' && (
            <Button 
              variant="outline" 
              size="lg" 
              onClick={handlePause} 
              disabled={isUpdating}
              className="w-40 flex items-center gap-2"
            >
              <Pause className="h-4 w-4" />
              Pause
            </Button>
          )}
          {status.status === 'PAUSED' && (
            <Button 
              variant="default" 
              size="lg" 
              onClick={handleResume} 
              disabled={isUpdating}
              className="w-40 flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Resume
            </Button>
          )}
          {status.status === 'SENT' && (
            <div className="flex items-center gap-2 text-green-600 font-medium">
              <CheckCircle className="h-5 w-5" />
              Campaign Fully Sent
            </div>
          )}
        </div>

        {status.status === 'SENDING' && (
          <p className="text-center text-xs text-muted-foreground italic">
            Updating progress every 5 seconds. You can safely leave this page; the campaign will continue in the background.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
