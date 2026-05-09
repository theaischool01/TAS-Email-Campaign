"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Palette, Layout } from "lucide-react"

interface Step3DesignProps {
  selectedTemplate?: string
  templates: any[]
  onUpdate: (templateId: string) => void
  validationErrors: Record<string, string>
}

export function Step3Design({ 
  selectedTemplate, 
  templates, 
  onUpdate, 
  validationErrors 
}: Step3DesignProps) {
  const [selectedCategory, setSelectedCategory] = useState("all")

  const categories = [
    { id: "all", name: "All Templates", icon: Layout },
    { id: "newsletter", name: "Newsletter", icon: Palette },
    { id: "marketing", name: "Marketing", icon: Eye },
    { id: "transactional", name: "Transactional", icon: Layout }
  ]

  const filteredTemplates = templates.filter(template => 
    selectedCategory === "all" || template.category === selectedCategory
  )

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Choose Template</h2>
        <p className="text-muted-foreground">
          Select a template for your campaign or create a custom design.
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 flex-wrap">
        {categories.map(category => {
          const Icon = category.icon
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category.id)}
              className="flex items-center gap-2"
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
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedTemplate === template.id 
                ? "ring-2 ring-primary" 
                : ""
            }`}
            onClick={() => onUpdate(template.id)}
          >
            <CardHeader className="pb-3">
              <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                {template.thumbnail ? (
                  <img 
                    src={template.thumbnail} 
                    alt={template.name}
                    className="w-full h-full object-cover rounded-md"
                  />
                ) : (
                  <Layout className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-lg mb-2">{template.name}</CardTitle>
              <p className="text-sm text-muted-foreground mb-3">
                {template.description}
              </p>
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  {template.category}
                </Badge>
                <Button
                  variant={selectedTemplate === template.id ? "default" : "outline"}
                  size="sm"
                >
                  {selectedTemplate === template.id ? "Selected" : "Select"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Validation Error */}
      {validationErrors.template && (
        <div className="text-sm text-destructive mt-2">
          {validationErrors.template}
        </div>
      )}

      {/* Custom Design Option */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Design</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            Want to create your own design? Use our advanced template editor to build a custom email from scratch.
          </p>
          <Button variant="outline">
            <Palette className="h-4 w-4 mr-2" />
            Create Custom Template
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
