"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Users, UserMinus, AlertCircle, CheckCircle2 } from "lucide-react"
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

interface RecipientStats {
  totalSelected: number
  duplicatesRemoved: number
  unsubscribedRemoved: number
  finalCount: number
}

interface Step2RecipientsProps {
  contactLists: ContactList[]
  selectedRecipients: string[]
  excludedRecipients: string[]
  onChange: (selected: string[], excluded: string[]) => void
  validationErrors: Record<string, string>
  onValidationChange: (isValid: boolean, errors: Record<string, string>) => void
}

export function Step2Recipients({ 
  contactLists,
  selectedRecipients,
  excludedRecipients,
  onChange,
  validationErrors,
  onValidationChange
}: Step2RecipientsProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)

  // Filter contact lists based on search
  const filteredLists = useMemo(() => {
    if (!Array.isArray(contactLists)) return []
    
    return contactLists.filter(list => 
      list.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      list.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [contactLists, searchTerm])

  // Calculate recipient statistics
  const recipientStats = useMemo((): RecipientStats => {
    if (!Array.isArray(contactLists) || selectedRecipients.length === 0) {
      return {
        totalSelected: 0,
        duplicatesRemoved: 0,
        unsubscribedRemoved: 0,
        finalCount: 0
      }
    }

    // Get selected lists
    const selectedListsData = contactLists.filter(list => 
      selectedRecipients.includes(list.id)
    )
    
    // Get excluded lists
    const excludedListsData = contactLists.filter(list => 
      excludedRecipients.includes(list.id)
    )

    // Calculate totals (simplified - in real implementation this would query actual contacts)
    let totalSelected = 0
    const allEmails = new Set<string>()

    selectedListsData.forEach(list => {
      totalSelected += list.memberCount || 0
      // In real implementation, you'd fetch actual emails here
      // For now, we'll simulate with member count
      for (let i = 0; i < (list.memberCount || 0); i++) {
        allEmails.add(`email_${list.id}_${i}@example.com`)
      }
    })

    // Remove excluded emails
    excludedListsData.forEach(list => {
      for (let i = 0; i < (list.memberCount || 0); i++) {
        allEmails.delete(`email_${list.id}_${i}@example.com`)
      }
    })

    const finalCount = allEmails.size
    const duplicatesRemoved = totalSelected - finalCount

    return {
      totalSelected,
      duplicatesRemoved,
      unsubscribedRemoved: 0, // Would need more complex logic
      finalCount
    }
  }, [contactLists, selectedRecipients, excludedRecipients])

  // Validate step
  useEffect(() => {
    const errors: Record<string, string> = {}
    
    if (selectedRecipients.length === 0) {
      errors.recipients = 'Please select at least one contact list'
    }

    onValidationChange(selectedRecipients.length > 0, errors)
  }, [selectedRecipients, onValidationChange])

  // Handle list selection
  const handleListToggle = (listId: string, isSelected: boolean) => {
    let newSelected = [...selectedRecipients]
    
    if (isSelected) {
      if (!newSelected.includes(listId)) {
        newSelected.push(listId)
      }
    } else {
      newSelected = newSelected.filter(id => id !== listId)
    }

    onChange(newSelected, excludedRecipients)
  }

  // Handle list exclusion
  const handleExclusionToggle = (listId: string, isExcluded: boolean) => {
    let newExcluded = [...excludedRecipients]
    
    if (isExcluded) {
      if (!newExcluded.includes(listId)) {
        newExcluded.push(listId)
      }
    } else {
      newExcluded = newExcluded.filter(id => id !== listId)
    }

    onChange(selectedRecipients, newExcluded)
  }

  const isSelected = (listId: string) => selectedRecipients.includes(listId)
  const isExcluded = (listId: string) => excludedRecipients.includes(listId)

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Recipients
        </h2>
        <p className="text-gray-600">
          Select the contact lists you want to send this campaign to
        </p>
      </div>

      {/* Recipient Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="h-5 w-5" />
            Recipient Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {recipientStats.totalSelected.toLocaleString()}
              </div>
              <div className="text-sm text-blue-600">Total Selected</div>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {recipientStats.duplicatesRemoved.toLocaleString()}
              </div>
              <div className="text-sm text-green-600">Duplicates Removed</div>
            </div>
            
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {recipientStats.unsubscribedRemoved.toLocaleString()}
              </div>
              <div className="text-sm text-orange-600">Unsubscribed Removed</div>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {recipientStats.finalCount.toLocaleString()}
              </div>
              <div className="text-sm text-purple-600">Final Recipients</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search contact lists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Contact Lists */}
      <div className="space-y-4">
        {loading ? (
          // Loading skeleton
          [...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : filteredLists.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No contact lists found' : 'No contact lists available'}
              </h3>
              <p className="text-gray-600">
                {searchTerm 
                  ? 'Try adjusting your search terms'
                  : 'Create your first contact list to get started'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredLists.map((list) => (
            <Card key={list.id} className={cn(
              "transition-all duration-200",
              isSelected(list.id) && "border-blue-500 bg-blue-50",
              isExcluded(list.id) && "border-orange-500 bg-orange-50 opacity-75"
            )}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    {/* Selection Checkbox */}
                    <Checkbox
                      checked={isSelected(list.id)}
                      onCheckedChange={(checked: boolean) => handleListToggle(list.id, checked)}
                      disabled={isExcluded(list.id)}
                    />

                    {/* List Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{list.name}</h3>
                        <Badge variant="secondary">
                          {list.memberCount?.toLocaleString() || 0} contacts
                        </Badge>
                        {isExcluded(list.id) && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <UserMinus className="h-3 w-3" />
                            Excluded
                          </Badge>
                        )}
                      </div>
                      {list.description && (
                        <p className="text-sm text-gray-600">{list.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Created {new Date(list.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    {!isSelected(list.id) && !isExcluded(list.id) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExclusionToggle(list.id, true)}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Exclude
                      </Button>
                    )}
                    
                    {isSelected(list.id) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExclusionToggle(list.id, true)}
                      >
                        <UserMinus className="h-4 w-4 mr-1" />
                        Exclude
                      </Button>
                    )}
                    
                    {isExcluded(list.id) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExclusionToggle(list.id, false)}
                      >
                        Include
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
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
          <strong>Smart recipient management:</strong> The system automatically removes duplicate emails 
          and unsubscribed contacts. Excluding lists helps you suppress specific contacts from this campaign 
          without removing them from your main lists.
        </AlertDescription>
      </Alert>
    </div>
  )
}
