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
  ArrowLeft,
  Info
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { EmailTemplate } from "@/types/template"

// Dynamic import to prevent SSR issues
const ProfessionalGrapesJSEditor = dynamic(
  () => import("@/components/template-editor/ProfessionalGrapesJSEditor"),
  { 
    ssr: false,
    loading: () => <div className="animate-pulse h-full flex items-center justify-center text-slate-400">Loading editor...</div>
  }
)

interface ProfessionalTemplateEditorPageProps {
  template: EmailTemplate
}

export default function ProfessionalTemplateEditorPage({ template }: ProfessionalTemplateEditorPageProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const editorRef = useRef<any>(null)
  
  // Local States
  const [templateName, setTemplateName] = useState(template?.name || "New Template")
  const [templateDescription, setTemplateDescription] = useState(template?.description || "")
  const [isSaving, setIsSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const [showHTML, setShowHTML] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  
  const [leftTab, setLeftTab] = useState<"blocks" | "variables">("blocks")
  const [activeBlockCategory, setActiveBlockCategory] = useState("basic")
  const [hasSelection, setHasSelection] = useState(false)

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
          name: templateName,
          description: templateDescription,
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
  }, [template, canEdit, templateName, templateDescription])

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
            .button { background: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold; }
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
          name: `${templateName} (Copy)`,
          description: templateDescription,
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
  }, [template, templateName, templateDescription, router])

  const handleExport = useCallback(() => {
    if (!editorRef.current) return
    
    const html = editorRef.current.getHtml()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${templateName || 'template'}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [templateName])

  const handleInsertMergeTag = useCallback((tag: string) => {
    if (!editorRef.current) return
    
    const tagText = `{{${tag}}}`
    const editor = editorRef.current
    const selectedComponent = editor.getSelected()
    
    if (selectedComponent) {
      // Set inside GrapesJS text element
      const type = selectedComponent.get('type')
      if (type === 'text' || type === 'textnode' || selectedComponent.get('tagName') === 'P') {
        const currentContent = selectedComponent.get('content') || ''
        selectedComponent.set('content', currentContent + tagText)
      } else {
        // Fallback: search for child text components
        const firstChild = selectedComponent.components().at(0)
        if (firstChild && firstChild.get('type') === 'textnode') {
          const currentContent = firstChild.get('content') || ''
          firstChild.set('content', currentContent + tagText)
        }
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
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-500 font-medium text-sm">Template not found</div>
      </div>
    )
  }

  if (!canEdit) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Card className="w-96 shadow-md border-slate-200">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Access Denied</h3>
            <p className="text-slate-500 text-sm mb-4">You don't have permission to edit this template.</p>
            <Link href="/templates">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Back to Templates</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-slate-50 font-sans text-slate-900 select-none">
      {/* ─── Top Bar Redesign ────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-slate-200 px-6 py-2 h-16 flex items-center shrink-0">
        <div className="w-full flex justify-between items-center gap-4">
          
          {/* LEFT ZONE: Back arrow, Inline Name, Category, Description */}
          <div className="flex items-center gap-3 min-w-[30%]">
            <Link href="/templates" className="flex items-center text-slate-500 hover:text-slate-800 transition-colors">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => {
                    setTemplateName(e.target.value)
                    setUnsavedChanges(true)
                  }}
                  placeholder="Untitled Template"
                  className="text-sm font-semibold text-slate-800 border-none bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-500 px-2 py-0.5 rounded w-56 transition-all focus:outline-none h-7 shadow-none truncate"
                />
                {template.category && (
                  <Badge variant="outline" className="text-[10px] uppercase font-semibold tracking-wider px-1.5 py-0.5 border-slate-200 text-slate-400 bg-slate-50 rounded-md shrink-0">
                    {template.category}
                  </Badge>
                )}
              </div>
              <input
                type="text"
                value={templateDescription}
                onChange={(e) => {
                  setTemplateDescription(e.target.value)
                  setUnsavedChanges(true)
                }}
                placeholder="Add description..."
                className="text-[11px] text-slate-400 border-none bg-transparent hover:bg-slate-100 focus:bg-white focus:ring-1 focus:ring-blue-500 px-2 py-0.5 rounded w-64 transition-all focus:outline-none h-5 shadow-none truncate"
              />
            </div>
          </div>
          
          {/* CENTER ZONE: Device and View Toggles */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-3 rounded-md text-slate-600 hover:text-slate-900 shadow-none transition-all ${
                previewMode === "desktop" && !showHTML ? "bg-white text-slate-900 shadow-sm font-medium" : ""
              }`}
              onClick={() => {
                setPreviewMode("desktop")
                setShowHTML(false)
              }}
              title="Desktop View"
            >
              <Monitor className="h-4 w-4 mr-1.5" />
              <span className="text-[11px]">Desktop</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-3 rounded-md text-slate-600 hover:text-slate-900 shadow-none transition-all ${
                previewMode === "mobile" && !showHTML ? "bg-white text-slate-900 shadow-sm font-medium" : ""
              }`}
              onClick={() => {
                setPreviewMode("mobile")
                setShowHTML(false)
              }}
              title="Mobile View"
            >
              <Smartphone className="h-4 w-4 mr-1.5" />
              <span className="text-[11px]">Mobile</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`h-7 px-3 rounded-md text-slate-600 hover:text-slate-900 shadow-none transition-all ${
                showHTML ? "bg-white text-slate-900 shadow-sm font-medium" : ""
              }`}
              onClick={() => setShowHTML(true)}
              title="HTML Code Editor"
            >
              <Code className="h-4 w-4 mr-1.5" />
              <span className="text-[11px]">HTML</span>
            </Button>
            <span className="w-px h-4 bg-slate-200 mx-1" />
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2.5 rounded-md text-slate-500 hover:text-slate-800 shadow-none"
              onClick={handlePreview}
              title="Preview in new window"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
          
          {/* RIGHT ZONE: Undo/Redo, Duplicate, Export, Status, Save */}
          <div className="flex items-center gap-2 justify-end min-w-[30%]">
            
            {/* Undo/Redo Buttons */}
            <div className="flex items-center border border-slate-200 rounded-lg p-0.5 bg-white mr-1 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-none"
                onClick={() => editorRef.current?.undo()}
                title="Undo"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 rounded-md text-slate-500 hover:text-slate-800 hover:bg-slate-50 shadow-none"
                onClick={() => editorRef.current?.redo()}
                title="Redo"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-slate-200 hover:bg-slate-50 text-slate-600 px-2.5 shadow-none"
                onClick={handleDuplicate}
                title="Duplicate Template"
              >
                <Copy className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="h-8 border-slate-200 hover:bg-slate-50 text-slate-600 px-2.5 shadow-none mr-2"
                onClick={handleExport}
                title="Export HTML"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>

            {/* Save Status Indicator */}
            <div className="text-xs font-medium shrink-0 mr-1">
              {saveStatus === "saving" && (
                <span className="flex items-center text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                  <span className="animate-spin h-3 w-3 border-2 border-blue-600 border-t-transparent rounded-full mr-1.5" />
                  Saving...
                </span>
              )}
              {saveStatus === "saved" && (
                <span className="flex items-center text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                  <span className="h-2 w-2 bg-emerald-500 rounded-full mr-1.5" />
                  Saved
                </span>
              )}
              {saveStatus === "error" && (
                <span className="flex items-center text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-100">
                  <span className="h-2 w-2 bg-red-500 rounded-full mr-1.5" />
                  Error
                </span>
              )}
              {saveStatus === "idle" && unsavedChanges && (
                <span className="flex items-center text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                  <span className="h-2 w-2 bg-amber-500 rounded-full mr-1.5" />
                  Unsaved
                </span>
              )}
            </div>
            
            {/* Primary Save Button */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="h-8 bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 shadow-none shrink-0"
              title="Save Template"
            >
              {isSaving ? (
                <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
                  Save
                </>
              )}
            </Button>
          </div>

        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* ─── Left Sidebar Cleanup (width 260px) ───────────────────────────── */}
        <div className="w-[260px] bg-slate-50 border-r border-slate-200 flex flex-col shrink-0">
          
          {/* Tab Selection */}
          <div className="flex border-b border-slate-200 bg-white p-1">
            <button
              onClick={() => setLeftTab("blocks")}
              className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${
                leftTab === "blocks"
                  ? "bg-blue-50 text-blue-600 shadow-none"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              Blocks
            </button>
            <button
              onClick={() => setLeftTab("variables")}
              className={`flex-1 text-center py-1.5 text-xs font-semibold rounded-md transition-all ${
                leftTab === "variables"
                  ? "bg-blue-50 text-blue-600 shadow-none"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              Variables
            </button>
          </div>

          {/* TAB Content: Blocks */}
          {leftTab === "blocks" && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Block Categories */}
              <div className="flex border-b border-slate-200 bg-white shrink-0">
                {blockCategories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveBlockCategory(category.id)}
                    className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-all border-b-2 flex flex-col items-center gap-1 ${
                      activeBlockCategory === category.id
                        ? "border-blue-600 text-blue-600 bg-blue-50/20"
                        : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50"
                    }`}
                  >
                    <category.icon className="h-3.5 w-3.5" />
                    {category.label}
                  </button>
                ))}
              </div>

              {/* Blocks List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Select block to add
                </h4>
                {emailBlocks
                  .filter(block => block.category === activeBlockCategory)
                  .map((block) => (
                    <div
                      key={block.type}
                      onClick={() => handleAddBlock(block.type)}
                      className="p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all duration-200"
                    >
                      <div className="flex items-center">
                        <div className="w-7 h-7 bg-slate-100 rounded-md mr-3 flex items-center justify-center border border-slate-200 shrink-0">
                          <Plus className="h-3.5 w-3.5 text-slate-500" />
                        </div>
                        <span className="text-xs font-semibold text-slate-700">{block.label}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* TAB Content: Variables (Merge Tags) */}
          {leftTab === "variables" && (
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Insert template tags
              </h4>
              <p className="text-[11px] text-slate-400 mb-4 leading-normal">
                Click a tag to insert it into your selected text box component on the canvas.
              </p>
              <div className="space-y-2">
                {mergeTags.map((tag) => (
                  <div
                    key={tag.tag}
                    onClick={() => handleInsertMergeTag(tag.tag)}
                    className="p-2.5 bg-white border border-slate-200 rounded-lg hover:border-blue-300 hover:shadow-sm cursor-pointer transition-all duration-200"
                    title={tag.description}
                  >
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-bold text-slate-700">{tag.label}</span>
                      <code className="text-[10px] font-mono bg-slate-100 text-blue-600 px-1.5 py-0.5 rounded border border-slate-200">
                        {"{{" + tag.tag + "}}"}
                      </code>
                    </div>
                    <span className="text-[10px] text-slate-400">{tag.description}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ─── Center - Canvas Area ────────────────────────────────────────── */}
        <div className="flex-1 bg-slate-100 flex flex-col overflow-hidden relative">
          
          {/* Subbar info */}
          <div className="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200 px-6 py-2 flex justify-between items-center shrink-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {showHTML ? "HTML Source View" : "Visual Canvas"}
            </span>
            <div className="text-[11px] font-medium text-slate-400">
              {previewMode === "desktop" ? "600px width" : "375px width"}
            </div>
          </div>
          
          {/* Main Iframe Canvas Wrapper */}
          <div className="flex-1 p-6 flex justify-center bg-slate-100 overflow-hidden">
            <div 
              className="w-full h-full bg-white shadow-lg border border-slate-200 rounded-lg overflow-hidden transition-all duration-300 flex flex-col"
              style={{ 
                maxWidth: previewMode === "mobile" ? "375px" : "100%",
              }}
            >
              {showHTML ? (
                <div className="h-full flex flex-col">
                  <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 flex justify-between items-center shrink-0">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">HTML Code Editor</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs border-slate-200 shadow-none hover:bg-slate-50"
                      onClick={() => {
                        const html = editorRef.current?.getHtml() || ''
                        navigator.clipboard.writeText(html)
                      }}
                    >
                      Copy HTML
                    </Button>
                  </div>
                  <div className="p-4 flex-1 h-full">
                    <textarea
                      value={editorRef.current?.getHtml() || ''}
                      onChange={(e) => {
                        if (editorRef.current) {
                          editorRef.current.setComponents(e.target.value)
                          setUnsavedChanges(true)
                        }
                      }}
                      className="w-full h-full p-4 font-mono text-xs border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-slate-50 text-slate-800"
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
                  onSelectionChange={(selected) => {
                    setHasSelection(selected)
                  }}
                  onBlockAdd={(blockType) => {
                    console.log('Block added:', blockType)
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* ─── Right Sidebar Redesign (width 280px) ─────────────────────────── */}
        <div className="w-[280px] bg-slate-50 border-l border-slate-200 flex flex-col shrink-0">
          <div className="p-4 border-b border-slate-200 bg-white">
            <h3 className="font-semibold text-slate-800 text-xs flex items-center uppercase tracking-wider">
              <Settings className="h-4 w-4 mr-2 text-slate-500" />
              Properties Inspector
            </h3>
          </div>
          
          <div className="flex-1 overflow-y-auto">
            {/* If block is selected, show settings panel. Otherwise show placeholder */}
            {!hasSelection ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <div className="w-12 h-12 bg-slate-100 border border-slate-200 rounded-full flex items-center justify-center mb-4 shrink-0">
                  <Info className="h-5 w-5 text-slate-400" />
                </div>
                <h4 className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Select a block
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed max-w-[200px]">
                  Click on any layout, text, or element on the canvas to configure its typography, margins, backgrounds, and styling.
                </p>
              </div>
            ) : (
              <div className="p-4 space-y-6">
                
                {/* Typography Settings Section */}
                <div className="bg-white p-3.5 border border-slate-200 rounded-lg shadow-sm">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Type className="h-3.5 w-3.5 text-slate-400" />
                    Typography
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Font Family</label>
                      <select className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option>Arial</option>
                        <option>Helvetica</option>
                        <option>Times New Roman</option>
                        <option>Georgia</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Font Size</label>
                      <input type="number" className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="14" />
                    </div>
                  </div>
                </div>

                {/* Colors Settings Section */}
                <div className="bg-white p-3.5 border border-slate-200 rounded-lg shadow-sm">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5 text-slate-400" />
                    Colors
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Background Color</label>
                      <div className="flex gap-2">
                        <input type="color" className="w-8 h-8 p-0 border border-slate-200 rounded-md cursor-pointer shrink-0" defaultValue="#ffffff" />
                        <input type="text" className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-700" defaultValue="#ffffff" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Text Color</label>
                      <div className="flex gap-2">
                        <input type="color" className="w-8 h-8 p-0 border border-slate-200 rounded-md cursor-pointer shrink-0" defaultValue="#333333" />
                        <input type="text" className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-700" defaultValue="#333333" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spacing Settings Section */}
                <div className="bg-white p-3.5 border border-slate-200 rounded-lg shadow-sm">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <Grid3x3 className="h-3.5 w-3.5 text-slate-400" />
                    Spacing
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Padding</label>
                      <input type="number" className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-slate-50 text-slate-700" placeholder="20" />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Margin</label>
                      <input type="number" className="w-full px-2.5 py-1.5 border border-slate-200 rounded-md text-xs bg-slate-50 text-slate-700" placeholder="0" />
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>

      </div>

      {/* Unsaved Changes Banner */}
      {unsavedChanges && (
        <div className="fixed bottom-4 right-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg shadow-lg z-50 flex items-center gap-3">
          <span className="text-xs font-semibold">You have unsaved changes</span>
          <Button size="sm" onClick={handleSave} className="bg-amber-600 hover:bg-amber-700 text-white h-7 text-xs font-semibold px-3">
            Save Now
          </Button>
        </div>
      )}
    </div>
  )
}
