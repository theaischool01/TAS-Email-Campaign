"use client"

import { useState, useMemo, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Users, AlertCircle, CheckCircle2, Target, Filter, Tags } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { FilterBuilder } from "@/components/shared/filter-builder/FilterBuilder"
import { SegmentRuleGroup } from "@/components/shared/filter-builder/types"
import { AudienceSelector } from "./AudienceSelector"

interface ContactList {
  id: string
  name: string
  description?: string
  memberCount: number
  activeCount: number
  createdAt: string
}

interface Step2RecipientsProps {
  contactLists: ContactList[]
  segments?: any[]
  selectedRecipients: string[]
  selectedSegments?: string[]
  excludedRecipients: string[]
  includedTags?: string
  excludedTags?: string
  onChange: (selected: string[], excluded: string[], selectedSegments: string[], includedTags?: string, excludedTags?: string, audienceFilters?: any) => void
  validationErrors: Record<string, string>
  onValidationChange: (isValid: boolean, errors: Record<string, string>) => void
  onExcludedContactsChange?: (excluded: Record<string, string[]>) => void
  audienceFilters?: any
  campaignId?: string
}

interface TagAggregate {
  tag: string
  count: number
}

export function Step2Recipients({ 
  contactLists,
  segments = [],
  selectedRecipients,
  selectedSegments = [],
  excludedRecipients,
  includedTags = '',
  excludedTags = '',
  onChange,
  validationErrors,
  onValidationChange,
  onExcludedContactsChange,
  audienceFilters,
  campaignId
}: Step2RecipientsProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'lists' | 'segments'>('lists')
  const [searchTerm, setSearchTerm] = useState("")
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  
  // Custom Field / Counts Schema
  const [customFields, setCustomFields] = useState<any[]>([])

  useEffect(() => {
    const loadSchema = async () => {
      try {
        const fieldsRes = await fetch("/api/contacts/custom-fields")
        if (fieldsRes.ok) {
          const fields = await fieldsRes.json()
          setCustomFields(fields)
        }
      } catch (err) {
        console.error("Failed to load schema in Step 2:", err)
      }
    }
    loadSchema()
  }, [])

  const customFieldValueCounts = useMemo(() => {
    return {} as Record<string, number>
  }, [])

  const contacts = useMemo(() => [] as any[], [])

  // Save Segment States
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [segmentName, setSegmentName] = useState("")
  const [segmentDesc, setSegmentDesc] = useState("")
  const [savingSegment, setSavingSegment] = useState(false)

  const handleSaveAudienceAsSegment = async () => {
    if (!segmentName.trim()) {
      toast.error("Please enter a segment name")
      return
    }

    setSavingSegment(true)
    try {
      const subFilters: any[] = []

      // 1. List/Tag union
      if (selectedRecipients.length > 0 || currentIncludedTags.length > 0 || excludedRecipients.length > 0) {
        const rules: any[] = []
        if (selectedRecipients.length > 0) {
          rules.push({
            type: "RULE",
            field: "list.id",
            operator: "in_list",
            value: selectedRecipients
          })
        }
        if (excludedRecipients.length > 0) {
          rules.push({
            type: "RULE",
            field: "list.id",
            operator: "not_in_list",
            value: excludedRecipients
          })
        }
        if (currentIncludedTags.length > 0) {
          rules.push({
            type: "RULE",
            field: "contact.tags",
            operator: "contains_any",
            value: currentIncludedTags
          })
        }
        subFilters.push({
          conjunction: "AND",
          rules
        })
      }

      // 2. Segments
      const segmentRules = segments
        .filter(s => selectedSegments.includes(s.id))
        .map(s => s.criteria)
        .filter(Boolean)

      if (segmentRules.length > 0) {
        if (segmentRules.length === 1) {
          subFilters.push(segmentRules[0])
        } else {
          subFilters.push({
            conjunction: "OR",
            rules: segmentRules
          })
        }
      }

      // 3. Excluded tags
      const currentExcludedTags = excludedTags
        ? excludedTags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean)
        : []
      if (currentExcludedTags.length > 0) {
        const exclusionRules = currentExcludedTags.map(tag => ({
          type: "RULE",
          field: "contact.tags",
          operator: "not_equals",
          value: tag
        }))
        subFilters.push(...exclusionRules)
      }

      let criteria: any = null
      if (subFilters.length === 1) {
        criteria = subFilters[0]
      } else if (subFilters.length > 1) {
        criteria = {
          conjunction: "AND",
          rules: subFilters
        }
      }

      const response = await fetch("/api/segments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: segmentName,
          description: segmentDesc,
          criteria
        })
      })

      if (response.ok) {
        const payload = await response.json()
        toast.success("Audience saved as segment successfully!")
        setSaveDialogOpen(false)
        setSegmentName("")
        setSegmentDesc("")
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || "Failed to save segment")
      }
    } catch (err: any) {
      toast.error("Failed to save segment")
      console.error(err)
    } finally {
      setSavingSegment(false)
    }
  }
  
  // Expanded states, loaded tags by list, and loading statuses
  const [expandedLists, setExpandedLists] = useState<Record<string, boolean>>({})
  const [listTags, setListTags] = useState<Record<string, TagAggregate[]>>({})
  const [loadingTags, setLoadingTags] = useState<Record<string, boolean>>({})

  // Estimator live state
  const [estimating, setEstimating] = useState(false)
  const [estimate, setEstimate] = useState<{
    totalContacts: number
    excludedContacts: number
    finalRecipients: number
  } | null>(null)

  // Segment counts cache
  const [segmentCounts, setSegmentCounts] = useState<Record<string, number>>({})
  const [loadingSegmentCounts, setLoadingSegmentCounts] = useState<Record<string, boolean>>({})

  // Load counts for segments in parallel
  useEffect(() => {
    if (!segments || segments.length === 0) return

    segments.forEach(async (segment) => {
      if (segmentCounts[segment.id] !== undefined || loadingSegmentCounts[segment.id]) return
      
      setLoadingSegmentCounts(prev => ({ ...prev, [segment.id]: true }))
      try {
        const response = await fetch("/api/segments/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ criteria: segment.criteria })
        })
        if (response.ok) {
          const data = await response.json()
          if (data.count !== undefined) {
            setSegmentCounts(prev => ({ ...prev, [segment.id]: data.count }))
          }
        }
      } catch (err) {
        console.error("Failed to estimate segment count:", segment.id, err)
      } finally {
        setLoadingSegmentCounts(prev => ({ ...prev, [segment.id]: false }))
      }
    })
  }, [segments])

  // Current included tags array parsed from state
  const currentIncludedTags = useMemo(() => {
    if (!includedTags) return []
    return includedTags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean)
  }, [includedTags])

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

  // Call estimation API whenever selected list IDs, segments, or included tags change
  useEffect(() => {
    let active = true
    const fetchEstimate = async () => {
      if (selectedRecipients.length === 0 && selectedSegments.length === 0) {
        setEstimate({ totalContacts: 0, excludedContacts: 0, finalRecipients: 0 })
        return
      }
      setEstimating(true)
      try {
        const response = await fetch("/api/campaigns/estimate-recipients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            listIds: selectedRecipients,
            includedTags: currentIncludedTags,
            segmentId: selectedSegments.length > 0 ? selectedSegments[0] : undefined,
            audienceFilters: audienceFilters || undefined
          })
        })
        if (response.ok && active) {
          const data = await response.json()
          setEstimate(data)
        }
      } catch (err) {
        console.error("Failed to fetch recipient estimate:", err)
      } finally {
        if (active) setEstimating(false)
      }
    }

    const timer = setTimeout(fetchEstimate, 300)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [selectedRecipients, selectedSegments, currentIncludedTags, audienceFilters])

  const handleListToggle = (listId: string, checked: boolean) => {
    let newSelected = [...selectedRecipients]
    if (checked) {
      newSelected.push(listId)
    } else {
      newSelected = newSelected.filter(id => id !== listId)
    }
    onChange(newSelected, excludedRecipients, selectedSegments, includedTags, excludedTags, audienceFilters)
  }

  const handleSegmentToggle = (segmentId: string, checked: boolean) => {
    let newSelected = [...selectedSegments]
    if (checked) {
      newSelected.push(segmentId)
    } else {
      newSelected = newSelected.filter(id => id !== segmentId)
    }
    onChange(selectedRecipients, excludedRecipients, newSelected, includedTags, excludedTags, audienceFilters)
  }

  const handleExclusionToggle = (listId: string, checked: boolean) => {
    let newExcluded = [...excludedRecipients]
    if (checked) {
      newExcluded.push(listId)
      // If list is excluded, it cannot be selected
      const newSelected = selectedRecipients.filter(id => id !== listId)
      onChange(newSelected, newExcluded, selectedSegments, includedTags, excludedTags, audienceFilters)
    } else {
      newExcluded = newExcluded.filter(id => id !== listId)
      onChange(selectedRecipients, newExcluded, selectedSegments, includedTags, excludedTags, audienceFilters)
    }
  }

  const toggleExpandList = async (listId: string) => {
    const isCurrentlyExpanded = !!expandedLists[listId]
    setExpandedLists(prev => ({
      ...prev,
      [listId]: !isCurrentlyExpanded
    }))

    if (!isCurrentlyExpanded && !listTags[listId] && !loadingTags[listId]) {
      setLoadingTags(prev => ({ ...prev, [listId]: true }))
      try {
        const response = await fetch(`/api/contacts/lists/${listId}/tags`)
        if (response.ok) {
          const data = await response.json()
          setListTags(prev => ({
            ...prev,
            [listId]: data
          }))
        }
      } catch (error) {
        console.error("Failed to fetch tags for list", listId, error)
      } finally {
        setLoadingTags(prev => ({ ...prev, [listId]: false }))
      }
    }
  }

  // Handle checking/unchecking a tag (inclusion list logic)
  const handleTagToggle = (tag: string, isChecked: boolean) => {
    const tagLower = tag.trim().toLowerCase()
    let newIncluded = [...currentIncludedTags]

    if (isChecked) {
      // Add to included list
      if (!newIncluded.includes(tagLower)) {
        newIncluded.push(tagLower)
      }
    } else {
      // Remove from included list
      newIncluded = newIncluded.filter(t => t !== tagLower)
    }

    const newIncludedTagsString = newIncluded.join(",")
    onChange(selectedRecipients, excludedRecipients, selectedSegments, newIncludedTagsString, excludedTags, audienceFilters)
  }

  const isListSelected = (id: string) => selectedRecipients.includes(id)
  const isListExcluded = (id: string) => excludedRecipients.includes(id)
  const isSegmentSelected = (id: string) => selectedSegments.includes(id)


  return (
    <div className="w-full max-w-3xl mx-auto px-4 sm:px-0 space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Choose Recipients</h2>
        <p className="text-slate-500 text-sm mb-6">Select the lists or segments you want to target</p>
      </div>

      {/* Live Estimate Widget */}
      {(selectedRecipients.length > 0 || selectedSegments.length > 0) && (
        <Card className="border border-blue-100 bg-blue-50/30 rounded-xl shadow-none overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Tags className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Live Estimate</p>
                <div className="flex items-baseline gap-2 mt-1">
                  {estimating ? (
                    <span className="text-sm text-slate-500 animate-pulse">Calculating estimate...</span>
                  ) : estimate ? (
                    <>
                      <span className="text-2xl font-bold text-slate-900">
                        {estimate.finalRecipients.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500">
                        recipients (out of {estimate.totalContacts.toLocaleString()} total, {estimate.excludedContacts.toLocaleString()} excluded by tag filter/suppressions)
                      </span>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 bg-white hover:bg-blue-50 font-semibold rounded-xl gap-1">
                  Save Audience as Segment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Save Audience as Segment</DialogTitle>
                  <DialogDescription>
                    Save your current campaign targeting criteria as a reusable dynamic segment.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="seg-name">Segment Name</Label>
                    <Input 
                      id="seg-name"
                      placeholder="e.g. Telangana Active VIPs" 
                      value={segmentName}
                      onChange={(e) => setSegmentName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="seg-desc">Description</Label>
                    <Input 
                      id="seg-desc"
                      placeholder="e.g. Contacts located in Telangana who are VIPs" 
                      value={segmentDesc}
                      onChange={(e) => setSegmentDesc(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                  <Button onClick={handleSaveAudienceAsSegment} disabled={savingSegment}>
                    {savingSegment ? "Saving..." : "Save Segment"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      )}

      {/* Tab Switcher */}
      <div className="flex justify-center">
        <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1">
          <Button 
            variant={activeTab === 'lists' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('lists')}
            className={activeTab === 'lists' 
              ? "flex items-center gap-2 px-5 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold transition-all" 
              : "flex items-center gap-2 px-5 py-2 rounded-lg text-slate-500 text-sm font-medium hover:bg-white transition-all"}
          >
            <Users className="h-4 w-4" />
            Contact Lists ({contactLists.length})
          </Button>
          <Button 
            variant={activeTab === 'segments' ? 'default' : 'ghost'} 
            size="sm"
            onClick={() => setActiveTab('segments')}
            className={activeTab === 'segments' 
              ? "flex items-center gap-2 px-5 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold transition-all" 
              : "flex items-center gap-2 px-5 py-2 rounded-lg text-slate-500 text-sm font-medium hover:bg-white transition-all"}
          >
            <Target className="h-4 w-4" />
            Segments ({segments.length})
          </Button>
        </div>
      </div>

      <AudienceSelector
        listId={selectedRecipients.length > 0 ? selectedRecipients.join(",") : null}
        audienceFilters={audienceFilters}
        onChange={(newFilters) => {
          onChange(selectedRecipients, excludedRecipients, selectedSegments, includedTags, excludedTags, newFilters)
        }}
        campaignId={campaignId}
      />

      {/* Advanced Filters (Collapsed Rule Builder) */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="text-xs font-semibold text-slate-500 hover:text-slate-700 flex items-center gap-1 focus:outline-none transition-colors"
        >
          <span>Advanced Filters</span>
          <span>{showAdvancedFilters ? "▲" : "▼"}</span>
        </button>

        {showAdvancedFilters && (
          <Card className="border border-slate-200 rounded-xl shadow-none p-5 mt-4 space-y-4 transition-all">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-blue-600" />
              <div>
                <h3 className="font-semibold text-slate-850 text-sm">Advanced Rule Combinations</h3>
                <p className="text-xs text-slate-500">Use the rule builder for complex boolean logic filters.</p>
              </div>
            </div>
            <FilterBuilder
              value={audienceFilters || { conjunction: "AND", rules: [] }}
              onChange={(newFilters) => {
                onChange(selectedRecipients, excludedRecipients, selectedSegments, includedTags, excludedTags, newFilters)
              }}
              customFields={customFields}
              customFieldValueCounts={customFieldValueCounts}
              contacts={contacts}
              allowSystemFields={false}
            />
          </Card>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={`Search ${activeTab === 'lists' ? 'lists' : 'segments'}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9 text-sm rounded-xl border-slate-200 bg-slate-50 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
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
            filteredLists.map((list) => {
              const isInactive = (list.activeCount || 0) === 0 && (list.memberCount || 0) > 0
              const isEmpty = (list.memberCount || 0) === 0
              
              return (
                <Card key={list.id} className={cn(
                  "border border-slate-200 rounded-xl mb-2 hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer shadow-none overflow-hidden",
                  isListSelected(list.id) && "border-blue-500 bg-blue-50/50",
                  (isListExcluded(list.id) || isInactive || isEmpty) && "opacity-60 bg-gray-50"
                )}>
                  <CardContent className="p-0 overflow-hidden">
                    <div className="p-4 flex flex-col gap-4 md:flex-row md:items-center justify-between min-w-0">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <Checkbox
                          checked={isListSelected(list.id)}
                          onCheckedChange={(checked: boolean) => handleListToggle(list.id, checked)}
                          disabled={isListExcluded(list.id) || isInactive || isEmpty}
                        />
                        <div className="min-w-0 w-full">
                          <div className="flex items-center gap-2 flex-wrap min-w-0">
                            <span className={cn("text-sm font-semibold text-slate-800 truncate", (isInactive || isEmpty) && "text-gray-400")}>{list.name}</span>
                            <Badge variant={isInactive ? "destructive" : "secondary"} className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full ml-2">
                              {list.activeCount || 0} / {list.memberCount || 0} active
                            </Badge>
                            {isListExcluded(list.id) && <Badge variant="destructive">Excluded</Badge>}
                            {isInactive && (
                              <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                                <AlertCircle className="h-3 w-3 mr-1" /> No active members
                              </Badge>
                            )}
                            {isEmpty && (
                              <Badge variant="outline" className="text-gray-400 border-gray-200">
                                Empty
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{list.description}</p>
                        </div>
                      </div>
                      <div className="flex-shrink-0 min-w-0 flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleExclusionToggle(list.id, !isListExcluded(list.id))}
                          className={isListExcluded(list.id) ? "text-blue-600" : "text-orange-600"}
                          disabled={isInactive || isEmpty}
                        >
                          {isListExcluded(list.id) ? "Include List" : "Filter Tags"}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleExpandList(list.id)}
                          className="p-1 h-8 w-8 text-gray-500 hover:text-gray-900"
                          disabled={isInactive || isEmpty}
                          title="Expand/Collapse Tags"
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
                      <div className="p-4 bg-gray-50/50 border-t space-y-3">
                        {loadingTags[list.id] ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500 justify-center py-4">
                            <span className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                            Loading tags...
                          </div>
                        ) : (listTags[list.id] || []).length === 0 ? (
                          <div className="text-sm text-slate-500 text-center py-2 font-medium">
                            No tags found in this list. All active contacts in this list will receive the campaign.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2">
                            {(listTags[list.id] || []).map(item => {
                              const isTagChecked = currentIncludedTags.includes(item.tag.toLowerCase())
                              return (
                                <div key={item.tag} className="flex items-center gap-3 p-2 bg-white rounded border text-sm hover:bg-slate-50 transition-colors">
                                  <Checkbox
                                    checked={isTagChecked}
                                    onCheckedChange={(checked: boolean) => 
                                      handleTagToggle(item.tag, checked)
                                    }
                                  />
                                  <span className="truncate text-slate-700 font-medium">
                                    {item.tag} <span className="text-slate-400 text-xs font-normal">({item.count.toLocaleString()} contacts)</span>
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })
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
                "border border-slate-200 rounded-xl mb-2 hover:border-blue-300 hover:bg-blue-50/20 transition-all cursor-pointer shadow-none",
                isSegmentSelected(segment.id) && "border-blue-500 bg-blue-50/50"
              )}>
                <CardContent className="p-4 flex items-center gap-4">
                  <Checkbox
                    checked={isSegmentSelected(segment.id)}
                    onCheckedChange={(checked: boolean) => handleSegmentToggle(segment.id, checked)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-slate-800">{segment.name}</span>
                      <Badge variant="outline" className="flex items-center gap-1 text-slate-500 bg-slate-50">
                        <Filter className="h-3 w-3" />
                        Dynamic
                      </Badge>
                      <Badge variant="secondary" className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full ml-2">
                        {loadingSegmentCounts[segment.id] ? (
                          <span className="w-2.5 h-2.5 border border-slate-500 border-t-transparent rounded-full animate-spin inline-block mr-1"></span>
                        ) : segmentCounts[segment.id] !== undefined ? (
                          `${segmentCounts[segment.id].toLocaleString()} members`
                        ) : (
                          "0 members"
                        )}
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
        <Alert variant="destructive" className="rounded-xl border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{validationErrors.recipients}</AlertDescription>
        </Alert>
      )}

      {/* Tips */}
      <Alert className="rounded-xl border-slate-200 bg-slate-50">
        <CheckCircle2 className="h-4 w-4" />
        <AlertDescription>
          <strong>Smart Targeting:</strong> You can combine multiple lists and segments. The system automatically deduplicates contacts and respects all unsubscriptions and tag exclusions.
        </AlertDescription>
      </Alert>
    </div>
  )
}
