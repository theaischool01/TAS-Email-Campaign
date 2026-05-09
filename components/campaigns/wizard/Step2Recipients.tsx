"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Users, UserMinus, AlertCircle, CheckCircle2, Target, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface ContactList {
  id: string
  name: string
  description?: string
  memberCount: number
  createdAt: string
}

interface Step2RecipientsProps {
  contactLists: ContactList[]
  segments?: any[]
  selectedRecipients: string[]
  selectedSegments?: string[]
  excludedRecipients: string[]
  onChange: (selected: string[], excluded: string[], selectedSegments: string[]) => void
  validationErrors: Record<string, string>
  onValidationChange: (isValid: boolean, errors: Record<string, string>) => void
}

export function Step2Recipients({ 
  contactLists,
  segments = [],
  selectedRecipients,
  selectedSegments = [],
  excludedRecipients,
  onChange,
  validationErrors,
  onValidationChange
}: Step2RecipientsProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'lists' | 'segments'>('lists')
  const [searchTerm, setSearchTerm] = useState("")

  // Filter contact lists based on search
  const filteredLists = useMemo(() => {
    if (!Array.isArray(contactLists)) return []
    return contactLists.filter(list => 
      list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      list.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [contactLists, searchTerm])

  // Filter segments based on search
  const filteredSegments = useMemo(() => {
    if (!Array.isArray(segments)) return []
    return segments.filter(segment => 
      segment.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      segment.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [segments, searchTerm])

  const handleListToggle = (listId: string, checked: boolean) => {
    let newSelected = [...selectedRecipients]
    if (checked) {
      newSelected.push(listId)
    } else {
      newSelected = newSelected.filter(id => id !== listId)
    }
    onChange(newSelected, excludedRecipients, selectedSegments)
  }

  const handleSegmentToggle = (segmentId: string, checked: boolean) => {
    let newSelected = [...selectedSegments]
    if (checked) {
      newSelected.push(segmentId)
    } else {
      newSelected = newSelected.filter(id => id !== segmentId)
    }
    onChange(selectedRecipients, excludedRecipients, newSelected)
  }

  const handleExclusionToggle = (listId: string, checked: boolean) => {
    let newExcluded = [...excludedRecipients]
    if (checked) {
      newExcluded.push(listId)
      // If list is excluded, it cannot be selected
      const newSelected = selectedRecipients.filter(id => id !== listId)
      onChange(newSelected, newExcluded, selectedSegments)
    } else {
      newExcluded = newExcluded.filter(id => id !== listId)
      onChange(selectedRecipients, newExcluded, selectedSegments)
    }
  }

  const isListSelected = (id: string) => selectedRecipients.includes(id)
  const isListExcluded = (id: string) => excludedRecipients.includes(id)
  const isSegmentSelected = (id: string) => selectedSegments.includes(id)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Recipients</h2>
        <p className="text-gray-600">Select the lists or segments you want to target</p>
      </div>

      {/* Tab Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-gray-100 rounded-lg">
          <Button 
            variant={activeTab === 'lists' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('lists')}
            className="px-6"
          >
            <Users className="h-4 w-4 mr-2" />
            Contact Lists ({contactLists.length})
          </Button>
          <Button 
            variant={activeTab === 'segments' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('segments')}
            className="px-6"
          >
            <Target className="h-4 w-4 mr-2" />
            Segments ({segments.length})
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={`Search ${activeTab === 'lists' ? 'lists' : 'segments'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Content */}
      <div className="space-y-4">
        {activeTab === 'lists' ? (
          filteredLists.length === 0 ? (
            <Card className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No lists found</h3>
            </Card>
          ) : (
            filteredLists.map((list) => (
              <Card key={list.id} className={cn(
                "transition-all",
                isListSelected(list.id) && "border-blue-500 bg-blue-50/50",
                isListExcluded(list.id) && "opacity-60 bg-gray-50"
              )}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <Checkbox
                      checked={isListSelected(list.id)}
                      onCheckedChange={(checked: boolean) => handleListToggle(list.id, checked)}
                      disabled={isListExcluded(list.id)}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{list.name}</span>
                        <Badge variant="secondary">{list.memberCount || 0} contacts</Badge>
                        {isListExcluded(list.id) && <Badge variant="destructive">Excluded</Badge>}
                      </div>
                      <p className="text-sm text-gray-500">{list.description}</p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleExclusionToggle(list.id, !isListExcluded(list.id))}
                    className={isListExcluded(list.id) ? "text-blue-600" : "text-orange-600"}
                  >
                    {isListExcluded(list.id) ? "Include" : "Exclude"}
                  </Button>
                </CardContent>
              </Card>
            ))
          )
        ) : (
          filteredSegments.length === 0 ? (
            <Card className="text-center py-12">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium">No segments found</h3>
              <p className="text-gray-500 mb-4">Create segments in the Contacts menu</p>
              <Button variant="outline" onClick={() => router.push("/contacts/segments")}>
                Go to Segments
              </Button>
            </Card>
          ) : (
            filteredSegments.map((segment) => (
              <Card key={segment.id} className={cn(
                "transition-all",
                isSegmentSelected(segment.id) && "border-blue-500 bg-blue-50/50"
              )}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Checkbox
                    checked={isSegmentSelected(segment.id)}
                    onCheckedChange={(checked: boolean) => handleSegmentToggle(segment.id, checked)}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{segment.name}</span>
                      <Badge variant="outline" className="flex items-center gap-1">
                        <Filter className="h-3 w-3" />
                        Dynamic
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{segment.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {(segment.criteria as any)?.tags?.map((tag: string) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] py-0">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )
        )}
      </div>

      {/* Validation Error */}
      {validationErrors.recipients && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationErrors.recipients}</AlertDescription>
        </Alert>
      )}

      {/* Tips */}
      <Alert>
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          <strong>Smart Targeting:</strong> You can combine multiple lists and segments. The system automatically deduplicates contacts and respects all unsubscriptions.
        </AlertDescription>
      </Alert>
    </div>
  )
}
