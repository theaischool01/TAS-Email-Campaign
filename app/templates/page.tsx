"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"

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
  isAdmin: boolean
  isManager: boolean
  session: any
}>(({ template, viewMode, onDuplicate, onDelete, isAdmin, isManager, session }) => {
  return (
    <Card key={template.id} className="hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-[1.02] border border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold truncate text-gray-900">{template.name}</CardTitle>
            {template.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.description}</p>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/templates/editor/${template.id}`}>
                <DropdownMenuItem>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem onClick={() => onDuplicate(template.id)}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {(isAdmin || (isManager && template.createdBy === session?.user?.id)) && (
                <DropdownMenuItem 
                  onClick={() => onDelete(template.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent>
        {/* Template Preview */}
        <div className="h-32 bg-gray-50 rounded-lg mb-3 flex items-center justify-center border">
          <div className="text-gray-400 text-sm">Preview</div>
        </div>
        
        {/* Template Info */}
        <div className="space-y-2 text-sm text-gray-600">
          <div>Created by: {template.user?.name || 'Unknown'}</div>
          <div>Updated: {new Date(template.updatedAt).toLocaleDateString()}</div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Link href={`/templates/preview/${template.id}`}>
            <Button variant="outline" size="sm" className="flex-1">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          </Link>
          <Link href={`/templates/editor/${template.id}`}>
            <Button size="sm" className="flex-1">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
})

TemplateCard.displayName = "TemplateCard"

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
  Edit,
  Trash2,
  Copy,
  Eye
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { EmailTemplate } from "@/types/template"
import { formatUserName } from "@/lib/role-helpers"

export default function TemplatesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [selectedCategory, setSelectedCategory] = useState("")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  const isAdmin = session?.user?.role === "SUPER_ADMIN"
  const isManager = session?.user?.role === "CAMPAIGN_MANAGER"
  const canCreate = isAdmin || isManager

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
  }, [fetchTemplates])

  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    if (!confirm("Are you sure you want to delete this template?")) {
      return
    }

    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE"
      })
      
      if (response.ok) {
        setTemplates(templates.filter(t => t.id !== templateId))
      }
    } catch (error) {
      console.error("Error deleting template:", error)
    }
  }, [templates])

  const handleDuplicateTemplate = (templateId: string) => {
    router.push(`/templates/duplicate/${templateId}`)
  }

  // Memoized filtered templates to prevent unnecessary rerenders
  const filteredTemplates = useMemo(() => {
    if (!searchTerm && !selectedCategory) return templates
    
    return templates.filter(template => {
      const matchesSearch = !searchTerm || 
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase()))
      
      const matchesCategory = !selectedCategory || template.category === selectedCategory
      
      return matchesSearch && matchesCategory
    })
  }, [templates, searchTerm, selectedCategory])

  const categories = useMemo(() => 
    Array.from(new Set(templates.map(t => t.category).filter(Boolean))),
    [templates]
  )

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 h-10 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-32 bg-gray-200 rounded-t-lg"></div>
              <CardContent className="p-4">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="flex gap-2 mt-4">
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                  <div className="h-8 bg-gray-200 rounded flex-1"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Templates</h1>
          <p className="text-gray-600">Create and manage your email templates</p>
        </div>
        {canCreate && (
          <Link href="/templates/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </Link>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchInput
          value={searchTerm}
          onChange={setSearchTerm}
        />
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((category: string | null | undefined) => (
            <option key={category || 'unknown'} value={category || ''}>
              {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Unknown'}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <Button
            variant={viewMode === "grid" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("grid")}
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Templates Grid/List */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500 mb-4">
            {searchTerm || selectedCategory 
              ? "No templates found matching your criteria" 
              : "No templates yet"}
          </div>
          {canCreate && (
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
              isAdmin={isAdmin}
              isManager={isManager}
              session={session}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTemplates.map((template) => (
            <Card key={template.id} className="hover:shadow-lg transition-all duration-200 hover:scale-[1.01] border border-gray-200">
              <CardContent className="p-6">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold mb-2">{template.name}</h3>
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
                      <DropdownMenuSeparator />
                      {(isAdmin || (isManager && template.createdBy === session?.user?.id)) && (
                        <DropdownMenuItem 
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
