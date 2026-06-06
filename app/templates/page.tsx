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
  FileText
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
        className="pl-10"
      />
    </div>
  )
})

SearchInput.displayName = "SearchInput"

// Memoized Template Card Component
const TemplateCard = React.memo<{
  template: any
  viewMode: "grid" | "list"
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  session: any
}>(({ template, viewMode, onDuplicate, onDelete, session }) => {
  const canDelete = template.createdBy === session?.user?.id && !template.isSystem

  return (
    <Card key={template.id} className="group hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 overflow-hidden flex flex-col h-full bg-white">
      {/* Visual Preview Section - Increased height and improved scaling */}
      <div className="relative h-64 w-full bg-slate-50 overflow-hidden border-b">
        {/* Category Badge overlay */}
        <div className="absolute top-3 left-3 z-10">
          <Badge className="bg-white/90 text-blue-600 hover:bg-white backdrop-blur shadow-sm border-none font-bold text-[10px] uppercase">
            {template.category || 'General'}
          </Badge>
        </div>
        
        {/* Type Badge overlay */}
        <div className="absolute top-3 right-3 z-10">
          {template.isSystem ? (
            <Badge variant="outline" className="bg-white/95 text-slate-700 border-slate-300 hover:bg-white backdrop-blur shadow-sm font-bold text-[10px] uppercase">
              Default Template
            </Badge>
          ) : template.systemTemplateId ? (
            <Badge className="bg-blue-600/90 text-white hover:bg-blue-600 backdrop-blur shadow-sm border-none font-bold text-[10px] uppercase">
              Customized
            </Badge>
          ) : (
            <Badge className="bg-emerald-600/90 text-white hover:bg-emerald-600 backdrop-blur shadow-sm border-none font-bold text-[10px] uppercase">
              My Template
            </Badge>
          )}
        </div>
        
        {/* Miniature Live Preview via Iframe - Adjusted for full height visibility */}
        <div className="absolute inset-0 pointer-events-none transform origin-top-left scale-[0.4] w-[250%] h-[250%] p-2">
          <iframe 
            srcDoc={`<style>body{zoom:0.8; overflow:hidden;}</style>${template.html}`} 
            title={template.name}
            className="w-full h-full border-none pointer-events-none bg-white shadow-sm"
            scrolling="no"
          />
        </div>
        
        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-3">
          <Link href={`/templates/preview/${template.id}`}>
            <Button variant="secondary" size="sm" className="font-semibold">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </Link>
          <Link href={`/templates/editor/${template.id}`}>
            <Button size="sm" className="font-semibold">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-bold truncate text-gray-900 group-hover:text-blue-600 transition-colors">
              {template.name}
            </CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Updated {new Date(template.updatedAt).toLocaleDateString()}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-gray-900">
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
      
      <CardContent className="p-4 pt-0 mt-auto">
        <div className="flex items-center gap-2 text-[11px] text-gray-400 font-medium">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
          Created by {template.user?.name || 'System'}
        </div>
      </CardContent>
    </Card>
  )
})

TemplateCard.displayName = "TemplateCard"

export default function TemplatesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

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
        
        console.log("📋 Frontend Debug - Templates received:", templates.length)
        console.log("📋 Frontend Debug - Template list:", templates.map((t: any) => ({ id: t.id, name: t.name, category: t.category })))
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

  // Initial load only
  useEffect(() => {
    fetchTemplates()
  }, [])

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

  // Filter templates
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = !selectedCategory || template.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [templates, searchTerm, selectedCategory])

  // Get unique categories
  const categories = useMemo(() => {
    const cats = templates.map(t => t.category).filter((c): c is string => !!c)
    return Array.from(new Set(cats))
  }, [templates])

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value)
  }, [])

  if (!session) {
    return null
  }

  return (
    <DashboardLayout>
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
          <p className="text-muted-foreground mt-1">Create and manage your email template library</p>
        </div>
        {canCreate && (
          <Link href="/templates/new">
            <Button className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              New Template
            </Button>
          </Link>
        )}
      </div>

      {/* Filters and Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <SearchInput value={searchTerm} onChange={handleSearchChange} />
        
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {selectedCategory || "All Categories"}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setSelectedCategory("")}>
                All Categories
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {categories.map(category => (
                <DropdownMenuItem 
                  key={category} 
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="border border-slate-200 rounded-lg p-0.5 flex bg-slate-50">
            <Button 
              variant={viewMode === "grid" ? "secondary" : "ghost"} 
              size="icon" 
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("grid")}
            >
              <Grid className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "secondary" : "ghost"} 
              size="icon" 
              className="h-8 w-8 p-0"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <Card key={n} className="animate-pulse">
              <div className="h-48 bg-slate-100" />
              <CardHeader className="p-4">
                <div className="h-4 bg-slate-200 rounded w-2/3 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/2" />
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50/50">
          <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No templates found</h3>
          <p className="text-slate-500 mb-6">
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
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
        <div className="space-y-4">
          {filteredTemplates.map((template) => {
            const canDelete = template.createdBy === session?.user?.id && !(template as any).isSystem
            return (
              <Card key={template.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.01] border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold">{template.name}</h3>
                        {template.isSystem ? (
                          <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 font-bold text-[9px] uppercase">
                            Default Template
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
                            Edit
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
      )}
    </DashboardLayout>
  )
}
