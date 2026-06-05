"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { 
  Save, 
  Eye, 
  Code, 
  Layout, 
  Smartphone, 
  Monitor,
  Undo2,
  Redo2,
  Copy,
  Download,
  Plus,
  Settings,
  Type,
  Palette,
  Grid3x3,
  Share2,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmailTemplate } from "@/types/template"

// Dynamic import to prevent SSR issues
const ProfessionalGrapesJSEditor = dynamic(
  () => import("@/components/template-editor/ProfessionalGrapesJSEditor"),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse h-full flex items-center justify-center">Loading editor...</div>
  }
)

interface ProfessionalTemplateEditorPageProps {
  template: EmailTemplate
}

export default function ProfessionalTemplateEditorPage({ template }: ProfessionalTemplateEditorPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const editorRef = useRef<any>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const [showHTML, setShowHTML] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [activeBlockCategory, setActiveBlockCategory] = useState("basic")
  const [selectedMergeTag, setSelectedMergeTag] = useState("")

  const canEdit = template?.createdBy === session?.user?.id && !(template as any)?.isSystem

  const mergeTags = [
    { tag: "first_name", label: "First Name", description: "Contact's first name" },
    { tag: "last_name", label: "Last Name", description: "Contact's last name" },
    { tag: "email", label: "Email", description: "Contact's email address" },
    { tag: "company", label: "Company", description: "Contact's company" },
    { tag: "city", label: "City", description: "Contact's city" },
    { tag: "phone", label: "Phone", description: "Contact's phone number" }
  ]

  const blockCategories = [
    { id: "basic", label: "Basic", icon: Type },
    { id: "layout", label: "Layout", icon: Layout },
    { id: "advanced", label: "Advanced", icon: Settings }
  ]

  const emailBlocks = [
    { type: "email-header", label: "Header", category: "basic" },
    { type: "email-text", label: "Text", category: "basic" },
    { type: "email-image", label: "Image", category: "basic" },
    { type: "email-button", label: "Button", category: "basic" },
    { type: "email-divider", label: "Divider", category: "basic" },
    { type: "email-spacer", label: "Spacer", category: "basic" },
    { type: "email-2col", label: "2 Column", category: "layout" },
    { type: "email-3col", label: "3 Column", category: "layout" },
    { type: "email-social", label: "Social Icons", category: "basic" },
    { type: "email-footer", label: "Footer", category: "basic" },
    { type: "email-html", label: "Raw HTML", category: "advanced" }
  ]

  
  const handleSave = useCallback(async () => {
    if (!editorRef.current || !template || !canEdit) return

    try {
      setIsSaving(true)
      setSaveStatus("saving")
      
      const html = editorRef.current.getHtml()
      const projectData = editorRef.current.getProjectData()

      const response = await fetch(`/api/templates/${template.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: template.name,
          html: html,
          json: JSON.stringify(projectData)
        })
      })

      if (response.ok) {
        setUnsavedChanges(false)
        setSaveStatus("saved")
        setTimeout(() => setSaveStatus("idle"), 2000)
      } else {
        setSaveStatus("error")
        setTimeout(() => setSaveStatus("idle"), 3000)
      }
    } catch (error) {
      console.error("Error saving template:", error)
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } finally {
      setIsSaving(false)
    }
  }, [template, canEdit])

  const handlePreview = useCallback(() => {
    if (!editorRef.current) return
    
    const html = editorRef.current.getHtml()
    const css = editorRef.current.getCss()
    const newWindow = window.open('', '_blank')
    if (!newWindow) return
    
    newWindow.document.write(`
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Template Preview</title>
          <style>
            ${css}
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; }
            .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            ${html}
          </div>
        </body>
      </html>
    `)
  }, [])

  const handleDuplicate = useCallback(async () => {
    if (!template) return

    try {
      const html = editorRef.current?.getHtml() || template.html
      const projectData = editorRef.current?.getProjectData() || {}

      const response = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `${template.name} (Copy)`,
          category: template.category,
          html: html,
          json: JSON.stringify(projectData)
        })
      })

      if (response.ok) {
        router.push("/templates")
      }
    } catch (error) {
      console.error("Error duplicating template:", error)
    }
  }, [template])

  const handleExport = useCallback(() => {
    if (!editorRef.current) return
    
    const html = editorRef.current.getHtml()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template?.name || 'template'}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [template])

  const handleInsertMergeTag = useCallback((tag: string) => {
    if (!editorRef.current) return
    
    const tagText = `{{${tag}}}`
    // Insert at cursor position or selected text
    const editor = editorRef.current
    const selectedComponent = editor.getSelected()
    
    if (selectedComponent && selectedComponent.length > 0) {
      // Try to insert into selected text component
      const component = selectedComponent[0]
      if (component.get('type') === 'textnode' || component.get('tagName') === 'P') {
        const currentContent = component.get('content') || ''
        component.set('content', currentContent + tagText)
      }
    }
  }, [])

  const handleAddBlock = useCallback((blockType: string) => {
    if (editorRef.current) {
      editorRef.current.addBlock(blockType)
    }
  }, [])

  
  if (!template) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-gray-500">Template not found</div>
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">You don't have permission to edit this template.</p>
            <Link href="/templates">
              <Button>Back to Templates</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/templates" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="font-medium">{template.name}</span>
            </Link>
            
            {template.category && (
              <Badge variant="secondary">{template.category}</Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Save Status */}
            <div className="flex items-center gap-2 mr-4">
              {saveStatus === "saving" && (
                <div className="flex items-center text-blue-600">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full mr-2"></div>
                  Saving...
                </div>
              )}
              {saveStatus === "saved" && (
                <div className="flex items-center text-green-600">
                  <div className="h-4 w-4 bg-green-600 rounded-full mr-2"></div>
                  Saved
                </div>
              )}
              {saveStatus === "error" && (
                <div className="flex items-center text-red-600">
                  <div className="h-4 w-4 bg-red-600 rounded-full mr-2"></div>
                  Error
                </div>
              )}
              {saveStatus === "idle" && unsavedChanges && (
                <div className="flex items-center text-orange-600">
                  <div className="h-4 w-4 bg-orange-600 rounded-full mr-2"></div>
                  Unsaved
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => editorRef.current?.undo()}
                title="Undo"
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => editorRef.current?.redo()}
                title="Redo"
              >
                <Redo2 className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-gray-200" />

              <Button
                variant={previewMode === "desktop" ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewMode("desktop")}
                title="Desktop Preview"
              >
                <Monitor className="h-4 w-4" />
              </Button>
              
              <Button
                variant={previewMode === "mobile" ? "default" : "outline"}
                size="sm"
                onClick={() => setPreviewMode("mobile")}
                title="Mobile Preview"
              >
                <Smartphone className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-gray-200" />

              <Button
                variant={showHTML ? "default" : "outline"}
                size="sm"
                onClick={() => setShowHTML(!showHTML)}
                title="Toggle HTML Mode"
              >
                <Code className="h-4 w-4" />
              </Button>

              <div className="w-px h-6 bg-gray-200" />

              <Button
                variant="outline"
                size="sm"
                onClick={handlePreview}
                title="Preview in New Window"
              >
                <Eye className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleDuplicate}
                title="Duplicate Template"
              >
                <Copy className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                title="Export HTML"
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={handleSave}
                disabled={isSaving}
                title="Save Template"
                className="relative"
              >
                {isSaving ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded">
                    <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : (
                  <Save className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Block Palette */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Layout className="h-4 w-4 mr-2" />
              Blocks
            </h3>
          </div>
          
          {/* Block Categories */}
          <div className="flex border-b border-gray-200">
            {blockCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveBlockCategory(category.id)}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  activeBlockCategory === category.id
                    ? "bg-blue-50 text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                <category.icon className="h-4 w-4 mr-1" />
                {category.label}
              </button>
            ))}
          </div>

          {/* Blocks List */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {emailBlocks
                .filter(block => block.category === activeBlockCategory)
                .map((block) => (
                  <div
                    key={block.type}
                    onClick={() => handleAddBlock(block.type)}
                    className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded mr-3 flex items-center justify-center">
                        <Plus className="h-4 w-4 text-gray-600" />
                      </div>
                      <span className="text-sm font-medium">{block.label}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>

          {/* Merge Tags */}
          <div className="border-t border-gray-200 p-4">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center">
              <Type className="h-4 w-4 mr-2" />
              Merge Tags
            </h4>
            <div className="space-y-2">
              {mergeTags.map((tag) => (
                <div
                  key={tag.tag}
                  onClick={() => handleInsertMergeTag(tag.tag)}
                  className="p-2 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer text-sm"
                  title={tag.description}
                >
                  <code className="bg-gray-200 px-1 rounded text-xs">
                    {"{{" + tag.tag + "}}"}
                  </code>
                  <span className="ml-2 text-gray-600">{tag.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center - Email Canvas */}
        <div className="flex-1 bg-gray-100 flex flex-col">
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex justify-between items-center">
            <span className="text-sm font-medium text-gray-600">
              {showHTML ? "HTML Mode" : "Visual Editor"} - {previewMode === "desktop" ? "Desktop" : "Mobile"} View
            </span>
            <div className="text-xs text-gray-500">
              {previewMode === "desktop" ? "600px width" : "375px width"}
            </div>
          </div>
          
          <div 
            className="flex-1 overflow-auto bg-white"
            style={{ 
              maxWidth: previewMode === "mobile" ? "375px" : "100%",
              margin: previewMode === "mobile" ? "0 auto" : "0"
            }}
          >
            {showHTML ? (
              <div className="h-full">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex justify-between items-center">
                  <span className="text-sm font-medium">HTML Code</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const html = editorRef.current?.getHtml() || ''
                      navigator.clipboard.writeText(html)
                    }}
                  >
                    Copy HTML
                  </Button>
                </div>
                <div className="p-4 h-full overflow-auto">
                  <textarea
                    value={editorRef.current?.getHtml() || ''}
                    onChange={(e) => {
                      // Update editor with new HTML
                      if (editorRef.current) {
                        editorRef.current.setComponents(e.target.value)
                        setUnsavedChanges(true)
                      }
                    }}
                    className="w-full h-full p-4 font-mono text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Email HTML content..."
                    style={{ minHeight: '500px' }}
                  />
                </div>
              </div>
            ) : (
              <ProfessionalGrapesJSEditor
                ref={editorRef}
                initialHtml={template.html}
                initialJson={template.json ? JSON.parse(template.json) : undefined}
                onSave={handleSave}
                onChange={() => setUnsavedChanges(true)}
                onBlockAdd={(blockType) => {
                  console.log('Block added:', blockType)
                }}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar - Style Settings */}
        <div className="w-80 bg-white border-l border-gray-200">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 flex items-center">
              <Settings className="h-4 w-4 mr-2" />
              Style Settings
            </h3>
          </div>
          
          <div className="p-4 space-y-6">
            {/* Typography */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Typography</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm">
                    <option>Arial</option>
                    <option>Helvetica</option>
                    <option>Times New Roman</option>
                    <option>Georgia</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="14" />
                </div>
              </div>
            </div>

            {/* Colors */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Colors</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Background Color</label>
                  <input type="color" className="w-full h-10 border border-gray-300 rounded-md" defaultValue="#ffffff" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Text Color</label>
                  <input type="color" className="w-full h-10 border border-gray-300 rounded-md" defaultValue="#333333" />
                </div>
              </div>
            </div>

            {/* Spacing */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Spacing</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Padding</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="20" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Margin</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="0" />
                </div>
              </div>
            </div>

            {/* Borders */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Borders</h4>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Border Width</label>
                  <input type="number" className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" placeholder="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Border Color</label>
                  <input type="color" className="w-full h-10 border border-gray-300 rounded-md" defaultValue="#e5e7eb" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {unsavedChanges && (
        <div className="fixed bottom-4 right-4 bg-orange-100 border border-orange-400 text-orange-800 px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center">
            <span className="mr-3">You have unsaved changes</span>
            <Button size="sm" onClick={handleSave}>
              Save Now
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
