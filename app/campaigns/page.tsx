"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Plus, Search, Filter, MoreHorizontal, Edit, Copy, BarChart3, Trash2, Calendar, Send, Clock, CheckCircle, AlertCircle, PauseCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Campaign, CampaignStatus, CampaignFilters } from "@/types/campaign"
import { CampaignAccessControl } from "@/lib/rbac/campaign-access"

// Status badge colors
const statusColors = {
  DRAFT: "bg-gray-100 text-gray-800 border-gray-200",
  SCHEDULED: "bg-blue-100 text-blue-800 border-blue-200",
  SENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
  SENT: "bg-green-100 text-green-800 border-green-200",
  PAUSED: "bg-orange-100 text-orange-800 border-orange-200",
  CANCELLED: "bg-red-100 text-red-800 border-red-200"
}

const statusIcons = {
  DRAFT: Edit,
  SCHEDULED: Calendar,
  SENDING: Send,
  SENT: CheckCircle,
  PAUSED: PauseCircle,
  CANCELLED: XCircle
}

interface CampaignListResponse {
  campaigns: Campaign[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function CampaignsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<CampaignFilters>({
    page: 1,
    limit: 20
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // Check if user can create campaigns
  const canCreate = useMemo(() => {
    return session ? CampaignAccessControl.canCreateCampaign(session) : false
  }, [session])

  // Fetch campaigns
  const fetchCampaigns = useCallback(async () => {
    if (!session) return

    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: (filters.page || 1).toString(),
        limit: (filters.limit || 20).toString(),
        ...(filters.search && { search: filters.search }),
        ...(filters.status && filters.status !== 'all' && { status: filters.status as CampaignStatus }),
        ...(filters.dateRange && { 
          dateRange: JSON.stringify(filters.dateRange) 
        }),
        ...(filters.tags && filters.tags.length > 0 && { 
          tags: filters.tags.join(',') 
        }),
        ...(filters.creator && { creator: filters.creator })
      })

      const response = await fetch(`/api/campaigns?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch campaigns')
      }

      const payload = await response.json()
      const data = payload.data || payload
      setCampaigns(data.campaigns || [])
      setPagination(data.pagination)
    } catch (error) {
      console.error('Error fetching campaigns:', error)
      toast.error('Failed to load campaigns')
    } finally {
      setLoading(false)
    }
  }, [session, filters])

  // Initial load
  useEffect(() => {
    if (status === 'authenticated') {
      fetchCampaigns()
    }
  }, [status, fetchCampaigns])

  // Handle filter changes with debouncing
  const debouncedFetch = useMemo(() => {
    const timer = setTimeout(() => {
      fetchCampaigns()
    }, 300)
    return () => clearTimeout(timer)
  }, [fetchCampaigns])

  useEffect(() => {
    debouncedFetch()
    return debouncedFetch
  }, [debouncedFetch])

  // Check permissions for individual campaigns
  const canEditCampaign = useCallback((campaign: Campaign) => {
    return session ? CampaignAccessControl.canEditCampaign(session, campaign) : false
  }, [session])

  const canDeleteCampaign = useCallback((campaign: Campaign) => {
    return session ? CampaignAccessControl.canDeleteCampaign(session, campaign) : false
  }, [session])

  const canDuplicateCampaign = useCallback((campaign: Campaign) => {
    return session ? CampaignAccessControl.canDuplicateCampaign(session, campaign) : false
  }, [session])

  const canViewAnalytics = useCallback((campaign: Campaign) => {
    return session ? CampaignAccessControl.canViewAnalytics(session, campaign) : false
  }, [session])

  // Handle actions
  const handleEdit = useCallback((campaignId: string) => {
    router.push(`/campaigns/${campaignId}/edit`)
  }, [router])

  const handleDuplicate = useCallback(async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/duplicate`, {
        method: 'POST'
      })
      
      if (!response.ok) {
        throw new Error('Failed to duplicate campaign')
      }

      toast.success('Campaign duplicated successfully')
      fetchCampaigns()
    } catch (error) {
      console.error('Error duplicating campaign:', error)
      toast.error('Failed to duplicate campaign')
    }
  }, [fetchCampaigns])

