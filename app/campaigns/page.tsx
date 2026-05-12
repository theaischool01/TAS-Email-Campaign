"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Copy, 
  Send, 
  BarChart3, 
  Clock,
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle2,
  XCircle,
  PauseCircle,
  PlayCircle,
  FileText
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { format } from "date-fns"

export default function CampaignsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ total: 0, pages: 0 })
  const [filters, setFilters] = useState({
    search: "",
    status: "ALL",
    startDate: "",
    endDate: "",
    tags: "",
    page: 1
  })

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const query = new URLSearchParams()
      if (filters.search) query.append("search", filters.search)
      if (filters.status !== "ALL") query.append("status", filters.status)
      if (filters.startDate) {
        const dateRange = { start: new Date(filters.startDate).toISOString(), end: new Date(filters.endDate || new Date()).toISOString() }
        query.append("dateRange", JSON.stringify(dateRange))
      }
      if (filters.tags) query.append("tags", filters.tags)
      query.append("page", filters.page.toString())
      
      const response = await fetch(`/api/campaigns?${query.toString()}`)
      if (response.ok) {
        const payload = await response.json()
        setCampaigns(payload.data.campaigns)
        setPagination(payload.data.pagination)
      }
    } catch (error) {
      toast.error("Failed to load campaigns")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [filters])

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this campaign?")) return
    
    try {
      const response = await fetch(`/api/campaigns/${id}`, { method: "DELETE" })
      if (response.ok) {
        toast.success("Campaign deleted")
        fetchCampaigns()
      } else {
        const err = await response.json()
        toast.error(err.error || "Failed to delete")
      }
    } catch (error) {
      toast.error("An error occurred")
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const response = await fetch(`/api/campaigns/${id}/duplicate`, { method: "POST" })
      if (response.ok) {
        toast.success("Campaign duplicated")
        fetchCampaigns()
      }
    } catch (error) {
      toast.error("Failed to duplicate")
    }
  }

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'DRAFT': return 'bg-gray-100 text-gray-800 border-gray-200'
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'SENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'SENT': return 'bg-green-100 text-green-800 border-green-200'
      case 'PAUSED': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200'
      case 'FAILED': return 'bg-destructive/10 text-destructive border-destructive/20'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const isViewer = session?.user?.role === 'VIEWER'

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            {isViewer ? "View and track email marketing performance" : "Manage and track your email marketing campaigns"}
          </p>
        </div>
        {!isViewer && (
          <Button onClick={() => router.push('/campaigns/new')} className="w-full md:w-auto">
            <Plus className="h-4 w-4 mr-2" /> New Campaign
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative col-span-1 lg:col-span-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search campaigns by name or subject..."
                  className="pl-9"
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                />
              </div>
              <div>
                <Select 
                  value={filters.status} 
                  onValueChange={(v) => setFilters(prev => ({ ...prev, status: v, page: 1 }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Status</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                    <SelectItem value="SENT">Sent</SelectItem>
                    <SelectItem value="PAUSED">Paused</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    <SelectItem value="FAILED">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">From</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    className="pl-9"
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value, page: 1 }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">To</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="date"
                    className="pl-9"
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value, page: 1 }))}
                  />
                </div>
              </div>
              <div className="space-y-1.5 col-span-1 lg:col-span-2">
                <label className="text-xs font-medium text-muted-foreground">Tags</label>
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Filter by tags (comma separated)"
                    className="pl-9"
                    value={filters.tags}
                    onChange={(e) => setFilters(prev => ({ ...prev, tags: e.target.value, page: 1 }))}
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/30">
                  <th className="py-4 px-4 font-semibold text-sm">Campaign Name</th>
                  <th className="py-4 px-4 font-semibold text-sm text-center">Status</th>
                  <th className="py-4 px-4 font-semibold text-sm text-center">Recipients</th>
                  <th className="py-4 px-4 font-semibold text-sm text-center">Date</th>
                  <th className="py-4 px-4 font-semibold text-sm text-center">Open Rate</th>
                  <th className="py-4 px-4 font-semibold text-sm text-center">Click Rate</th>
                  <th className="py-4 px-4 font-semibold text-sm text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      <Clock className="h-6 w-6 animate-spin mx-auto mb-2" />
                      Loading campaigns...
                    </td>
                  </tr>
                ) : campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      {isViewer ? "No campaigns available for review" : "No campaigns found matching your filters."}
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign) => {
                    const openRate = campaign.recipientCount > 0 
                      ? (campaign.totalOpened / campaign.recipientCount) * 100 
                      : 0;
                    const clickRate = campaign.recipientCount > 0 
                      ? (campaign.totalClicked / campaign.recipientCount) * 100 
                      : 0;
                      
                    return (
                      <tr key={campaign.id} className="border-b hover:bg-muted/10 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-bold text-sm">{campaign.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate max-w-[200px]">{campaign.subject}</div>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <Badge className={`text-[10px] uppercase font-bold px-2 py-0 h-5 ${getStatusBadgeColor(campaign.status)}`}>
                              {campaign.status}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center text-sm">
                          {campaign.recipientCount?.toLocaleString() || '0'}
                        </td>
                        <td className="py-4 px-4 text-center text-sm whitespace-nowrap">
                          {campaign.sentAt 
                            ? format(new Date(campaign.sentAt), 'PP')
                            : campaign.scheduledAt
                            ? format(new Date(campaign.scheduledAt), 'Pp')
                            : '-'
                          }
                        </td>
                        <td className="py-4 px-4 text-center text-sm font-medium">
                          {campaign.status === 'SENT' || campaign.totalOpened > 0 ? (
                            <span className={openRate > 0 ? 'text-blue-600' : 'text-muted-foreground'}>
                              {openRate.toFixed(1)}%
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-4 px-4 text-center text-sm font-medium">
                          {campaign.status === 'SENT' || campaign.totalClicked > 0 ? (
                            <span className={clickRate > 0 ? 'text-green-600' : 'text-muted-foreground'}>
                              {clickRate.toFixed(1)}%
                            </span>
                          ) : '-'}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs font-bold"
                              onClick={() => router.push(`/campaigns/${campaign.id}/report`)}
                              disabled={campaign.status === 'DRAFT'}
                            >
                              <BarChart3 className="h-4 w-4 mr-2" />
                              View Report
                            </Button>
                            
                            {!isViewer && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  {['SCHEDULED', 'SENDING', 'PAUSED'].includes(campaign.status) && (
                                    <DropdownMenuItem onClick={() => router.push(`/campaigns/${campaign.id}/status`)}>
                                      <Clock className="h-4 w-4 mr-2 text-blue-600" />
                                      Manage Status
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => router.push(`/campaigns/${campaign.id}/edit`)}>
                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDuplicate(campaign.id)}>
                                    <Copy className="h-4 w-4 mr-2" /> Duplicate
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem 
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => handleDelete(campaign.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
