"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Mail, Users, Palette, Send, CheckCircle } from "lucide-react"

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
  onFinish: () => void
}

export function Step4Review({
  campaignDetails,
  selectedRecipients,
  selectedTemplate,
  contactLists,
  templates,
  campaignId,
  onFinish
}: Step4ReviewProps) {
  const selectedTemplateData = templates.find(t => t.id === selectedTemplate)
  const selectedContactLists = contactLists.filter(list => 
    selectedRecipients.includes(list.id)
  )

  const totalRecipients = selectedContactLists.reduce((sum, list) => 
    sum + (list.memberCount || 0), 0
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review Campaign</h2>
        <p className="text-muted-foreground">
          Review your campaign details before launching.
        </p>
      </div>

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
            <div>
              <label className="text-sm font-medium text-muted-foreground">Campaign Name</label>
              <p className="font-medium">{campaignDetails.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-muted-foreground">Subject</label>
              <p className="font-medium">{campaignDetails.subject}</p>
            </div>
            {campaignDetails.previewText && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Preview Text</label>
                <p className="font-medium">{campaignDetails.previewText}</p>
              </div>
            )}
            {campaignDetails.senderName && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Sender Name</label>
                <p className="font-medium">{campaignDetails.senderName}</p>
              </div>
            )}
            {campaignDetails.senderEmail && (
              <div>
                <label className="text-sm font-medium text-muted-foreground">Sender Email</label>
                <p className="font-medium">{campaignDetails.senderEmail}</p>
              </div>
            )}
            {campaignDetails.replyToEmail && (
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-muted-foreground">Reply-To Email</label>
                <p className="font-medium">{campaignDetails.replyToEmail}</p>
              </div>
            )}
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

      {/* Template */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedTemplateData ? (
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <div>
                <p className="font-medium">{selectedTemplateData.name}</p>
                <p className="text-sm text-muted-foreground">
                  {selectedTemplateData.description}
                </p>
              </div>
              <Badge variant="secondary">
                {selectedTemplateData.category}
              </Badge>
            </div>
          ) : (
            <div className="p-3 bg-muted rounded-md">
              <p className="text-muted-foreground">No template selected</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* Launch Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Ready to Launch?</h3>
          <p className="text-sm text-muted-foreground">
            Your campaign will be sent to {totalRecipients.toLocaleString()} recipients.
          </p>
        </div>
        <Button onClick={onFinish} size="lg" className="flex items-center gap-2">
          <Send className="h-4 w-4" />
          Launch Campaign
        </Button>
      </div>
    </div>
  )
}
