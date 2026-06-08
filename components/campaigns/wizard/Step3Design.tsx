"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Palette, Layout } from "lucide-react"
import dynamic from "next/dynamic"
import { toast } from "sonner"

const TemplateBuilder = dynamic(
  () => import("@/components/templates/TemplateBuilder"),
  { 
    ssr: false,
    loading: () => <div className="h-full w-full flex items-center justify-center p-20">Loading editor...</div>
  }
)

interface Step3DesignProps {
  selectedTemplate?: string
  templates: any[]
  onUpdate: (templateId: string) => void
  validationErrors: Record<string, string>
  goToStep?: (step: 1 | 2 | 3 | 4) => void
  refreshTemplates?: () => Promise<void>
}

export function Step3Design({ 
  selectedTemplate, 
  templates, 
  onUpdate, 
  validationErrors,
  goToStep,
  refreshTemplates
}: Step3DesignProps) {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [justSavedId, setJustSavedId] = useState<string | null>(null)

  // Scroll to template card once list refreshes and template is available
  useEffect(() => {
    if (justSavedId) {
      const element = document.getElementById(`template-card-${justSavedId}`)
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
        setJustSavedId(null)
      }
    }
  }, [justSavedId, templates])

  const categories = [
    { id: "all", name: "All Templates", icon: Layout },
    { id: "newsletter", name: "Newsletter", icon: Palette },
    { id: "marketing", name: "Marketing", icon: Eye },
    { id: "transactional", name: "Transactional", icon: Layout }
  ]

  const filteredTemplates = templates.filter(template => 
    selectedCategory === "all" || template.category === selectedCategory
  )

  const handleConfirmSelection = () => {
    if (selectedTemplate) {
      goToStep?.(4)
    } else {
      toast.error("Please select a template first")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-1">Choose Template</h2>
        <p className="text-slate-500 text-sm mb-6">
          Select a template for your campaign or create a custom design.
        </p>
      </div>

      {/* Category Filter */}
      <div className="inline-flex p-1 bg-slate-100 rounded-xl gap-1">
        {categories.map(category => {
          const Icon = category.icon
          const isSelected = selectedCategory === category.id
          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className={isSelected 
                ? "flex items-center gap-2 px-5 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold transition-all" 
                : "flex items-center gap-2 px-5 py-2 rounded-lg text-slate-500 text-sm font-medium hover:bg-white transition-all"}
            >
              <Icon className="h-4 w-4" />
              {category.name}
            </Button>
          )
        })}
      </div>

      {/* Template Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <Card 
            key={template.id} 
            id={`template-card-${template.id}`}
            className={selectedTemplate === template.id 
              ? "border-2 border-blue-500 rounded-2xl overflow-hidden shadow-md cursor-pointer group" 
              : "border border-slate-200 rounded-2xl overflow-hidden hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group shadow-none"}
            onClick={() => onUpdate(template.id)}
          >
            <CardHeader className="pb-3 p-0">
              <div className="h-40 bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border-b border-slate-100 group-hover:from-blue-50 group-hover:to-blue-100 transition-all">
                {template.thumbnail ? (
                  <img 
                    src={template.thumbnail} 
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center">
                      <Layout className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                    <span className="text-xs text-slate-400 group-hover:text-blue-500 transition-colors">
                      Email Template
                    </span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-3">
              <CardTitle className="text-sm font-semibold text-slate-800 mb-2">{template.name}</CardTitle>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {template.description}
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  {template.category}
                </Badge>
                <div className="flex items-center gap-2">
                  {selectedTemplate === template.id && (
                    <span className="text-primary font-bold text-sm">✓</span>
                  )}
                  <Button
                    variant={selectedTemplate === template.id ? "default" : "outline"}
                    size="sm"
                    className="text-xs font-semibold text-blue-600 border border-blue-200 hover:border-blue-400 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all h-auto"
                  >
                    {selectedTemplate === template.id ? "Selected" : "Select"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Use Template Action */}
      {selectedTemplate && (
        <div className="flex justify-end pt-4">
          <Button 
            size="lg" 
            onClick={handleConfirmSelection}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm"
          >
            Use This Template →
          </Button>
        </div>
      )}

      {/* Validation Error */}
      {validationErrors.template && (
        <div className="text-sm text-destructive mt-2">
          {validationErrors.template}
        </div>
      )}

      {/* Custom Design Option */}
      {!isEditorOpen && (
        <Card className="border border-dashed border-slate-300 rounded-2xl hover:border-blue-400 hover:bg-blue-50/20 transition-all shadow-none">
          <CardHeader>
            <CardTitle>Custom Design</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Want to create your own design? Use our advanced template editor to build a custom email from scratch.
            </p>
            <Button variant="outline" onClick={() => setIsEditorOpen(true)}>
              <Palette className="h-4 w-4 mr-2" />
              Create Custom Template
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Inline Editor */}
      {isEditorOpen && (
        <Card className="border-primary">
          <CardHeader className="bg-muted/50 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle>Inline Template Editor</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setIsEditorOpen(false)}>
                Cancel
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-[800px] w-full border-t">
              <TemplateBuilder 
                mode="create" 
                showSaveAndUse={true}
                onSaved={async (id) => {
                  toast.promise(
                    (async () => {
                      await refreshTemplates?.()
                      onUpdate(id)
                      setJustSavedId(id)
                      setIsEditorOpen(false)
                    })(),
                    {
                      loading: 'Saving to library...',
                      success: 'Template saved to library',
                      error: 'Failed to refresh library'
                    }
                  )
                }}
                onSaveAndUse={async (id) => {
                  toast.promise(
                    (async () => {
                      await refreshTemplates?.()
                      onUpdate(id)
                      setIsEditorOpen(false)
                      setTimeout(() => {
                        goToStep?.(4)
                      }, 200)
                    })(),
                    {
                      loading: 'Saving and applying template...',
                      success: 'Template saved and selected',
                      error: 'Failed to apply template'
                    }
                  )
                }}
                onCancel={() => setIsEditorOpen(false)}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
