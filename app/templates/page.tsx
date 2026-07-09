"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { 
  Search, 
  Plus, 
  Filter, 
  Grid, 
  List, 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Copy, 
  Trash2,
  FileText,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { EmailTemplate } from "@/types/template"
import { formatUserName } from "@/lib/role-helpers"

// Curated order of template categories with descriptive taglines
const CATEGORY_METADATA: { [key: string]: { title: string; tagline: string } } = {
  "Welcome & Onboarding": {
    title: "Welcome & Onboarding",
    tagline: "First impressions count. Onboard new users and build early engagement."
  },
  "Marketing & Promotions": {
    title: "Marketing & Promotions",
    tagline: "Boost conversions and drive revenue with high-impact sales and product announcements."
  },
  "E-commerce Customer Journey": {
    title: "E-commerce",
    tagline: "Transactional notifications, confirmations, and cart recovery workflows."
  },
  "Newsletter & Content": {
    title: "Newsletters",
    tagline: "Keep your audience informed with monthly roundups, articles, and updates."
  },
  "Events & Community": {
    title: "Events & Community",
    tagline: "Invite subscribers to webinars, schedule reminders, and celebrate together."
  },
  "Business & Professional": {
    title: "Business",
    tagline: "Professional pitches, follow-ups, and meeting proposals."
  },
  "Customer Success & Retention": {
    title: "Customer Success",
    tagline: "NPS surveys, customer feedback loops, and plan upgrade offers."
  },
  "SaaS & Technology": {
    title: "Product Updates & Tech",
    tagline: "Service releases, maintenance updates, and platform release notes."
  },
  "Birthday & Personal Occasions": {
    title: "Seasonal & Holidays",
    tagline: "Celebrate milestones, birthdays, and seasonal holidays with personalized wishes."
  }
}

// Memoized Search Input Component
const SearchInput = React.memo<{
  value: string
  onChange: (value: string) => void
}>(({ value, onChange }) => {
  console.log("SearchInput render")
  return (
    <div className="flex-1 relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 text-gray-400 transform -translate-y-1/2" />
      <Input
        placeholder="Search templates..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500"
      />
    </div>
  )
})

SearchInput.displayName = "SearchInput"