  const handleDelete = useCallback(async (campaignId: string, campaignName: string) => {
    if (!confirm(`Are you sure you want to delete "${campaignName}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete campaign')
      }

      toast.success('Campaign deleted successfully')
      fetchCampaigns()
    } catch (error) {
      console.error('Error deleting campaign:', error)
      toast.error('Failed to delete campaign')
    }
  }, [fetchCampaigns])

  const handleViewReport = useCallback((campaignId: string) => {
    router.push(`/campaigns/${campaignId}/report`)
  }, [router])

  // Memoized campaign list
  const campaignList = useMemo(() => {
    if (!Array.isArray(campaigns)) return []
    return campaigns
  }, [campaigns])

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-4"></div>
          <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/auth/signin')
    return null
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-1">
            Manage your email marketing campaigns
          </p>
        </div>
        
        {canCreate && (
          <Button
            onClick={() => router.push('/campaigns/new')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Campaign
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search campaigns..."
                  value={filters.search || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="w-full lg:w-48">
              <Select
                value={filters.status || ''}
                onValueChange={(value) => setFilters(prev => ({ 
                  ...prev, 
                  status: value as CampaignStatus || undefined, 
                  page: 1 
                }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="DRAFT">Draft</SelectItem>
                  <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                  <SelectItem value="SENDING">Sending</SelectItem>
                  <SelectItem value="SENT">Sent</SelectItem>
                  <SelectItem value="PAUSED">Paused</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Campaigns ({pagination.total})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaignList.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Send className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No campaigns found
              </h3>
              <p className="text-gray-600 mb-6">
                {filters.search || filters.status 
                  ? 'Try adjusting your filters to see more campaigns.'
                  : 'Get started by creating your first email campaign.'
                }
              </p>
              {canCreate && !filters.search && !filters.status && (
                <Button onClick={() => router.push('/campaigns/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Campaign
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Campaign Name
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Recipients
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Send Date
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Open Rate
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Click Rate
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Created By
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Updated
                    </th>
                    <th className="text-right py-3 px-4 font-medium text-gray-900">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {campaignList.map((campaign) => {
                    const StatusIcon = statusIcons[campaign.status]
                    return (
                      <tr key={campaign.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">
                              {campaign.name}
                            </div>
                            <div className="text-sm text-gray-600">
                              {campaign.subject}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge 
                            className={`flex items-center gap-1 w-fit ${statusColors[campaign.status]}`}
                          >
                            <StatusIcon className="h-3 w-3" />
                            {campaign.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-900">
                          {campaign.recipientCount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 text-gray-900">
                          {campaign.sentAt 
                            ? new Date(campaign.sentAt).toLocaleDateString()
                            : campaign.scheduledAt
                            ? new Date(campaign.scheduledAt).toLocaleDateString()
                            : '-'
                          }
                        </td>
                        <td className="py-3 px-4 text-gray-900">
                          {campaign.openRate ? `${(campaign.openRate * 100).toFixed(1)}%` : '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-900">
                          {campaign.clickRate ? `${(campaign.clickRate * 100).toFixed(1)}%` : '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-900">
                          {campaign.user?.name || '-'}
                        </td>
                        <td className="py-3 px-4 text-gray-900">
                          {new Date(campaign.updatedAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-end gap-2">
                            {canViewAnalytics(campaign) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewReport(campaign.id)}
                                className="h-8 w-8 p-0"
                              >
                                <BarChart3 className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canEditCampaign(campaign) && (
                                  <DropdownMenuItem onClick={() => handleEdit(campaign.id)}>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                
                                {canDuplicateCampaign(campaign) && (
                                  <DropdownMenuItem onClick={() => handleDuplicate(campaign.id)}>
                                    <Copy className="h-4 w-4 mr-2" />
                                    Duplicate
                                  </DropdownMenuItem>
                                )}
                                
                                {canDeleteCampaign(campaign) && (
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(campaign.id, campaign.name)}
                                    className="text-red-600"
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-6 border-t">
              <div className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} campaigns
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) - 1 }))}
                  disabled={pagination.page === 1}
                >
                  Previous
                </Button>
                
                <span className="text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, page: (prev.page || 1) + 1 }))}
                  disabled={pagination.page === pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
