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
  Loader2,
  Check,
  X
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmailTemplate } from "@/types/template"

// Dynamic imports for performance
const BlockPalette = dynamic(
  () => import("./BlockPalette"),
  { ssr: false }
)

const CanvasEditor = dynamic(
  () => import("./CanvasEditor"),
  { ssr: false }
)

const StylePanel = dynamic(
  () => import("./StylePanel"),
  { ssr: false }
)

const MergeTagPanel = dynamic(
  () => import("./MergeTagPanel"),
  { ssr: false }
)

const HtmlCodeEditor = dynamic(
  () => import("./HtmlCodeEditor"),
  { ssr: false }
)

interface TemplateBuilderProps {
  mode: "create" | "edit" | "duplicate"
  templateId?: string
  onSaved?: (templateId: string) => void
  onCancel?: () => void
}

interface TemplateBlock {
  id: string
  type: string
  content: Record<string, any>
  styles: Record<string, any>
  children?: TemplateBlock[]
}

export default function TemplateBuilder({ mode, templateId, onSaved, onCancel }: TemplateBuilderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const [showHTML, setShowHTML] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [blocks, setBlocks] = useState<TemplateBlock[]>([])
  const [selectedBlock, setSelectedBlock] = useState<TemplateBlock | null>(null)
  const [templateName, setTemplateName] = useState("")
  const [templateCategory, setTemplateCategory] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const isAdmin = session?.user?.role === "SUPER_ADMIN"
  const isManager = session?.user?.role === "CAMPAIGN_MANAGER"
  const canEdit = isAdmin || (isManager && (mode === "create" || template?.createdBy === session?.user?.id))

  useEffect(() => {
    if (mode === "create") {
      setIsLoading(false)
      setTemplateName("New Template")
      setBlocks([])
    } else if (mode === "edit" && templateId) {
      fetchTemplate()
    } else if (mode === "duplicate" && templateId) {
      fetchTemplateForDuplication()
    }
  }, [mode, templateId])

  const fetchTemplate = async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}`)
      if (response.ok) {
        const data = await response.json()
        setTemplate(data)
        setTemplateName(data.name)
        setTemplateCategory(data.category || "")
        
        // Parse and validate blocks from JSON
        let normalizedBlocks: TemplateBlock[] = []
        
        if (data.json) {
          try {
            const parsedBlocks = JSON.parse(data.json)
            
            // Validate that parsed data is an array
            if (Array.isArray(parsedBlocks)) {
              normalizedBlocks = parsedBlocks.filter(block => 
                block && typeof block === 'object' && block.id && block.type
              )
              console.log("Loaded and validated blocks:", normalizedBlocks.length)
            } else {
              console.warn("Template JSON is not an array, using empty blocks")
            }
          } catch (error) {
            console.error("Error parsing template JSON:", error)
            console.warn("Using empty blocks due to JSON parse error")
          }
        } else {
          console.warn("No JSON data found, using empty blocks")
        }
        
        setBlocks(normalizedBlocks)
      } else {
        router.push("/templates")
      }
    } catch (error) {
      console.error("Error fetching template:", error)
      router.push("/templates")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchTemplateForDuplication = async () => {
    try {
      const response = await fetch(`/api/templates/${templateId}`)
      if (response.ok) {
        const data = await response.json()
        setTemplate(data)
        setTemplateName(`${data.name} (Copy)`)
        setTemplateCategory(data.category || "")
        
        // Parse and validate blocks from JSON
        let normalizedBlocks: TemplateBlock[] = []
        
        if (data.json) {
          try {
            const parsedBlocks = JSON.parse(data.json)
            
            // Validate that parsed data is an array
            if (Array.isArray(parsedBlocks)) {
              normalizedBlocks = parsedBlocks.filter(block => 
                block && typeof block === 'object' && block.id && block.type
              )
              console.log("Loaded and validated blocks for duplication:", normalizedBlocks.length)
            } else {
              console.warn("Template JSON is not an array, using empty blocks for duplication")
            }
          } catch (error) {
            console.error("Error parsing template JSON for duplication:", error)
            console.warn("Using empty blocks due to JSON parse error")
          }
        } else {
          console.warn("No JSON data found, using empty blocks for duplication")
        }
        
        setBlocks(normalizedBlocks)
      } else {
        router.push("/templates")
      }
    } catch (error) {
      console.error("Error fetching template for duplication:", error)
      router.push("/templates")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = useCallback(async (isRetry = false) => {
    console.log("🔍 Save Debug:", {
      mode,
      canEdit,
      isAdmin,
      isManager,
      templateId,
      templateName,
      blocksLength: blocks.length,
      createdBy: template?.createdBy,
      sessionUserId: session?.user?.id
    })

    if (!canEdit) {
      console.log("❌ Save blocked: !canEdit")
      return
    }

    // Validation: Template must contain at least one content block
    if (!Array.isArray(blocks) || blocks.length === 0) {
      console.log("❌ Save blocked: No blocks")
      setErrorMessage("Template must contain at least one content block")
      setSaveStatus("error")
      return
    }

    try {
      setIsSaving(true)
      setSaveStatus("saving")

      const templateData = {
        name: templateName,
        category: templateCategory,
        description: templateDescription,
        html: generateHTML(),
        json: JSON.stringify(blocks)
      }

      let response
      if (mode === "create" || mode === "duplicate") {
        response = await fetch("/api/templates", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(templateData)
        })
      } else if (mode === "edit" && templateId) {
        response = await fetch(`/api/templates/${templateId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(templateData)
        })
      }

      if (response && response.ok) {
        setUnsavedChanges(false)
        setSaveStatus("saved")
        setTimeout(() => setSaveStatus("idle"), 2000)
        
        const savedTemplate = await response.json()
        if (onSaved) {
          onSaved(savedTemplate.id)
        } else if (mode === "create" || mode === "duplicate") {
          router.push(`/templates/editor/${savedTemplate.id}`)
        }
      } else if (response?.status === 409 && !isRetry) {
        // Handle name conflict by auto-renaming and retrying once
        const uniqueName = `${templateName} (${new Date().toLocaleTimeString()})`
        setTemplateName(uniqueName)
        setErrorMessage(`Name conflict! Auto-renamed to: ${uniqueName}. Retrying save...`)
        handleSave(true)
      } else {
        const errorData = await response?.json().catch(() => ({}))
        setErrorMessage(errorData?.error || "Failed to save template")
        setSaveStatus("error")
        setTimeout(() => setSaveStatus("idle"), 5000)
      }
    } catch (error: any) {
      console.error("Error saving template:", error)
      setErrorMessage(error?.message || "An unexpected error occurred")
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 5000)
    } finally {
      setIsSaving(false)
    }
  }, [mode, templateId, templateName, templateCategory, blocks, canEdit, router])

  const handlePreview = useCallback(() => {
    const html = generateHTML()
    const newWindow = window.open('', '_blank')
    if (!newWindow) return
    
    newWindow.document.write(`
      <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Template Preview</title>
          <style>
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

  const handleExport = useCallback(() => {
    const html = generateHTML()
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${templateName}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [templateName])

  const generateHTML = useCallback(() => {
    return blocks.map(block => renderBlockToHTML(block)).join('')
  }, [blocks])

  const renderBlockToHTML = (block: TemplateBlock): string => {
    const styles = Object.entries(block.styles)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ')

    switch (block.type) {
      case 'header':
        return `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px; text-align: center; ${styles}">
                <h1 style="margin: 0; font-size: 24px;">${block.content.text}</h1>
              </td>
            </tr>
          </table>
        `
      case 'text':
        return `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; ${styles}">
                <p style="margin: 0;">${block.content.text}</p>
              </td>
            </tr>
          </table>
        `
      case 'button':
        return `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px; text-align: center;">
                <a href="${block.content.url || '#'}" style="background-color: ${block.content.backgroundColor || '#007bff'}; color: ${block.content.color || '#ffffff'}; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
                  ${block.content.text}
                </a>
              </td>
            </tr>
          </table>
        `
      case 'image':
        return `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px; text-align: center;">
                <img src="${block.content.src || 'https://via.placeholder.com/600x300'}" alt="${block.content.alt || ''}" style="max-width: 100%; height: auto; border-radius: 8px;" />
              </td>
            </tr>
          </table>
        `
      case 'divider':
        return `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px 0; text-align: center;">
                <hr style="border: none; border-top: 1px solid #e5e7eb; width: 100%;" />
              </td>
            </tr>
          </table>
        `
      case 'spacer':
        return `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="height: ${block.content.height || '20px'}; line-height: ${block.content.height || '20px'}; font-size: ${block.content.height || '20px'};">&nbsp;</td>
            </tr>
          </table>
        `
      case 'footer':
        return `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px; text-align: center; background-color: #f8f9fa; color: #6c757d; font-size: 12px; font-family: Arial, sans-serif; ${styles}">
                <p style="margin: 0 0 10px 0; font-size: 11px; line-height: 1.4;">
                  ${block.content?.unsubscribeText || "You received this email because you're subscribed to our newsletter."}
                </p>
                <p style="margin: 0 0 10px 0; font-size: 11px; line-height: 1.4;">
                  <a href="#" style="color: #6c757d; text-decoration: underline; margin-right: 10px;">Unsubscribe</a>
                  <a href="#" style="color: #6c757d; text-decoration: underline; margin-right: 10px;">Privacy Policy</a>
                  <a href="#" style="color: #6c757d; text-decoration: underline;">Terms of Service</a>
                </p>
                <p style="margin: 0 0 5px 0; font-size: 11px; line-height: 1.4;">
                  ${block.content?.company || "Your Company Name"}
                </p>
                <p style="margin: 0 0 5px 0; font-size: 10px; line-height: 1.4;">
                  ${block.content?.address || "123 Business St, City, State 12345"}
                </p>
                <p style="margin: 0; font-size: 10px; line-height: 1.4; border-top: 1px solid #dee2e6; padding-top: 10px;">
                  ${block.content?.copyright || `© ${new Date().getFullYear()} Your Company Name. All rights reserved.`}
                </p>
              </td>
            </tr>
          </table>
        `
      case '2column':
        return `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td width="50%" style="padding: 10px; vertical-align: top;">
                ${block.content.text1 || "Column 1 content"}
              </td>
              <td width="50%" style="padding: 10px; vertical-align: top;">
                ${block.content.text2 || "Column 2 content"}
              </td>
            </tr>
          </table>
        `
      case '3column':
        return `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td width="33.33%" style="padding: 10px; vertical-align: top;">
                ${block.content.text1 || "Column 1 content"}
              </td>
              <td width="33.33%" style="padding: 10px; vertical-align: top;">
                ${block.content.text2 || "Column 2 content"}
              </td>
              <td width="33.33%" style="padding: 10px; vertical-align: top;">
                ${block.content.text3 || "Column 3 content"}
              </td>
            </tr>
          </table>
        `
      case 'social':
        const platforms = [
          { id: 'facebook', label: 'FB' },
          { id: 'twitter', label: 'X' },
          { id: 'linkedin', label: 'IN' },
          { id: 'instagram', label: 'IG' },
          { id: 'youtube', label: 'YT' }
        ];
        const socialLinks = platforms.map(p => {
          if (block.content[p.id]) {
            return `<a href="${block.content[p.id]}" target="_blank" style="display: inline-block; width: 36px; height: 36px; line-height: 36px; margin: 0 5px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 12px; text-align: center;">${p.label}</a>`;
          }
          return '';
        }).join('');
        return `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px; text-align: center;">
                ${socialLinks || '<span style="color: #9ca3af; font-size: 12px; font-style: italic;">Configure social links</span>'}
              </td>
            </tr>
          </table>
        `
      case 'html':
        return `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px;">
                ${block.content.html || '<div>Custom HTML Block</div>'}
              </td>
            </tr>
          </table>
        `
      default:
        return ''
    }
  }

  const [isInserting, setIsInserting] = useState(false)
  const [pendingBlockType, setPendingBlockType] = useState<string | null>(null)

  // Debounced block insertion to prevent rapid duplication
  const debouncedAddBlock = useCallback(
    debounce((blockType: string) => {
      // Footer restrictions
      if (blockType === 'footer') {
        const existingFooter = blocks.find(block => block.type === 'footer')
        if (existingFooter) {
          alert('Only one footer block is allowed per template. Please remove the existing footer first.')
          setIsInserting(false)
          setPendingBlockType(null)
          return
        }
      }

      const newBlock: TemplateBlock = {
        id: `${blockType}-${Date.now()}`,
        type: blockType,
        content: getDefaultContent(blockType),
        styles: getDefaultStyles(blockType)
      }

      setBlocks(prev => {
        const currentBlocks = Array.isArray(prev) ? prev : []
        
        // Intelligent insertion logic
        if (selectedBlock) {
          // Insert after selected block
          const selectedIndex = currentBlocks.findIndex(block => block.id === selectedBlock.id)
          if (selectedIndex !== -1) {
            const newBlocks = [...currentBlocks]
            newBlocks.splice(selectedIndex + 1, 0, newBlock)
            return newBlocks
          }
        }
        
        // Special positioning for certain block types
        if (blockType === 'header' && currentBlocks.length === 0) {
          // Header goes at the beginning when canvas is empty
          return [newBlock]
        } else if (blockType === 'footer') {
          // Footer goes at the end
          return [...currentBlocks, newBlock]
        }
        
        // Default: append to end
        return [...currentBlocks, newBlock]
      })
      setUnsavedChanges(true)
      setIsInserting(false)
      setPendingBlockType(null)
    }, 300),
    [selectedBlock, blocks]
  )

  const addBlock = useCallback((blockType: string) => {
    if (isInserting) return // Prevent rapid duplication
    
    setIsInserting(true)
    setPendingBlockType(blockType)
    debouncedAddBlock(blockType)
  }, [isInserting, debouncedAddBlock])

  // Simple debounce function
  function debounce<T extends (...args: any[]) => void>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let timeoutId: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func(...args), delay)
    }
  }

  const getDefaultContent = (blockType: string): Record<string, any> => {
    switch (blockType) {
      case 'header':
        return { text: "Your Header Here" }
      case 'text':
        return { text: "Your text content goes here." }
      case 'button':
        return { text: "Click Here", url: "#", backgroundColor: "#007bff", color: "#ffffff" }
      case 'image':
        return { src: "https://via.placeholder.com/600x300", alt: "Placeholder" }
      case 'divider':
        return {}
      case 'spacer':
        return { height: "20px" }
      case 'footer':
        return { 
          company: "Your Company Name",
          address: "123 Business St, City, State 12345",
          unsubscribeText: "You received this email because you're subscribed to our newsletter.",
          copyright: `© ${new Date().getFullYear()} Your Company Name. All rights reserved.`
        }
      case '2column':
        return { text1: "Column 1 content", text2: "Column 2 content" }
      case '3column':
        return { text1: "Column 1 content", text2: "Column 2 content", text3: "Column 3 content" }
      case 'social':
        return { facebook: "", twitter: "", linkedin: "", instagram: "", youtube: "" }
      case 'html':
        return { html: "<div style='text-align: center; color: #666;'>Custom HTML content here</div>" }
      default:
        return {}
    }
  }

  const getDefaultStyles = (blockType: string): Record<string, any> => {
    switch (blockType) {
      case 'header':
        return { backgroundColor: "#007bff", color: "#ffffff", padding: "20px" }
      case 'text':
        return { fontSize: "16px", color: "#333333", padding: "20px" }
      case 'button':
        return { backgroundColor: "#007bff", color: "#ffffff", padding: "12px 24px", borderRadius: "4px" }
      case 'image':
        return { maxWidth: "100%", height: "auto", borderRadius: "8px" }
      case 'divider':
        return { borderColor: "#e5e7eb", borderWidth: "1px" }
      case 'spacer':
        return { height: "20px" }
      case 'footer':
        return { backgroundColor: "#f8f9fa", color: "#6c757d", fontSize: "12px", padding: "20px", textAlign: "center" }
      case '2column':
        return { padding: "10px" }
      case '3column':
        return { padding: "10px" }
      case 'social':
        return { padding: "20px", textAlign: "center" }
      case 'html':
        return { padding: "20px" }
      default:
        return {}
    }
  }

  const updateBlock = useCallback((blockId: string, updates: Partial<TemplateBlock>) => {
    setBlocks(prev => {
      const currentBlocks = Array.isArray(prev) ? prev : []
      return currentBlocks.map(block => 
        block.id === blockId ? { ...block, ...updates } : block
      )
    })
    setUnsavedChanges(true)
  }, [])

  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(prev => {
      const currentBlocks = Array.isArray(prev) ? prev : []
      return currentBlocks.filter(block => block.id !== blockId)
    })
    setSelectedBlock(null)
    setUnsavedChanges(true)
  }, [])

  const moveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    setBlocks(prev => {
      const currentBlocks = Array.isArray(prev) ? prev : []
      const blockIndex = currentBlocks.findIndex(block => block.id === blockId)
      
      if (blockIndex === -1) return currentBlocks
      
      const newBlocks = [...currentBlocks]
      const [movedBlock] = newBlocks.splice(blockIndex, 1)
      
      if (direction === 'up' && blockIndex > 0) {
        newBlocks.splice(blockIndex - 1, 0, movedBlock)
      } else if (direction === 'down' && blockIndex < currentBlocks.length - 1) {
        newBlocks.splice(blockIndex + 1, 0, movedBlock)
      } else {
        return currentBlocks // No move needed
      }
      
      return newBlocks
    })
    setUnsavedChanges(true)
  }, [])

  const duplicateBlock = useCallback((blockId: string) => {
    setBlocks(prev => {
      const currentBlocks = Array.isArray(prev) ? prev : []
      const blockIndex = currentBlocks.findIndex(block => block.id === blockId)
      
      if (blockIndex === -1) return currentBlocks
      
      const blockToDuplicate = currentBlocks[blockIndex]
      const duplicatedBlock: TemplateBlock = {
        ...blockToDuplicate,
        id: `${blockToDuplicate.type}-${Date.now()}`,
        content: { ...blockToDuplicate.content }
      }
      
      const newBlocks = [...currentBlocks]
      newBlocks.splice(blockIndex + 1, 0, duplicatedBlock)
      
      return newBlocks
    })
    setUnsavedChanges(true)
  }, [])

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="flex items-center">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading template builder...</span>
        </div>
      </div>
    )
  }

  if (!canEdit && mode !== "create") {
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
            {onCancel ? (
              <button onClick={onCancel} className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="font-medium">{templateName}</span>
              </button>
            ) : (
              <Link href="/templates" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <span className="font-medium">{templateName}</span>
              </Link>
            )}
            
            <div className="flex items-center gap-4">
              <div className="flex-1 space-y-2">
                <Input
                  value={templateName}
                  onChange={(e) => {
                    setTemplateName(e.target.value)
                    setUnsavedChanges(true)
                  }}
                  className="text-lg font-semibold border-none shadow-none px-0 w-64"
                  placeholder="Template Name"
                />
                <textarea
                  value={templateDescription}
                  onChange={(e) => {
                    setTemplateDescription(e.target.value)
                    setUnsavedChanges(true)
                  }}
                  onKeyDown={(e) => {
                    // Save on Ctrl/Cmd + Enter
                    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                      e.preventDefault()
                      handleSave()
                    }
                  }}
                  className="text-sm border border-gray-300 rounded-md px-3 py-2 w-96 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Template description (optional)"
                  rows={2}
                />
              </div>
              {templateCategory && (
                <Badge variant="secondary">{templateCategory}</Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Save Status */}
            <div className="flex items-center gap-2 mr-4">
              {saveStatus === "saving" && (
                <div className="flex items-center text-blue-600">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm">Saving...</span>
                </div>
              )}
              {saveStatus === "saved" && (
                <div className="flex items-center text-green-600">
                  <Check className="h-4 w-4 mr-2" />
                  <span className="text-sm">Saved</span>
                </div>
              )}
              {saveStatus === "error" && (
                <div className="flex items-center text-red-600 bg-red-50 px-3 py-1 rounded-md border border-red-200">
                  <X className="h-4 w-4 mr-2" />
                  <span className="text-sm font-medium">{errorMessage || "An error occurred"}</span>
                </div>
              )}
              {saveStatus === "idle" && unsavedChanges && (
                <div className="flex items-center text-orange-600">
                  <div className="h-4 w-4 bg-orange-600 rounded-full mr-2"></div>
                  <span className="text-sm">Unsaved</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
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
                onClick={handleExport}
                title="Export HTML"
              >
                <Download className="h-4 w-4" />
              </Button>
              
              <Button
                onClick={() => handleSave()}
                disabled={!canEdit || isSaving || (!Array.isArray(blocks) || blocks.length === 0)}
                size="sm"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Block Palette */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <BlockPalette
            onAddBlock={addBlock}
            selectedBlock={selectedBlock}
            isInserting={isInserting}
            pendingBlockType={pendingBlockType}
          />
        </div>

        {/* Center - Canvas Editor */}
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
              <HtmlCodeEditor
                html={generateHTML()}
                onChange={(html) => {
                  // Parse HTML back to blocks (simplified)
                  setUnsavedChanges(true)
                }}
              />
            ) : (
              <CanvasEditor
                blocks={blocks}
                selectedBlock={selectedBlock}
                previewMode={previewMode}
                onSelectBlock={setSelectedBlock}
                onUpdateBlock={updateBlock}
                onDeleteBlock={deleteBlock}
                onMoveBlock={moveBlock}
                onDuplicateBlock={duplicateBlock}
              />
            )}
          </div>
        </div>

        {/* Right Sidebar - Style Panel */}
        <div className="w-80 bg-white border-l border-gray-200">
          {selectedBlock ? (
            <StylePanel
              block={selectedBlock}
              onUpdateBlock={updateBlock}
            />
          ) : (
            <MergeTagPanel />
          )}
        </div>
      </div>

      {/* Unsaved Changes Warning */}
      {unsavedChanges && (
        <div className="fixed bottom-4 right-4 bg-orange-100 border border-orange-400 text-orange-800 px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center">
            <span className="mr-3">You have unsaved changes</span>
            <Button size="sm" onClick={() => handleSave()}>
              Save Now
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