// Reusable Template Card Component
const TemplateCard = React.memo<{
  template: any
  viewMode: "grid" | "list"
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  session: any
}>(({ template, viewMode, onDuplicate, onDelete, session }) => {
  const canDelete = template.createdBy === session?.user?.id && !template.isSystem

  return (
    <Card key={template.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer border border-gray-200 overflow-hidden flex flex-col h-full bg-white dark:bg-slate-900 dark:border-slate-800 rounded-xl">
      {/* Visual Preview Section */}
      <div className="relative h-48 w-full bg-slate-50 overflow-hidden border-b">
        {/* Category Badge overlay */}
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-white/95 text-blue-600 hover:bg-white backdrop-blur shadow-sm border-none font-bold text-[9px] uppercase tracking-wider px-2 py-0.5">
            {template.category || 'General'}
          </Badge>
        </div>
        
        {/* Type Badge overlay */}
        <div className="absolute top-3 right-3 z-10">
          {template.isSystem ? (
            <Badge variant="outline" className="bg-white/95 text-slate-700 border-slate-300 hover:bg-white backdrop-blur shadow-sm font-bold text-[9px] uppercase tracking-wider px-2 py-0.5">
              System
            </Badge>
          ) : template.systemTemplateId ? (
            <Badge className="bg-blue-600/90 text-white hover:bg-blue-600 backdrop-blur shadow-sm border-none font-bold text-[9px] uppercase tracking-wider px-2 py-0.5">
              Customized
            </Badge>
          ) : (
            <Badge className="bg-emerald-600/90 text-white hover:bg-emerald-600 backdrop-blur shadow-sm border-none font-bold text-[9px] uppercase tracking-wider px-2 py-0.5">
              My Template
            </Badge>
          )}
        </div>
        
        {/* Miniature Live Preview via Iframe */}
        <div className="absolute inset-0 pointer-events-none transform origin-top-left scale-[0.4] w-[250%] h-[250%] p-2">
          <iframe 
            sandbox="allow-same-origin"
            srcDoc={`<style>body{zoom:0.8; overflow:hidden;}</style>${template.html}`} 
            title={template.name}
            className="w-full h-full border-none pointer-events-none bg-white"
            scrolling="no"
          />
        </div>
        
        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <Link href={`/templates/preview/${template.id}`}>
            <Button variant="secondary" size="sm" className="font-semibold shadow-sm hover:scale-105 transition-transform">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </Link>
          <Link href={`/templates/editor/${template.id}`}>
            <Button size="sm" className="font-semibold shadow-sm hover:scale-105 transition-transform dark:bg-blue-600 dark:hover:bg-blue-700">
              <Edit className="h-4 w-4 mr-2" />
              {template.isSystem ? "Use Template" : "Edit"}
            </Button>
          </Link>
        </div>
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-bold truncate text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
              {template.name}
            </CardTitle>
            <p className="text-[11px] text-gray-500 mt-1 dark:text-slate-500">
              Updated {new Date(template.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-900">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onDuplicate(template.id)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {canDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(template.id)}
                  className="text-red-600 focus:text-red-700 focus:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 mt-auto dark:bg-slate-900">
        <div className="flex items-center gap-2 text-[10px] text-gray-400 dark:text-slate-400 font-medium">
          <div className={`h-1.5 w-1.5 rounded-full ${template.isSystem ? 'bg-blue-500' : 'bg-green-500'}`}></div>
          Created by {template.user?.name || 'System'}
        </div>
      </CardContent>
    </Card>
  )
})

TemplateCard.displayName = "TemplateCard"

// Show More / Less Trigger Button
const ShowMoreButton = React.memo<{
  isExpanded: boolean
  onClick: () => void
  count: number
}>(({ isExpanded, onClick, count }) => {
  return (
    <div className="flex justify-center mt-6">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={onClick}
        className="px-6 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors shadow-sm gap-2"
      >
        {isExpanded ? (
          <>
            Show Less <ChevronUp className="h-4 w-4" />
          </>
        ) : (
          <>
            Show More ({count}) <ChevronDown className="h-4 w-4" />
          </>
        )}
      </Button>
    </div>
  )
})

ShowMoreButton.displayName = "ShowMoreButton"

// Category Group component for rendering expandable grid sets
const CategorySection = React.memo<{
  categoryName: string
  templates: any[]
  viewMode: "grid" | "list"
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  session: any
}>(({ categoryName, templates, viewMode, onDuplicate, onDelete, session }) => {
  const [expanded, setExpanded] = useState(false)
  const meta = CATEGORY_METADATA[categoryName] || { 
    title: categoryName, 
    tagline: `Explore our premium layout options in the ${categoryName} category.` 
  }

  // Show first 4 templates initially, rest are lazy-rendered on expand
  const visibleTemplates = useMemo(() => {
    if (expanded) return templates
    return templates.slice(0, 4)
  }, [templates, expanded])

  return (
    <div className="border-b border-slate-100 last:border-0 pb-10 mb-10 transition-all duration-300">
      {/* Category Heading & Description */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight">{meta.title}</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">{meta.tagline}</p>
      </div>

      {/* Grid container */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {visibleTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              viewMode="grid"
              onDuplicate={onDuplicate}
              onDelete={onDelete}
              session={session}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {visibleTemplates.map((template) => {
            const canDelete = template.createdBy === session?.user?.id && !(template as any).isSystem
            return (
              <Card key={template.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.01] border border-gray-200 dark:bg-slate-900 dark:border-slate-800">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold dark:text-white">{template.name}</h3>
                        {template.isSystem ? (
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 font-bold text-[9px] uppercase">
                            System
                          </Badge>
                        ) : template.systemTemplateId ? (
                          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold text-[9px] uppercase">
                            Customized
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-bold text-[9px] uppercase">
                            My Template
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        {template.category && (
                          <Badge variant="secondary">{template.category}</Badge>
                        )}
                        <span>Created by: {formatUserName(template.user || { name: 'Unknown', email: '' })}</span>
                        <span>Updated: {new Date(template.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/templates/preview/${template.id}`}>
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4 mr-2" />
                            Preview
                          </DropdownMenuItem>
                        </Link>
                        <Link href={`/templates/editor/${template.id}`}>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4 mr-2" />
                            {template.isSystem ? "Use Template" : "Edit"}
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem onClick={() => onDuplicate(template.id)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        {canDelete && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              onClick={() => onDelete(template.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Show More toggle trigger */}
      {templates.length > 4 && (
        <ShowMoreButton 
          isExpanded={expanded} 
          onClick={() => setExpanded(!expanded)} 
          count={templates.length - 4}
        />
      )}
    </div>
  )
})

CategorySection.displayName = "CategorySection"

export default function TemplatesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [activeTab, setActiveTab] = useState<"default" | "user">("default")

  const canCreate = true

  const fetchTemplates = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/templates')
      if (response.ok) {
        const payload = await response.json()
        const templates = 
          payload.templates || 
          payload.data || 
          []
        
        setTemplates(Array.isArray(templates) ? templates : [])
      } else {
        console.error("Failed to fetch templates:", response.statusText)
      }
    } catch (error) {
      console.error("Error fetching templates:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (status === "authenticated") {
      fetchTemplates()
    } else if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, fetchTemplates, router])

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}/duplicate`, {
        method: "POST"
      })
      if (response.ok) {
        fetchTemplates()
      }
    } catch (error) {
      console.error("Failed to duplicate template:", error)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return
    }

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE"
      })
      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== templateId))
      }
    } catch (error) {
      console.error("Failed to delete template:", error)
    }
  }

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  // Segment templates based on active tab
  const tabTemplates = useMemo(() => {
    return templates.filter(template => {
      if (activeTab === "default") {
        return template.isSystem === true
      } else {
        return template.isSystem === false
      }
    })
  }, [templates, activeTab])

  // Filter templates based on Search and Selected Category Filters
  const filteredTemplates = useMemo(() => {
    return tabTemplates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = !selectedCategory || template.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [tabTemplates, searchTerm, selectedCategory])

  // Sort user templates chronologically by updatedAt
  const userTemplatesSorted = useMemo(() => {
    if (activeTab !== "user") return []
    return [...filteredTemplates].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [filteredTemplates, activeTab])

  // Categorized templates structure generated dynamically
  const categorizedGroups = useMemo(() => {
    const groups: { [key: string]: EmailTemplate[] } = {}
    
    filteredTemplates.forEach(tpl => {
      const category = tpl.category || "Miscellaneous"
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(tpl)
    })

    return groups
  }, [filteredTemplates])

  // Get active category names sorted by template count density, then alphabetically
  const activeCategories = useMemo(() => {
    return Object.keys(categorizedGroups).sort((a, b) => {
      const countA = categorizedGroups[a].length
      const countB = categorizedGroups[b].length
      if (countB !== countA) {
        return countB - countA
      }
      return a.localeCompare(b)
    })
  }, [categorizedGroups])

  // Get unique categories list for filter dropdown
  const uniqueCategories = useMemo(() => {
    const cats = tabTemplates.map(t => t.category).filter((c): c is string => !!c)
    return Array.from(new Set(cats)).sort((a, b) => a.localeCompare(b))
  }, [tabTemplates])

  if (!session) {
    return null
  }

  const isSearching = searchTerm.trim() !== ""

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight dark:text-white">Email Templates</h1>
          <p className="text-muted-foreground mt-1 dark:text-slate-400">Choose a default system design or edit your saved workspace layouts</p>
        </div>
        {canCreate && (
          <Link href="/templates/new">
            <Button className="w-full md:w-auto dark:bg-blue-600 dark:text-white dark:hover:bg-blue-700 dark:border-0 shadow-sm font-semibold">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </Link>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-slate-800 mb-8">
        <div className="flex gap-6">
          <button
            onClick={() => {
              setActiveTab("default")
              setSelectedCategory("")
            }}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "default"
                ? "border-blue-600 text-blue-600 dark:text-blue-500"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            Default Templates
          </button>
          <button
            onClick={() => {
              setActiveTab("user")
              setSelectedCategory("")
            }}
            className={`pb-4 text-sm font-semibold border-b-2 transition-all ${
              activeTab === "user"
                ? "border-blue-600 text-blue-600 dark:text-blue-500"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
            }`}
          >
            My Templates
          </button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <SearchInput value={searchTerm} onChange={handleSearchChange} />
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 font-semibold shadow-sm">
                <Filter className="h-4 w-4" />
                {selectedCategory || "All Categories"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setSelectedCategory("")}>
                All Categories
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {uniqueCategories.map(category => (
                <DropdownMenuItem 
                  key={category} 
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="border border-slate-200 rounded-lg p-0.5 flex bg-slate-50 dark:border-slate-700 dark:bg-slate-900 shadow-sm">
            <Button 
              variant={viewMode === "grid" ? "secondary" : "ghost"} 
              size="icon" 
              className="h-8 w-8 p-0 dark:text-slate-400 dark:hover:bg-slate-800"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "secondary" : "ghost"} 
              size="icon" 
              className="h-8 w-8 p-0 dark:text-slate-400 dark:hover:bg-slate-800"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <Card key={n} className="animate-pulse rounded-xl border border-slate-100">
              <div className="h-48 bg-slate-100" />
              <CardHeader className="p-4">
                <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
          <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No templates found</h3>
          <p className="text-slate-500 mb-6 text-sm">
            {searchTerm || selectedCategory 
              ? "Try adjusting your search filters" 
              : "Get started by creating your first email template."
            }
          </p>
          {!searchTerm && !selectedCategory && canCreate && (
            <Link href="/templates/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Template
              </Button>
            </Link>
          )}
        </div>
      ) : isSearching ? (
        // Searching: Show flat grid list
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                viewMode="grid"
                onDuplicate={handleDuplicateTemplate}
                onDelete={handleDeleteTemplate}
                session={session}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {filteredTemplates.map((template) => {
              const canDelete = template.createdBy === session?.user?.id && !(template as any).isSystem
              return (
                <Card key={template.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.01] border border-gray-200 dark:bg-slate-900 dark:border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold dark:text-white">{template.name}</h3>
                          {template.isSystem ? (
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 font-bold text-[9px] uppercase">
                              System
                            </Badge>
                          ) : template.systemTemplateId ? (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold text-[9px] uppercase">
                              Customized
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-bold text-[9px] uppercase">
                              My Template
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600">
                          {template.category && (
                            <Badge variant="secondary">{template.category}</Badge>
                          )}
                          <span>Created by: {formatUserName(template.user || { name: 'Unknown', email: '' })}</span>
                          <span>Updated: {new Date(template.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/templates/preview/${template.id}`}>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/templates/editor/${template.id}`}>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              {template.isSystem ? "Use Template" : "Edit"}
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem onClick={() => handleDuplicateTemplate(template.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )
      ) : activeTab === "default" ? (
        // Standard View for Default templates: Show dynamically grouped categories
        <div className="space-y-6">
          {activeCategories.map(catKey => {
            const list = categorizedGroups[catKey] || []
            if (list.length === 0) return null
            return (
              <CategorySection
                key={catKey}
                categoryName={catKey}
                templates={list}
                viewMode={viewMode}
                onDuplicate={handleDuplicateTemplate}
                onDelete={handleDeleteTemplate}
                session={session}
              />
            )
          })}
        </div>
      ) : (
        // Standard View for My templates: Show flat chronological list
        viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 animate-fade-in">
            {userTemplatesSorted.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                viewMode="grid"
                onDuplicate={handleDuplicateTemplate}
                onDelete={handleDeleteTemplate}
                session={session}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4 animate-fade-in">
            {userTemplatesSorted.map((template) => {
              const canDelete = template.createdBy === session?.user?.id && !(template as any).isSystem
              return (
                <Card key={template.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.01] border border-gray-200 dark:bg-slate-900 dark:border-slate-800">
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold dark:text-white">{template.name}</h3>
                          {template.isSystem ? (
                            <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 font-bold text-[9px] uppercase">
                              System
                            </Badge>
                          ) : template.systemTemplateId ? (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none font-bold text-[9px] uppercase">
                              Customized
                            </Badge>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none font-bold text-[9px] uppercase">
                              My Template
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-gray-600">
                          {template.category && (
                            <Badge variant="secondary">{template.category}</Badge>
                          )}
                          <span>Created by: {formatUserName(template.user || { name: 'Unknown', email: '' })}</span>
                          <span>Updated: {new Date(template.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <Link href={`/templates/preview/${template.id}`}>
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Preview
                            </DropdownMenuItem>
                          </Link>
                          <Link href={`/templates/editor/${template.id}`}>
                            <DropdownMenuItem>
                              <Edit className="h-4 w-4 mr-2" />
                              {template.isSystem ? "Use Template" : "Edit"}
                            </DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem onClick={() => handleDuplicateTemplate(template.id)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Duplicate
                          </DropdownMenuItem>
                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDeleteTemplate(template.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )
      )}
    </DashboardLayout>
  )
}
