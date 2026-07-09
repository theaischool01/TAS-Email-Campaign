"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  X,
  Tablet,
  ChevronLeft
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmailTemplate } from "@/types/template"
import { Sidebar } from "@/components/layout/sidebar"
import { parseHTMLToBlocks } from "./utils/html-parser"
import { renderBlocksToHTML } from "./utils/html-renderer"



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

const AssetManager = dynamic(
  () => import("./AssetManager"),
  { ssr: false }
)

interface TemplateBuilderProps {
  mode: "create" | "edit" | "duplicate"
  templateId?: string
  onSaved?: (templateId: string) => void
  onCancel?: () => void
  showSaveAndUse?: boolean
  onSaveAndUse?: (templateId: string) => void
}

import { TemplateBlock } from "./types"

export default function TemplateBuilder({ mode, templateId, onSaved, onCancel, showSaveAndUse, onSaveAndUse }: TemplateBuilderProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeEditor, setActiveEditor] = useState<any>(null)
  const [previewMode, setPreviewMode] = useState<"desktop" | "tablet" | "mobile">("desktop")
  // Single-session image edit mode tracking — only one image may be in edit mode at a time
  const [editingImageBlockId, setEditingImageBlockId] = useState<string | null>(null)
  const [showHTML, setShowHTML] = useState(false)
  const [htmlDraft, setHtmlDraft] = useState<string>("")
  const [isHtmlDirty, setIsHtmlDirty] = useState<boolean>(false)
  const [htmlValidationError, setHtmlValidationError] = useState<string | null>(null)
  
  // Global Asset Picker state — enables canvas and properties inspector components to share a single upload pipeline
  const [assetPicker, setAssetPicker] = useState<{
    isOpen: boolean
    blockId: string | null
    colIdx: number | null
  }>({ isOpen: false, blockId: null, colIdx: null })

  const handleOpenAssetPicker = useCallback((blockId: string, colIdx: number | null = null) => {
    setAssetPicker({ isOpen: true, blockId, colIdx })
  }, [])

  const handleSelectAsset = useCallback((url: string) => {
    if (!assetPicker.blockId) return
    const { blockId, colIdx } = assetPicker

    setBlocks(prev => {
      const currentBlocks = Array.isArray(prev) ? prev : []
      return currentBlocks.map(block => {
        if (block.id !== blockId) return block

        if (colIdx !== null) {
          return {
            ...block,
            content: {
              ...block.content,
              [`col${colIdx}ImageSrc`]: url
            }
          }
        } else {
          return {
            ...block,
            content: {
              ...block.content,
              src: url
            }
          }
        }
      })
    })

    setSelectedBlock(prevSelected => {
      if (prevSelected && prevSelected.id === blockId) {
        if (colIdx !== null) {
          return {
            ...prevSelected,
            content: {
              ...prevSelected.content,
              [`col${colIdx}ImageSrc`]: url
            }
          }
        } else {
          return {
            ...prevSelected,
            content: {
              ...prevSelected.content,
              src: url
            }
          }
        }
      }
      return prevSelected
    })

    setUnsavedChanges(true)
    setAssetPicker({ isOpen: false, blockId: null, colIdx: null })
  }, [assetPicker])
  const [htmlAlert, setHtmlAlert] = useState<{ isOpen: boolean; nextView: "visual" | "close" | "save"; nextViewport?: "desktop" | "tablet" | "mobile" } | null>(null)
  const [unsavedChanges, setUnsavedChanges] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle")
  const [saveType, setSaveType] = useState<"library" | "use" | null>(null)
  const [blocks, setBlocks] = useState<TemplateBlock[]>([])
  // Simple Undo/Redo History System
  const historyRef = useRef<TemplateBlock[][]>([])
  const historyIndexRef = useRef<number>(-1)
  const isUndoingRedoingRef = useRef<boolean>(false)

  useEffect(() => {
    if (isUndoingRedoingRef.current) {
      isUndoingRedoingRef.current = false
      return
    }
    const currentHistory = historyRef.current
    const currentIndex = historyIndexRef.current
    const blocksJson = JSON.stringify(blocks)
    const prevJson = currentIndex >= 0 ? JSON.stringify(currentHistory[currentIndex]) : ''

    if (blocksJson !== prevJson) {
      const newHistory = currentHistory.slice(0, currentIndex + 1)
      newHistory.push(JSON.parse(blocksJson))
      historyRef.current = newHistory
      historyIndexRef.current = newHistory.length - 1
    }
  }, [blocks])

  const handleUndo = useCallback(() => {
    const currentIndex = historyIndexRef.current
    if (currentIndex > 0) {
      isUndoingRedoingRef.current = true
      const prevIndex = currentIndex - 1
      historyIndexRef.current = prevIndex
      setBlocks(JSON.parse(JSON.stringify(historyRef.current[prevIndex])))
      setUnsavedChanges(true)
    }
  }, [])

  const handleRedo = useCallback(() => {
    const currentIndex = historyIndexRef.current
    const currentHistory = historyRef.current
    if (currentIndex < currentHistory.length - 1) {
      isUndoingRedoingRef.current = true
      const nextIndex = currentIndex + 1
      historyIndexRef.current = nextIndex
      setBlocks(JSON.parse(JSON.stringify(currentHistory[nextIndex])))
      setUnsavedChanges(true)
    }
  }, [])

  const [previousBlocks, setPreviousBlocks] = useState<TemplateBlock[] | null>(null)
  const [selectedBlock, setSelectedBlock] = useState<TemplateBlock | null>(null)
  // Selecting a block swaps the left sidebar to the Properties panel
  const handleSelectBlock = useCallback((block: TemplateBlock | null) => {
    setSelectedBlock(block)
  }, [])
  const [templateName, setTemplateName] = useState("")
  const [templateCategory, setTemplateCategory] = useState("")
  const [templateDescription, setTemplateDescription] = useState("")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showConfidenceWarning, setShowConfidenceWarning] = useState(false)
  const [parserWarnings, setParserWarnings] = useState<string[]>([])


  const canEdit = mode === "create" || (template?.createdBy === session?.user?.id && !(template as any)?.isSystem)

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
        if (data.id !== templateId) {
          router.replace(`/templates/editor/${data.id}`)
          return
        }
        setTemplate(data)
        setTemplateName(data.name)
        setTemplateCategory(data.category || "")
        
        let normalizedBlocks: TemplateBlock[] = []
        let parseConfidence: "HIGH" | "MEDIUM" | "LOW" = "HIGH"
        let parseWarnings: string[] = []

        if (data.json) {
          try {
            const parsedBlocks = JSON.parse(data.json)
            if (Array.isArray(parsedBlocks) && parsedBlocks.length > 0) {
              normalizedBlocks = parsedBlocks.filter(block => 
                block && typeof block === 'object' && block.id && block.type
              )
              console.log("Loaded blocks from JSON:", normalizedBlocks.length)
            }
          } catch (error) {
            console.error("Error parsing JSON blocks:", error)
          }
        }

        if (normalizedBlocks.length === 0 && data.html && data.html.trim() !== '') {
          const parseResult = parseHTMLToBlocks(data.html)
          normalizedBlocks = parseResult.blocks
          parseConfidence = parseResult.confidence
          parseWarnings = parseResult.warnings
          console.log("Parsed blocks from HTML. Confidence:", parseConfidence, "Count:", normalizedBlocks.length)

          if (parseConfidence === "LOW") {
            setShowConfidenceWarning(true)
            setParserWarnings(parseWarnings)
          }
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
        
        let normalizedBlocks: TemplateBlock[] = []
        let parseConfidence: "HIGH" | "MEDIUM" | "LOW" = "HIGH"
        let parseWarnings: string[] = []

        if (data.json) {
          try {
            const parsedBlocks = JSON.parse(data.json)
            if (Array.isArray(parsedBlocks) && parsedBlocks.length > 0) {
              normalizedBlocks = parsedBlocks.filter(block => 
                block && typeof block === 'object' && block.id && block.type
              )
              console.log("Loaded blocks for duplication from JSON:", normalizedBlocks.length)
            }
          } catch (error) {
            console.error("Error parsing JSON blocks for duplication:", error)
          }
        }

        if (normalizedBlocks.length === 0 && data.html && data.html.trim() !== '') {
          const parseResult = parseHTMLToBlocks(data.html)
          normalizedBlocks = parseResult.blocks
          parseConfidence = parseResult.confidence
          parseWarnings = parseResult.warnings
          console.log("Parsed blocks for duplication from HTML. Confidence:", parseConfidence, "Count:", normalizedBlocks.length)

          if (parseConfidence === "LOW") {
            setShowConfidenceWarning(true)
            setParserWarnings(parseWarnings)
          }
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


  const handleSave = useCallback(async (isRetry = false, targetType?: "library" | "use") => {
    if (targetType) {
      setSaveType(targetType)
    }
    console.log("🔍 Save Debug:", {
      mode,
      canEdit,
      templateId,
      templateName,
      blocksLength: blocks.length,
      createdBy: template?.createdBy,
      sessionUserId: session?.user?.id,
      targetType
    })

    if (!canEdit) {
      console.log("❌ Save blocked: !canEdit")
      return
    }

    // If in HTML mode with dirty changes, apply them first (single save code path)
    if (showHTML && isHtmlDirty) {
      try {
        const trimmed = htmlDraft.trim()
        if (!trimmed) {
          setHtmlValidationError("HTML is empty. Cannot save an empty template.")
          setSaveStatus("error")
          setErrorMessage("HTML is empty")
          return
        }
        const parseResult = parseHTMLToBlocks(trimmed)
        const parsed = parseResult?.blocks
        if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
          setHtmlValidationError("Parsing produced no blocks. Please fix the HTML before saving.")
          setSaveStatus("error")
          setErrorMessage("HTML could not be parsed into blocks")
          return
        }
        setBlocks(parsed)
        setIsHtmlDirty(false)
        setHtmlValidationError(null)
      } catch (error: any) {
        setHtmlValidationError(error?.message || "Failed to parse HTML. Fix the errors before saving.")
        setSaveStatus("error")
        setErrorMessage("HTML parsing failed")
        return
      }
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
        setTimeout(() => {
          setSaveStatus("idle")
          setSaveType(null)
        }, 2000)
        
        const savedTemplate = await response.json()
        const resolvedType = targetType || saveType
        if (resolvedType === "use" && onSaveAndUse) {
          onSaveAndUse(savedTemplate.id)
        } else if (onSaved) {
          onSaved(savedTemplate.id)
        } else if (mode === "create" || mode === "duplicate") {
          router.push(`/templates/editor/${savedTemplate.id}`)
        }
      } else if (response?.status === 409 && !isRetry) {
        // Handle name conflict by auto-renaming and retrying once
        const uniqueName = `${templateName} (${new Date().toLocaleTimeString()})`
        setTemplateName(uniqueName)
        setErrorMessage(`Name conflict! Auto-renamed to: ${uniqueName}. Retrying save...`)
        handleSave(true, targetType)
      } else {
        const errorData = await response?.json().catch(() => ({}))
        setErrorMessage(errorData?.error || "Failed to save template")
        setSaveStatus("error")
        setTimeout(() => {
          setSaveStatus("idle")
          setSaveType(null)
        }, 5000)
      }
    } catch (error: any) {
      console.error("Error saving template:", error)
      setErrorMessage(error?.message || "An unexpected error occurred")
      setSaveStatus("error")
      setTimeout(() => setSaveStatus("idle"), 5000)
    } finally {
      setIsSaving(false)
    }
  }, [mode, templateId, templateName, templateCategory, blocks, canEdit, router, showHTML, isHtmlDirty, htmlDraft])

  const generateHTML = useCallback(() => {
    return renderBlocksToHTML(blocks)
  }, [blocks])

  const handlePreview = useCallback(() => {
    const html = generateHTML()
    const sampleData = {
      first_name: "John",
      last_name: "Doe",
      email: "john.doe@example.com",
      company: "Acme Corp"
    }
    const replacedHtml = html
      .replace(/\{\{first_name\}\}/g, sampleData.first_name)
      .replace(/\{\{last_name\}\}/g, sampleData.last_name)
      .replace(/\{\{email\}\}/g, sampleData.email)
      .replace(/\{\{company\}\}/g, sampleData.company)

    const escapeHtmlStr = (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    const newWindow = window.open('', '_blank')
    if (!newWindow) return
    
    newWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${templateName || 'Email Template'} - Live Preview</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            background-color: #f1f5f9;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
          }
          .header-bar {
            width: 100%;
            background-color: #ffffff;
            border-bottom: 1px solid #e2e8f0;
            box-shadow: 0 1px 2px 0 rgba(0,0,0,0.05);
            padding: 16px 24px;
            box-sizing: border-box;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .title {
            font-size: 18px;
            font-weight: 600;
            color: #1e293b;
            margin: 0;
          }
          .toggle-container {
            display: flex;
            background-color: #f1f5f9;
            border-radius: 8px;
            padding: 4px;
          }
          .toggle-btn {
            border: none;
            background: none;
            padding: 6px 12px;
            border-radius: 6px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            color: #64748b;
          }
          .toggle-btn.active {
            background-color: #ffffff;
            color: #0f172a;
            box-shadow: 0 1px 3px 0 rgba(0,0,0,0.1);
          }
          .canvas-container {
            width: 100%;
            padding: 48px 16px;
            box-sizing: border-box;
            display: flex;
            justify-content: center;
            transition: all 0.3s ease;
          }
          .email-card {
            width: 100%;
            max-width: 600px;
            background-color: #ffffff;
            border-radius: 12px;
            box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05);
            border: 1px solid #e2e8f0;
            overflow: hidden;
            transition: max-width 0.3s ease;
          }
          iframe {
            width: 100%;
            height: 1200px;
            border: none;
            display: block;
          }
        </style>
      </head>
      <body>
        <div class="header-bar">
          <h1 class="title">${templateName || 'Email Template'} - Live Preview</h1>
          <div class="toggle-container">
            <button id="btn-desktop" class="toggle-btn active" onclick="setMode('desktop')">Desktop</button>
            <button id="btn-mobile" class="toggle-btn" onclick="setMode('mobile')">Mobile</button>
          </div>
        </div>
        <div class="canvas-container">
          <div id="email-card" class="email-card">
            <iframe id="preview-iframe" sandbox="allow-same-origin" srcdoc="${escapeHtmlStr(replacedHtml)}"></iframe>
          </div>
        </div>
        <script>
          const iframe = document.getElementById('preview-iframe');
          iframe.addEventListener('load', () => {
            if (iframe.contentWindow) {
              try {
                iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 'px';
              } catch (e) {
                iframe.style.height = '1200px';
              }
            }
          });

          function setMode(mode) {
            const card = document.getElementById('email-card');
            const btnDesktop = document.getElementById('btn-desktop');
            const btnMobile = document.getElementById('btn-mobile');
            if (mode === 'mobile') {
              card.style.maxWidth = '375px';
              btnMobile.classList.add('active');
              btnDesktop.classList.remove('active');
            } else {
              card.style.maxWidth = '600px';
              btnDesktop.classList.add('active');
              btnMobile.classList.remove('active');
            }
            // re-adjust height
            setTimeout(() => {
              if (iframe.contentWindow) {
                try {
                  iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 'px';
                } catch (e) {}
              }
            }, 150);
          }
        </script>
      </body>
      </html>
    `)
    newWindow.document.close()
  }, [generateHTML, templateName])

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

  // ── HTML Mode Draft Handlers ──────────────────────────────────────────────
  const handleToggleHtmlMode = useCallback(() => {
    if (!showHTML) {
      // Entering HTML mode: generate draft once from current blocks
      const html = renderBlocksToHTML(blocks)
      setHtmlDraft(html)
      setIsHtmlDirty(false)
      setHtmlValidationError(null)
      setShowHTML(true)
    } else {
      // Leaving HTML mode: check for unsaved changes
      if (isHtmlDirty) {
        setHtmlAlert({ isOpen: true, nextView: "visual" })
      } else {
        setShowHTML(false)
      }
    }
  }, [showHTML, blocks, isHtmlDirty])

  const handleApplyHtmlChanges = useCallback(() => {
    // Pre-validation: ensure HTML is not empty or trivially invalid
    const trimmed = htmlDraft.trim()
    if (!trimmed) {
      setHtmlValidationError("HTML is empty. Please add content before applying.")
      return
    }
    if (!trimmed.includes("<") || !trimmed.includes(">")) {
      setHtmlValidationError("HTML does not appear to contain valid markup. Please check your code.")
      return
    }

    try {
      const parseResult = parseHTMLToBlocks(trimmed)
      const parsed = parseResult?.blocks
      if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
        setHtmlValidationError("Parsing produced no blocks. Your changes were not applied. Please check the HTML and try again.")
        return
      }

      // Validate every parsed block has required properties
      const allValid = parsed.every((block: any) =>
        block.id && block.type && typeof block.content === 'object' && typeof block.styles === 'object'
      )
      if (!allValid) {
        setHtmlValidationError("Some parsed blocks are missing required properties (id, type, content, styles). Changes were not applied.")
        return
      }

      // Save rollback snapshot before committing
      setPreviousBlocks([...blocks])

      // Transactional commit: only update blocks after full validation
      setBlocks(parsed)
      setIsHtmlDirty(false)
      setHtmlValidationError(null)
      setUnsavedChanges(true)
    } catch (error: any) {
      // Parse failed: keep existing blocks intact, show error
      setHtmlValidationError(error?.message || "Failed to parse HTML. Your existing blocks have been preserved.")
    }
  }, [htmlDraft, blocks])

  const handleResetHtmlFromVisual = useCallback(() => {
    const html = renderBlocksToHTML(blocks)
    setHtmlDraft(html)
    setIsHtmlDirty(false)
    setHtmlValidationError(null)
  }, [blocks])

  const handleRestorePreviousVersion = useCallback(() => {
    if (previousBlocks) {
      setBlocks(previousBlocks)
      setPreviousBlocks(null)
      setUnsavedChanges(true)
      if (showHTML) {
        const html = renderBlocksToHTML(previousBlocks)
        setHtmlDraft(html)
        setIsHtmlDirty(false)
        setHtmlValidationError(null)
      }
    }
  }, [previousBlocks, showHTML])

  const [isInserting, setIsInserting] = useState(false)
  const [pendingBlockType, setPendingBlockType] = useState<string | null>(null)

  // Debounced block insertion to prevent rapid duplication
  const debouncedAddBlock = useCallback(
    debounce((blockType: string, initialContent?: Record<string, any>, initialStyles?: Record<string, any>) => {
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
        content: initialContent || getDefaultContent(blockType),
        styles: initialStyles || getDefaultStyles(blockType)
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

  const addBlock = useCallback((blockType: string, initialContent?: Record<string, any>, initialStyles?: Record<string, any>) => {
    if (isInserting) return // Prevent rapid duplication
    
    setIsInserting(true)
    setPendingBlockType(blockType)
    debouncedAddBlock(blockType, initialContent, initialStyles)
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
    setSelectedBlock(prevSelected => {
      if (prevSelected && prevSelected.id === blockId) {
        return { ...prevSelected, ...updates }
      }
      return prevSelected
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

  if (!canEdit) {
    return (
      <div className="h-screen flex items-center justify-center">
<Card className="w-96">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-gray-600 mb-4">You don't have permission to edit this template.</p>
            <Link href="/templates">
              <Button>Back to Template</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 flex-col">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 px-6 py-2 shrink-0">
        <div className="flex justify-between items-center h-12">
          {/* Left: Template Name, Subtitle and Status Badge */}
          <div className="flex items-center gap-4">
            {onCancel ? (
              <button onClick={onCancel} className="text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <Link href="/templates" className="text-gray-600 hover:text-gray-900 transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            )}
            
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <input
                  value={templateName}
                  onChange={(e) => {
                    setTemplateName(e.target.value)
                    setUnsavedChanges(true)
                  }}
                  className="text-sm font-bold text-slate-800 border-none bg-transparent hover:bg-slate-100/50 px-1 py-0.5 rounded focus:outline-none focus:ring-1 focus:ring-slate-350 focus:bg-white w-40"
                  placeholder="Template Name"
                />
                
                {/* Yellow status badge (● Unsaved / ● Saved) next to name */}
                {saveStatus === "saving" && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-semibold rounded-full px-2 py-0 h-4 flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>Saving
                  </Badge>
                )}
                {saveStatus === "saved" && (
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[10px] font-semibold rounded-full px-2 py-0 h-4 flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>Saved
                  </Badge>
                )}
                {saveStatus === "error" && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-[10px] font-semibold rounded-full px-2 py-0 h-4 flex items-center gap-1 shrink-0" title={errorMessage || "Error"}>
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>Error
                  </Badge>
                )}
                {saveStatus === "idle" && unsavedChanges && (
                  <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-[10px] font-semibold rounded-full px-2 py-0 h-4 flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>Unsaved
                  </Badge>
                )}
              </div>
              <input
                value={templateDescription}
                onChange={(e) => {
                  setTemplateDescription(e.target.value)
                  setUnsavedChanges(true)
                }}
                className="text-[10px] text-gray-500 bg-transparent border-none px-1 py-0 focus:outline-none w-48"
                placeholder="No description"
              />
            </div>
          </div>
          
          {/* Center: Device switching segmented toggle control and Undo/Redo button pair */}
          <div className="flex items-center">
            {/* Device Segments */}
            <div className="flex border border-slate-200 rounded-full p-0.5 bg-slate-50 gap-0.5 shadow-sm">
              <Button
                variant={!showHTML && previewMode === "desktop" ? "default" : "ghost"}
                size="sm"
                className={`h-7 px-3 rounded-full text-xs font-medium transition-all ${
                  !showHTML && previewMode === "desktop" 
                    ? "bg-white text-slate-800 shadow-sm hover:bg-white border border-slate-200/50" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-transparent"
                }`}
                onClick={() => {
                  setShowHTML(false)
                  setPreviewMode("desktop")
                }}
              >
                <Monitor className="h-3.5 w-3.5 mr-1.5" />
                Desktop
              </Button>
              <Button
                variant={!showHTML && previewMode === "tablet" ? "default" : "ghost"}
                size="sm"
                className={`h-7 px-3 rounded-full text-xs font-medium transition-all ${
                  !showHTML && previewMode === "tablet" 
                    ? "bg-white text-slate-800 shadow-sm hover:bg-white border border-slate-200/50" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-transparent"
                }`}
                onClick={() => {
                  setShowHTML(false)
                  setPreviewMode("tablet")
                }}
              >
                <Tablet className="h-3.5 w-3.5 mr-1.5" />
                Tablet
              </Button>
              <Button
                variant={!showHTML && previewMode === "mobile" ? "default" : "ghost"}
                size="sm"
                className={`h-7 px-3 rounded-full text-xs font-medium transition-all ${
                  !showHTML && previewMode === "mobile" 
                    ? "bg-white text-slate-800 shadow-sm hover:bg-white border border-slate-200/50" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-transparent"
                }`}
                onClick={() => {
                  setShowHTML(false)
                  setPreviewMode("mobile")
                }}
              >
                <Smartphone className="h-3.5 w-3.5 mr-1.5" />
                Mobile
              </Button>
              <Button
                variant={showHTML ? "default" : "ghost"}
                size="sm"
                className={`h-7 px-3 rounded-full text-xs font-medium transition-all ${
                  showHTML 
                    ? "bg-white text-slate-800 shadow-sm hover:bg-white border border-slate-200/50" 
                    : "text-slate-500 hover:text-slate-800 hover:bg-transparent"
                }`}
                onClick={handleToggleHtmlMode}
              >
                <Code className="h-3.5 w-3.5 mr-1.5" />
                HTML
              </Button>
            </div>

            {/* Undo / Redo controls */}
            <div className="flex border border-slate-200 rounded-full p-0.5 bg-slate-50 gap-0.5 shadow-sm ml-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-8 rounded-full p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                onClick={handleUndo}
                title="Undo"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-8 rounded-full p-0 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                onClick={handleRedo}
                title="Redo"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
          
          {/* Right: Actions (Preview, Export, Save) */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-slate-650 hover:bg-slate-50 border-slate-200 h-9 font-medium shadow-sm flex items-center gap-1.5"
              onClick={handlePreview}
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="rounded-lg text-slate-650 hover:bg-slate-50 border-slate-200 h-9 font-medium shadow-sm flex items-center gap-1.5"
              onClick={handleExport}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            
            {showSaveAndUse ? (
              <>
                <Button
                  onClick={() => handleSave(false, "library")}
                  disabled={!canEdit || isSaving || (!Array.isArray(blocks) || blocks.length === 0)}
                  variant="outline"
                  size="sm"
                  className="rounded-lg text-slate-650 hover:bg-slate-50 border-slate-200 h-9 font-medium shadow-sm flex items-center gap-1.5"
                >
                  {isSaving && saveType === "library" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  Save to Library
                </Button>
                <Button
                  onClick={() => handleSave(false, "use")}
                  disabled={!canEdit || isSaving || (!Array.isArray(blocks) || blocks.length === 0)}
                  size="sm"
                  className="bg-green-600 hover:bg-green-700 text-white rounded-lg px-4 h-9 font-medium shadow-sm flex items-center gap-1.5"
                >
                  {isSaving && saveType === "use" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Save & Use
                </Button>
              </>
            ) : (
              <Button
                onClick={() => handleSave()}
                disabled={!canEdit || isSaving || (!Array.isArray(blocks) || blocks.length === 0)}
                size="sm"
                className="bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 h-9 font-medium shadow-sm flex items-center gap-1.5"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Main Editor Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar — Block Palette or Properties Inspector (swaps on block selection) */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-hidden">
          {selectedBlock ? (
            <StylePanel
              key={selectedBlock.id}
              block={selectedBlock}
              onUpdateBlock={updateBlock}
              onDeleteBlock={deleteBlock}
              activeEditor={activeEditor}
              onOpenAssetManager={handleOpenAssetPicker}
              onDone={() => setSelectedBlock(null)}
            />
          ) : (
            <BlockPalette
              onAddBlock={addBlock}
              selectedBlock={selectedBlock}
              isInserting={isInserting}
              pendingBlockType={pendingBlockType}
              blocks={blocks}
              onSelectBlock={handleSelectBlock}
              onDeleteBlock={deleteBlock}
              onDuplicateBlock={duplicateBlock}
              onMoveBlock={moveBlock}
              onUpdateBlock={updateBlock}
            />
          )}
        </div>

        {/* Center - Canvas Editor */}
        <div className="flex-1 min-w-0 bg-gray-150 flex flex-col overflow-hidden">
          <div className="bg-slate-50/50 border-b border-gray-200 px-6 py-2 flex justify-between items-center shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Visual Canvas Board
            </span>
            <div className="text-[10px] text-slate-400 bg-slate-100/80 px-1.5 py-0.5 rounded font-medium border border-slate-200/50">
              {previewMode === "desktop" ? "600px width" : previewMode === "tablet" ? "768px width" : "375px width"}
            </div>
          </div>
          
          <div 
            className="flex-1 overflow-auto bg-slate-100 p-8 flex justify-center items-start"
          >
            <div
              className="bg-white shadow-xl rounded-2xl overflow-hidden border border-slate-200/80 transition-all duration-300 flex flex-col"
              style={{ 
                width: "100%",
                maxWidth: previewMode === "mobile" ? "375px" : previewMode === "tablet" ? "768px" : "600px",
                height: showHTML ? "calc(100vh - 180px)" : "auto",
                minHeight: showHTML ? "calc(100vh - 180px)" : "100%"
              }}
            >
              {showHTML ? (
                <HtmlCodeEditor
                  html={htmlDraft}
                  onChange={(val) => {
                    setHtmlDraft(val)
                    if (!isHtmlDirty) setIsHtmlDirty(true)
                  }}
                  onApplyChanges={handleApplyHtmlChanges}
                  onResetFromVisual={handleResetHtmlFromVisual}
                  isDirty={isHtmlDirty}
                  validationError={htmlValidationError}
                />
              ) : (
              <CanvasEditor
                blocks={blocks}
                selectedBlock={selectedBlock}
                previewMode={previewMode}
                onSelectBlock={handleSelectBlock}
                onUpdateBlock={updateBlock}
                onDeleteBlock={deleteBlock}
                onMoveBlock={moveBlock}
                onDuplicateBlock={duplicateBlock}
                onEditorInit={setActiveEditor}
                editingImageBlockId={editingImageBlockId}
                onSetEditingImageBlockId={setEditingImageBlockId}
              />
            )}
          </div>
        </div>
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

      {/* Parser Confidence Warning Modal */}
      {showConfidenceWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <h3 className="text-lg font-bold text-red-600 mb-2 flex items-center gap-2">
              <span className="text-xl">⚠️</span> Advanced HTML Warning
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              This template contains advanced or Outlook-specific email HTML formatting. Visual block editing might not preserve all custom CSS and layouts.
            </p>
            {parserWarnings.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4 max-h-32 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-500 mb-1">Detections:</p>
                <ul className="list-disc pl-4 text-xs text-gray-600 space-y-1">
                  {parserWarnings.map((w, idx) => (
                    <li key={idx}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowHTML(true)
                  setShowConfidenceWarning(false)
                }}
              >
                Open HTML Editor
              </Button>
              <Button
                size="sm"
                onClick={() => setShowConfidenceWarning(false)}
              >
                Continue in Visual Mode
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* HTML Rollback Notification */}
      {previousBlocks && (
        <div className="fixed bottom-4 left-4 bg-blue-100 border border-blue-400 text-blue-800 px-4 py-2 rounded-lg shadow-lg z-50">
          <div className="flex items-center gap-2">
            <span className="text-sm">HTML changes applied.</span>
            <Button size="sm" variant="outline" className="bg-white border-blue-300 text-blue-800 hover:bg-blue-50" onClick={handleRestorePreviousVersion}>
              Restore Previous Version
            </Button>
          </div>
        </div>
      )}
      {/* HTML Unsaved Changes Confirmation */}
      {htmlAlert?.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-2xl border border-gray-200">
            <h3 className="text-lg font-bold text-orange-600 mb-2 flex items-center gap-2">
              <span className="text-xl">⚠️</span> Unsaved HTML Changes
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              You have unsaved changes in the HTML editor. What would you like to do?
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  // Discard changes and switch to visual
                  setIsHtmlDirty(false)
                  setHtmlValidationError(null)
                  setShowHTML(false)
                  setHtmlAlert(null)
                }}
              >
                Discard Changes
              </Button>
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={() => {
                  // Apply changes then switch to visual
                  handleApplyHtmlChanges()
                  if (!htmlValidationError) {
                    setShowHTML(false)
                  }
                  setHtmlAlert(null)
                }}
              >
                Apply Changes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHtmlAlert(null)}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
      {/* Global Asset Manager Modal Overlay */}
      {assetPicker.isOpen && (
        <AssetManager
          onSelect={handleSelectAsset}
          onClose={() => setAssetPicker({ isOpen: false, blockId: null, colIdx: null })}
        />
      )}
    </div>
  )
}
