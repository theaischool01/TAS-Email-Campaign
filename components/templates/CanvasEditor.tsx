"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Plus, GripVertical, Trash2, Edit, ChevronUp, ChevronDown, Copy, Link2, Palette, Upload, Loader2, Mail, Compass, Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight, List, ListOrdered, Code } from "lucide-react"
import { Button } from "@/components/ui/button"
import Editor from "@monaco-editor/react"
import { Card } from "@/components/ui/card"
import { sanitizeEmailHTML } from "@/lib/security/html-sanitizer"
import VariablePicker from "./VariablePicker"
import { useUploadThing } from "@/lib/uploadthing"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Underline from "@tiptap/extension-underline"
import Link from "@tiptap/extension-link"
import TextAlign from "@tiptap/extension-text-align"
import Placeholder from "@tiptap/extension-placeholder"
import { TextStyle } from "@tiptap/extension-text-style"
import { Color } from "@tiptap/extension-color"
import { FontFamily } from "@tiptap/extension-font-family"
import { Extension } from "@tiptap/core"

const FontSize = Extension.create({
  name: 'fontSize',
  addOptions() {
    return {
      types: ['textStyle'],
    }
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: element => element.style.fontSize?.replace(/['"]+/g, ''),
            renderHTML: attributes => {
              if (!attributes.fontSize) {
                return {}
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
              }
            },
          },
        },
      },
    ]
  },
})

interface TemplateBlock {
  id: string
  type: string
  content: Record<string, any>
  styles: Record<string, any>
  children?: TemplateBlock[]
}

interface CanvasEditorProps {
  blocks: TemplateBlock[]
  selectedBlock: TemplateBlock | null
  previewMode: "desktop" | "tablet" | "mobile"
  onSelectBlock: (block: TemplateBlock | null) => void
  onUpdateBlock: (blockId: string, updates: Partial<TemplateBlock>) => void
  onDeleteBlock: (blockId: string) => void
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void
  onDuplicateBlock: (blockId: string) => void
  onAddBlock?: (blockType: string, initialContent?: Record<string, any>, initialStyles?: Record<string, any>) => void
  onSave?: () => void
  onEditorInit?: (editor: any) => void
  globalBgColor?: string
  globalWidth?: number
  // Image Edit Mode — single-session tracking
  editingImageBlockId?: string | null
  onSetEditingImageBlockId?: (id: string | null) => void
}

// ─── Resize handle cursor map ───────────────────────────────────────────────
const HANDLE_CURSORS: Record<string, string> = {
  'tl': 'nw-resize',
  'tr': 'ne-resize',
  'bl': 'sw-resize',
  'br': 'se-resize',
}

const MERGE_TAGS = [
  { tag: "first_name", label: "First Name", description: "Contact's first name" },
  { tag: "last_name", label: "Last Name", description: "Contact's last name" },
  { tag: "email", label: "Email", description: "Contact's email address" },
  { tag: "company", label: "Company", description: "Contact's company" },
  { tag: "phone", label: "Phone", description: "Contact's phone number" },
  { tag: "city", label: "City", description: "Contact's city" },
  { tag: "country", label: "Country", description: "Contact's country" },
  { tag: "unsubscribe", label: "Unsubscribe Link", description: "Unsubscribe URL placeholder" },
  { tag: "view_in_browser", label: "View in Browser", description: "Web version link placeholder" }
]

// ─── Eligibility check: is this image block suited for Image Edit Mode? ───────
function isEditEligible(block: TemplateBlock): boolean {
  // Ineligible block types (social icons, decorative etc.)
  if (['social', 'social-follow'].includes(block.type)) return false
  // Ineligible by explicit metadata flag
  if (block.content?.editMode === 'asset') return false
  // Size guard: if both dimensions are explicitly set and very small, skip edit mode
  const w = block.content?.width ?? 0
  const h = block.content?.height
  const unit = block.content?.widthUnit || '%'
  if (unit === 'px' && w > 0 && w < 80) return false
  if (typeof h === 'number' && h > 0 && h < 80) return false
  return true
}

// ─── ImageBlock — self-contained resize + alignment + Image Edit Mode ─────────
interface ImageBlockProps {
  block: TemplateBlock
  isSelected: boolean
  onUpdateBlock: (blockId: string, updates: Partial<TemplateBlock>) => void
  onSelectBlock: (block: TemplateBlock) => void
  editingImageBlockId: string | null
  onSetEditingImageBlockId: (id: string | null) => void
}

function ImageBlock({ block, isSelected, onUpdateBlock, onSelectBlock, editingImageBlockId, onSetEditingImageBlockId }: ImageBlockProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const resizeState = useRef<{
    active: boolean
    handle: string
    startX: number
    startY: number
    startWidth: number
    startHeight: number
    aspectRatio: number
  }>({ active: false, handle: '', startX: 0, startY: 0, startWidth: 0, startHeight: 0, aspectRatio: 1 })

  // Compute display dimensions
  const imgWidth = block.content?.widthUnit === 'px'
    ? (block.content?.width ?? 300) + 'px'
    : (block.content?.width ?? 100) + '%'
  const imgHeight = !block.content?.height || block.content?.height === 'auto'
    ? 'auto'
    : block.content.height + 'px'
  const alignment = block.content?.alignment || 'center'

  // ── Resolve imageSettings with runtime defaults (backward compatible) ─────
  const imgSettings = block.content?.imageSettings || {}
  const imgFit: string = imgSettings.fit || 'fill'
  const imgPosX: number = imgSettings.objectPosition?.x ?? 50
  const imgPosY: number = imgSettings.objectPosition?.y ?? 50
  // Only apply object-fit when not the default fill, but always allow object-position and zoom transforms in editor
  const objectFitStyle: React.CSSProperties = {
    objectFit: (imgFit === 'fill' ? undefined : imgFit) as any,
    objectPosition: `${imgPosX}% ${imgPosY}%`,
    transform: imgSettings.zoom && imgSettings.zoom !== 1 ? `scale(${imgSettings.zoom})` : undefined,
    transformOrigin: `${imgPosX}% ${imgPosY}%`,
  }

  // ── Image Edit Mode state ─────────────────────────────────────────────────
  const isEditing = editingImageBlockId === block.id
  const eligible = isEditEligible(block)

  // Web editor interaction state managed inside Refs for 60fps performance
  const panRef = useRef({
    dragX: 0,
    dragY: 0,
    zoom: imgSettings.zoom ?? 1,
    fit: (imgFit === 'fill' ? 'cover' : imgFit) as 'cover' | 'contain' | 'fill' // default to cover during edit for adjustable bounds
  })

  // Snapshot captured on enter for ESC/Cancel rollback
  const snapshotRef = useRef({
    dragX: 0,
    dragY: 0,
    zoom: imgSettings.zoom ?? 1,
    fit: imgFit as 'cover' | 'contain' | 'fill'
  })

  // Local state representation to sync sliders/toolbar inputs without 60fps lag
  const [sessionZoom, setSessionZoom] = useState(imgSettings.zoom ?? 1)
  const [sessionFit, setSessionFit] = useState<'cover' | 'contain' | 'fill'>(() => imgFit === 'fill' ? 'cover' : imgFit as any)

  const panStateRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startDragX: 0,
    startDragY: 0
  })

  const transformLayerRef = useRef<HTMLDivElement>(null)
  const cropFrameRef = useRef<HTMLDivElement>(null)

  const updateTransformDOM = useCallback(() => {
    if (transformLayerRef.current) {
      const { dragX, dragY, zoom } = panRef.current
      transformLayerRef.current.style.transform = `translate(${dragX}px, ${dragY}px) scale(${zoom})`
    }
  }, [])

  // Sync state from block prop updates (e.g. undo/redo)
  useEffect(() => {
    if (!isEditing) {
      const s = block.content?.imageSettings || {}
      const activeFit = (s.fit || 'fill') as any
      panRef.current = {
        dragX: 0,
        dragY: 0,
        zoom: s.zoom ?? 1,
        fit: activeFit === 'fill' ? 'cover' : activeFit
      }
      setSessionZoom(s.zoom ?? 1)
      setSessionFit(activeFit === 'fill' ? 'cover' : activeFit)
    }
  }, [block.content?.imageSettings, isEditing])

  // ESC key cancels adjustments
  useEffect(() => {
    if (!isEditing) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        panRef.current = { ...snapshotRef.current }
        setSessionZoom(snapshotRef.current.zoom)
        setSessionFit(snapshotRef.current.fit)
        updateTransformDOM()
        onSetEditingImageBlockId(null)
      }
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [isEditing, onSetEditingImageBlockId, updateTransformDOM])

  const enterEditMode = useCallback(() => {
    if (!eligible) return
    
    // Map percentage position coordinates back to absolute pixel offsets
    const imgEl = imgRef.current
    const frameEl = cropFrameRef.current
    let initDragX = 0
    let initDragY = 0

    if (imgEl && frameEl) {
      const imgWidth = imgEl.getBoundingClientRect().width
      const imgHeight = imgEl.getBoundingClientRect().height
      const frameWidth = frameEl.getBoundingClientRect().width
      const frameHeight = frameEl.getBoundingClientRect().height

      const spaceX = imgWidth - frameWidth
      const spaceY = imgHeight - frameHeight

      if (spaceX > 0) {
        initDragX = ((50 - imgPosX) / 100) * spaceX
      }
      if (spaceY > 0) {
        initDragY = ((50 - imgPosY) / 100) * spaceY
      }
    }

    const current = {
      dragX: initDragX,
      dragY: initDragY,
      zoom: imgSettings.zoom ?? 1,
      fit: (imgFit === 'fill' ? 'cover' : imgFit) as 'cover' | 'contain' | 'fill'
    }

    snapshotRef.current = { ...current }
    panRef.current = { ...current }
    setSessionZoom(current.zoom)
    setSessionFit(current.fit)
    onSetEditingImageBlockId(block.id)
    
    // Render initial transform
    setTimeout(updateTransformDOM, 20)
  }, [eligible, imgSettings, imgPosX, imgPosY, imgFit, block.id, onSetEditingImageBlockId, updateTransformDOM])

  const commitEdit = useCallback(() => {
    let finalPosX = 50
    let finalPosY = 50

    const imgEl = imgRef.current
    const frameEl = cropFrameRef.current
    if (imgEl && frameEl) {
      const imgWidth = imgEl.getBoundingClientRect().width
      const imgHeight = imgEl.getBoundingClientRect().height
      const frameWidth = frameEl.getBoundingClientRect().width
      const frameHeight = frameEl.getBoundingClientRect().height

      const spaceX = imgWidth - frameWidth
      const spaceY = imgHeight - frameHeight

      // Translate dragging pixel offsets back into persistent objectPosition coordinates
      if (spaceX > 0) {
        finalPosX = 50 - (panRef.current.dragX / spaceX) * 100
      }
      if (spaceY > 0) {
        finalPosY = 50 - (panRef.current.dragY / spaceY) * 100
      }

      finalPosX = Math.max(0, Math.min(100, finalPosX))
      finalPosY = Math.max(0, Math.min(100, finalPosY))
    }

    onUpdateBlock(block.id, {
      content: {
        ...block.content,
        imageSettings: {
          fit: panRef.current.fit,
          zoom: panRef.current.zoom,
          objectPosition: { x: Math.round(finalPosX), y: Math.round(finalPosY) }
        }
      }
    })
    onSetEditingImageBlockId(null)
  }, [block.id, block.content, onUpdateBlock, onSetEditingImageBlockId])

  const cancelEdit = useCallback(() => {
    panRef.current = { ...snapshotRef.current }
    updateTransformDOM()
    onSetEditingImageBlockId(null)
  }, [onSetEditingImageBlockId, updateTransformDOM])

  // Drag Panning event loop runs outside react state pipeline
  useEffect(() => {
    if (!isEditing) return

    const onPanMove = (e: MouseEvent) => {
      if (!panStateRef.current.active) return
      const { startX, startY, startDragX, startDragY } = panStateRef.current
      
      panRef.current.dragX = startDragX + (e.clientX - startX)
      panRef.current.dragY = startDragY + (e.clientY - startY)

      requestAnimationFrame(updateTransformDOM)
    }

    const onPanUp = () => {
      panStateRef.current.active = false
    }

    document.addEventListener('mousemove', onPanMove)
    document.addEventListener('mouseup', onPanUp)
    return () => {
      document.removeEventListener('mousemove', onPanMove)
      document.removeEventListener('mouseup', onPanUp)
    }
  }, [isEditing, updateTransformDOM])

  const startPan = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    panStateRef.current = {
      active: true,
      startX: e.clientX,
      startY: e.clientY,
      startDragX: panRef.current.dragX,
      startDragY: panRef.current.dragY
    }
  }, [])

  // Resolve live image style (edit mode uses direct transform layer DOM changes, normal mode uses saved)
  const liveObjectFitStyle: React.CSSProperties = isEditing
    ? {}
    : objectFitStyle

  // ── Capture aspect ratio on image load ───────────────────────────────────
  const handleImgLoad = useCallback(() => {
    const img = imgRef.current
    if (img && img.naturalWidth && img.naturalHeight) {
      resizeState.current.aspectRatio = img.naturalWidth / img.naturalHeight
    }
  }, [])

  // ── Mouse event handlers ─────────────────────────────────────────────────
  const startResize = useCallback((e: React.MouseEvent, handle: string) => {
    e.preventDefault()
    e.stopPropagation()

    // Read aspect ratio from natural size; fallback to stored or 2:1
    const img = imgRef.current
    const ar = (img && img.naturalWidth && img.naturalHeight)
      ? img.naturalWidth / img.naturalHeight
      : (resizeState.current.aspectRatio || 2)

    // Current rendered dimensions
    const currentPxWidth = img ? img.getBoundingClientRect().width : (block.content?.width ?? 300)
    const currentPxHeight = img ? img.getBoundingClientRect().height : (block.content?.height || 150)

    resizeState.current = {
      active: true,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      startWidth: currentPxWidth,
      startHeight: currentPxHeight,
      aspectRatio: ar,
    }
  }, [block.content?.width, block.content?.height])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizeState.current.active) return
      const { handle, startX, startY, startWidth, startHeight, aspectRatio } = resizeState.current

      if (handle === 'l' || handle === 'r') {
        const deltaX = handle === 'l' ? startX - e.clientX : e.clientX - startX
        const newWidth = Math.min(600, Math.max(50, startWidth + deltaX))
        if (imgRef.current) {
          imgRef.current.style.width = newWidth + 'px'
        }
      } else if (handle === 't' || handle === 'b') {
        const deltaY = handle === 't' ? startY - e.clientY : e.clientY - startY
        const newHeight = Math.max(30, startHeight + deltaY)
        if (imgRef.current) {
          imgRef.current.style.height = newHeight + 'px'
        }
      } else {
        const deltaX = handle === 'tl' || handle === 'bl'
          ? startX - e.clientX
          : e.clientX - startX
        const newWidth = Math.min(600, Math.max(50, startWidth + deltaX))
        const newHeight = Math.round(newWidth / aspectRatio)
        if (imgRef.current) {
          imgRef.current.style.width = newWidth + 'px'
          imgRef.current.style.height = newHeight + 'px'
        }
      }
    }

    const onMouseUp = (e: MouseEvent) => {
      if (!resizeState.current.active) return
      const { handle, startX, startY, startWidth, startHeight, aspectRatio } = resizeState.current
      resizeState.current.active = false

      let finalWidth = startWidth
      let finalHeight: number | 'auto' = startHeight

      if (handle === 'l' || handle === 'r') {
        const deltaX = handle === 'l' ? startX - e.clientX : e.clientX - startX
        finalWidth = Math.min(600, Math.max(50, startWidth + deltaX))
        finalHeight = block.content?.height || 'auto'
      } else if (handle === 't' || handle === 'b') {
        const deltaY = handle === 't' ? startY - e.clientY : e.clientY - startY
        finalHeight = Math.max(30, startHeight + deltaY)
        finalWidth = block.content?.width ?? 300
      } else {
        const deltaX = handle === 'tl' || handle === 'bl' ? startX - e.clientX : e.clientX - startX
        finalWidth = Math.min(600, Math.max(50, startWidth + deltaX))
        finalHeight = Math.round(finalWidth / aspectRatio)
      }

      onUpdateBlock(block.id, {
        content: {
          ...block.content,
          width: Math.round(finalWidth),
          widthUnit: 'px',
          height: finalHeight === 'auto' ? 'auto' : Math.round(finalHeight),
        }
      })
    }

    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [block.id, block.content, onUpdateBlock])

  // ── Handle style ─────────────────────────────────────────────────────────
  const handleStyle = (position: { top?: string; bottom?: string; left?: string; right?: string }, cursor: string): React.CSSProperties => ({
    position: 'absolute',
    width: '10px',
    height: '10px',
    backgroundColor: '#ffffff',
    border: '2px solid #6366f1',
    borderRadius: '2px',
    cursor,
    zIndex: 20,
    ...position,
  })

  // ── Alignment button style ───────────────────────────────────────────────
  const alignBtnStyle = (active: boolean): React.CSSProperties => ({
    padding: '2px 7px',
    fontSize: '11px',
    fontWeight: 600,
    border: '1px solid #6366f1',
    borderRadius: '3px',
    backgroundColor: active ? '#6366f1' : '#ffffff',
    color: active ? '#ffffff' : '#6366f1',
    cursor: 'pointer',
    lineHeight: 1.4,
  })

  return (
    <div
      ref={wrapperRef}
      style={{ padding: '20px', textAlign: alignment as any, position: 'relative', userSelect: 'none', ...block.styles }}
      onClick={(e) => { e.stopPropagation(); if (!isEditing) onSelectBlock(block) }}
      onDoubleClick={(e) => {
        e.stopPropagation()
        if (eligible) {
          enterEditMode()
        }
        // Ineligible images do nothing on double-click (asset manager is in StylePanel)
      }}
    >
      {/* ── Normal selected toolbar — hidden in edit mode ── */}
      {isSelected && !isEditing && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '4px',
            backgroundColor: '#ffffff',
            border: '1px solid #e5e7eb',
            borderRadius: '5px',
            padding: '3px 5px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
            zIndex: 30,
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {(['left', 'center', 'right'] as const).map((dir) => (
            <button
              key={dir}
              style={alignBtnStyle(alignment === dir)}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onUpdateBlock(block.id, { content: { ...block.content, alignment: dir } })
              }}
              title={dir.charAt(0).toUpperCase() + dir.slice(1)}
            >
              {dir === 'left' ? '⬡ L' : dir === 'center' ? '⬡ C' : '⬡ R'}
            </button>
          ))}
          <span style={{ borderLeft: '1px solid #e5e7eb', margin: '0 2px' }} />
          {eligible && (
            <button
              style={{ ...alignBtnStyle(false), fontSize: '10px', whiteSpace: 'nowrap', padding: '2px 6px' }}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); enterEditMode() }}
              title="Adjust image position and zoom"
            >
              ✎ Adjust
            </button>
          )}
          <span style={{ fontSize: '10px', color: '#9ca3af', alignSelf: 'center', whiteSpace: 'nowrap', marginLeft: 2 }}>
            Drag corners to resize
          </span>
        </div>
      )}

      {/* ── Image Edit Mode toolbar — shown when editing ── */}
      {isEditing && (
        <div
          style={{
            position: 'absolute',
            top: 4,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#1e293b',
            border: '1px solid #334155',
            borderRadius: '8px',
            padding: '5px 10px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
            zIndex: 50,
            whiteSpace: 'nowrap',
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Fit selector */}
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600 }}>Fit</span>
          {(['cover', 'contain', 'fill'] as const).map(f => (
            <button
              key={f}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                panRef.current.fit = f
                setSessionFit(f)
              }}
              style={{
                fontSize: '10px', fontWeight: 600, border: '1px solid',
                borderRadius: '4px', padding: '2px 7px', cursor: 'pointer',
                backgroundColor: sessionFit === f ? '#6366f1' : 'transparent',
                borderColor: sessionFit === f ? '#6366f1' : '#475569',
                color: sessionFit === f ? '#fff' : '#94a3b8',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}

          {/* Zoom slider */}
          <span style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 600, marginLeft: 4 }}>Zoom</span>
          <input
            type="range" min="0.5" max="3" step="0.05"
            value={sessionZoom}
            onMouseDown={(e) => e.stopPropagation()}
            onChange={(e) => {
              const val = parseFloat(e.target.value)
              panRef.current.zoom = val
              setSessionZoom(val)
              updateTransformDOM()
            }}
            style={{ width: '72px', accentColor: '#6366f1' }}
          />
          <span style={{ fontSize: '10px', color: '#64748b', minWidth: '28px' }}>
            {Math.round(sessionZoom * 100)}%
          </span>

          {/* Reset */}
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation()
              panRef.current = { fit: 'fill', zoom: 1, dragX: 0, dragY: 0 }
              setSessionZoom(1)
              setSessionFit('fill')
              updateTransformDOM()
            }}
            style={{ fontSize: '10px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}
            title="Reset to defaults"
          >
            ↺ Reset
          </button>

          <span style={{ borderLeft: '1px solid #334155', height: '16px', margin: '0 2px' }} />

          {/* Cancel */}
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); cancelEdit() }}
            style={{ fontSize: '11px', fontWeight: 600, border: '1px solid #475569', borderRadius: '5px', padding: '3px 10px', cursor: 'pointer', backgroundColor: 'transparent', color: '#94a3b8' }}
          >
            ✕ Cancel
          </button>

          {/* Done */}
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); commitEdit() }}
            style={{ fontSize: '11px', fontWeight: 700, border: 'none', borderRadius: '5px', padding: '3px 12px', cursor: 'pointer', backgroundColor: '#6366f1', color: '#ffffff' }}
          >
            ✓ Done
          </button>
        </div>
      )}

      {/* ── Image container / Crop Mask ── */}
      <div
        ref={cropFrameRef}
        style={{
          position: 'relative',
          display: 'inline-block',
          marginTop: (isSelected || isEditing) ? '40px' : '0',
          // Always crop overflow during editing/adjusting
          overflow: isEditing ? 'hidden' : 'visible',
          cursor: isEditing ? 'grab' : 'default',
          outline: isEditing ? '2px dashed #6366f1' : 'none',
          borderRadius: block.styles?.borderRadius || '8px',
          width: imgWidth,
          height: imgHeight,
        }}
        onMouseDown={isEditing ? startPan : undefined}
      >
        {isEditing ? (
          <div
            ref={transformLayerRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              transformOrigin: 'center center',
            }}
          >
            <img
              ref={imgRef}
              src={block.content?.src || 'https://via.placeholder.com/600x300'}
              alt={block.content?.alt || ''}
              draggable={false}
              style={{
                width: '100%',
                height: '100%',
                display: 'block',
                pointerEvents: 'none',
                objectFit: sessionFit === 'fill' ? undefined : sessionFit,
              }}
            />
          </div>
        ) : (
          <img
            ref={imgRef}
            src={block.content?.src || 'https://via.placeholder.com/600x300'}
            alt={block.content?.alt || ''}
            onLoad={handleImgLoad}
            draggable={false}
            style={{
              width: imgWidth,
              height: imgHeight,
              maxWidth: '100%',
              borderRadius: block.styles?.borderRadius || '8px',
              boxShadow: block.styles?.boxShadow || 'none',
              border: block.styles?.border || 'none',
              display: 'block',
              pointerEvents: 'none',
              ...liveObjectFitStyle,
            }}
          />
        )}

        {/* ── Resize handles — hidden during edit mode ── */}
        {isSelected && !isEditing && (
          <>
            {/* Corners */}
            <div
              style={handleStyle({ top: '-5px', left: '-5px' }, HANDLE_CURSORS['tl'])}
              onMouseDown={(e) => startResize(e, 'tl')}
            />
            <div
              style={handleStyle({ top: '-5px', right: '-5px' }, HANDLE_CURSORS['tr'])}
              onMouseDown={(e) => startResize(e, 'tr')}
            />
            <div
              style={handleStyle({ bottom: '-5px', left: '-5px' }, HANDLE_CURSORS['bl'])}
              onMouseDown={(e) => startResize(e, 'bl')}
            />
            <div
              style={handleStyle({ bottom: '-5px', right: '-5px' }, HANDLE_CURSORS['br'])}
              onMouseDown={(e) => startResize(e, 'br')}
            />
            {/* Sides */}
            <div
              style={handleStyle({ top: '-5px', left: 'calc(50% - 5px)' }, 'n-resize')}
              onMouseDown={(e) => startResize(e, 't')}
            />
            <div
              style={handleStyle({ bottom: '-5px', left: 'calc(50% - 5px)' }, 's-resize')}
              onMouseDown={(e) => startResize(e, 'b')}
            />
            <div
              style={handleStyle({ top: 'calc(50% - 5px)', right: '-5px' }, 'e-resize')}
              onMouseDown={(e) => startResize(e, 'r')}
            />
          </>
        )}
      </div>
    </div>
  )
}

// ─── Main CanvasEditor ───────────────────────────────────────────────────────
export default function CanvasEditor({
  blocks,
  selectedBlock,
  previewMode,
  onSelectBlock,
  onUpdateBlock,
  onDeleteBlock,
  onMoveBlock,
  onDuplicateBlock,
  onAddBlock,
  onSave,
  onEditorInit,
  globalBgColor,
  globalWidth,
  editingImageBlockId,
  onSetEditingImageBlockId,
}: CanvasEditorProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)
  const [canvasPickerOpen, setCanvasPickerOpen] = useState<string | null>(null)
  const [dragOverActive, setDragOverActive] = useState(false)
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null)
  const [activeEditField, setActiveEditField] = useState<{ blockId: string; field: string } | null>(null)
  const [htmlEditorState, setHtmlEditorState] = useState<{ blockId: string; code: string } | null>(null)

  // Autocomplete popup states
  const [autocomplete, setAutocomplete] = useState<{
    active: boolean
    query: string
    triggerPos: number
    triggerChar: string
    coords: { top: number; left: number }
  } | null>(null)
  const [selectIndex, setSelectIndex] = useState(0)
  const [toolbarDropdownOpen, setToolbarDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Keep a mutable ref of autocomplete state so keyboard handler can see freshest values
  const autocompleteRef = useRef(autocomplete)
  useEffect(() => {
    autocompleteRef.current = autocomplete
  }, [autocomplete])

  // Get matching tags for popup suggestions
  const getFilteredSuggestions = useCallback(() => {
    if (!autocomplete) return []
    const q = autocomplete.query.toLowerCase()
    return MERGE_TAGS.filter(item => 
      item.tag.toLowerCase().includes(q) ||
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    )
  }, [autocomplete])

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      FontFamily,
      FontSize,
      Link.configure({
        openOnClick: false
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      Placeholder.configure({
        placeholder: 'Start typing...'
      })
    ],
    content: '',
    onCreate: ({ editor }) => {
      onEditorInit?.(editor)
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        const currentAutocomplete = autocompleteRef.current
        if (currentAutocomplete && currentAutocomplete.active) {
          const suggestions = MERGE_TAGS.filter(item => {
            const q = currentAutocomplete.query.toLowerCase()
            return item.tag.toLowerCase().includes(q) ||
                   item.label.toLowerCase().includes(q) ||
                   item.description.toLowerCase().includes(q)
          })
          
          if (event.key === 'ArrowDown') {
            event.preventDefault()
            setSelectIndex(prev => (prev + 1) % (suggestions.length || 1))
            return true
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            setSelectIndex(prev => (prev - 1 + (suggestions.length || 1)) % (suggestions.length || 1))
            return true
          }
          if (event.key === 'Enter' || event.key === 'Tab') {
            event.preventDefault()
            if (suggestions[selectIndex]) {
              insertMergeTagValue(suggestions[selectIndex].tag)
            }
            return true
          }
          if (event.key === 'Escape') {
            event.preventDefault()
            setAutocomplete(null)
            return true
          }
        }
        return false
      }
    },
    onUpdate: ({ editor }) => {
      const activeId = activeEditField?.blockId || editingBlockId
      const activeField = activeEditField?.field || 'text'
      
      if (activeId) {
        // Sync tiptap HTML state to builder block content
        onUpdateBlock(activeId, {
          content: {
            ...blocks.find(b => b.id === activeId)?.content,
            [activeField]: editor.getHTML()
          }
        })

        // Detect merge tag trigger insertion typing states
        const cursor = editor.state.selection.from
        const textBefore = editor.state.doc.textBetween(Math.max(0, cursor - 20), cursor)
        
        let triggered = false
        let triggerChar = ""
        let triggerPos = -1
        
        if (textBefore.endsWith("{{")) {
          triggered = true
          triggerChar = "{{"
          triggerPos = cursor - 2
        } else if (textBefore.endsWith("{")) {
          // Check we are not triggered by a double opening braces
          if (!textBefore.endsWith("{{")) {
            triggered = true
            triggerChar = "{"
            triggerPos = cursor - 1
          }
        } else if (textBefore.endsWith("/merge")) {
          triggered = true
          triggerChar = "/merge"
          triggerPos = cursor - 6
        } else if (textBefore.endsWith("/tag")) {
          triggered = true
          triggerChar = "/tag"
          triggerPos = cursor - 4
        }
        
        if (triggered) {
          const coords = editor.view.coordsAtPos(cursor)
          const parentRect = editor.view.dom.getBoundingClientRect()
          setAutocomplete({
            active: true,
            query: '',
            triggerPos,
            triggerChar,
            coords: {
              top: coords.bottom - parentRect.top + (editor.view.dom.parentElement?.scrollTop || 0) + 8,
              left: coords.left - parentRect.left
            }
          })
          setSelectIndex(0)
        } else {
          // If autocomplete popup active, update current query search filter dynamically
          const currentAutocomplete = autocompleteRef.current
          if (currentAutocomplete && currentAutocomplete.active) {
            if (cursor < currentAutocomplete.triggerPos) {
              setAutocomplete(null)
            } else {
              const currentQuery = editor.state.doc.textBetween(
                currentAutocomplete.triggerPos + currentAutocomplete.triggerChar.length,
                cursor
              )
              if (currentQuery.includes(' ')) {
                setAutocomplete(null)
              } else {
                setAutocomplete({
                  ...currentAutocomplete,
                  query: currentQuery
                })
              }
            }
          }
        }
      }
    }
  })

  const insertMergeTagValue = useCallback((tag: string) => {
    if (!editor || !autocompleteRef.current) return
    const { triggerPos } = autocompleteRef.current
    const cursor = editor.state.selection.from
    
    // Replace trigger sequence + query characters with merge tag
    editor.commands.deleteRange({ from: triggerPos, to: cursor })
    editor.commands.insertContent(`{{${tag}}}`)
    
    // Clean up autocomplete popup states
    setAutocomplete(null)
    setSelectIndex(0)
    
    // Focus back to editor cursor position
    setTimeout(() => {
      editor.commands.focus()
    }, 10)
  }, [editor])

  // Propagate editor state back to parent when editor instance or active block changes
  useEffect(() => {
    if (editor) {
      onEditorInit?.(editor)
    }
    return () => {
      onEditorInit?.(null)
    }
  }, [editor, editingBlockId, activeEditField, onEditorInit])

  useEffect(() => {
    if (editor) {
      if (activeEditField) {
        const activeBlock = blocks.find(b => b.id === activeEditField.blockId)
        if (activeBlock) {
          const textContent = activeBlock.content?.[activeEditField.field] || ''
          if (editor.getHTML() !== textContent) {
            editor.commands.setContent(textContent)
          }
          setTimeout(() => editor.commands.focus('end'), 50)
        }
      } else if (editingBlockId) {
        const activeBlock = blocks.find(b => b.id === editingBlockId)
        if (activeBlock) {
          const textContent = activeBlock.content?.text || ''
          if (editor.getHTML() !== textContent) {
            editor.commands.setContent(textContent)
          }
          setTimeout(() => editor.commands.focus('end'), 50)
        }
      }
    }
  }, [editingBlockId, activeEditField, editor])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable
      
      // Do not run delete or key checks if autocomplete list popup is active
      if (autocompleteRef.current?.active) return

      if (e.key === 'Escape') {
        setEditingBlockId(null)
        setActiveEditField(null)
        onSelectBlock(null)
        setHtmlEditorState(null)
        return
      }

      if (isInput) return

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBlock) {
          onDeleteBlock(selectedBlock.id)
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        if (selectedBlock) {
          onDuplicateBlock(selectedBlock.id)
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        if (onSave) {
          onSave()
        }
      }
    }

    const handleMouseDownOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // If clicked on formatting toolbar, variable picker, Monaco code area, or inside tiptap editor/inputs, do not cancel
      if (
        target.closest('.tiptap-wysiwyg') || 
        target.closest('.monaco-editor') ||
        target.closest('button') || 
        target.closest('input') || 
        target.closest('textarea') || 
        target.closest('[role="dialog"]') ||
        target.closest('.variable-picker-popover')
      ) {
        return
      }
      setEditingBlockId(null)
      setActiveEditField(null)
      setHtmlEditorState(null)
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('mousedown', handleMouseDownOutside)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('mousedown', handleMouseDownOutside)
    }
  }, [selectedBlock, onDeleteBlock, onDuplicateBlock, onSelectBlock, onSave])

  const { startUpload, isUploading: isCanvasUploading } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res) => {
      setDragOverActive(false)
      if (res && res[0] && onAddBlock) {
        onAddBlock("image", { src: res[0].url, alt: res[0].name || "Uploaded Image" })
      }
    },
    onUploadError: (err) => {
      console.error(err)
      setDragOverActive(false)
      alert(`Canvas image upload failed: ${err.message}`)
    }
  })

  const handleCanvasDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverActive(true)
  }

  const handleCanvasDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOverActive(false)
  }

  const handleCanvasDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(f => f.type.startsWith("image/"))
    if (imageFiles.length > 0) {
      if (imageFiles[0].size > 4 * 1024 * 1024) {
        alert("Dropped image exceeds 4MB size limit.")
        setDragOverActive(false)
        return
      }
      startUpload([imageFiles[0]])
    } else {
      setDragOverActive(false)
    }
  }

  const renderColumnCell = (block: TemplateBlock, colIdx: 1 | 2 | 3, defaultText: string, fontSizeClass = 'text-sm') => {
    const colType = block.content[`col${colIdx}Type`] || 'text'
    const textField = `text${colIdx}`
    
    if (colType === 'image') {
      const src = block.content[`col${colIdx}ImageSrc`] || 'https://via.placeholder.com/150'
      const alt = block.content[`col${colIdx}ImageAlt`] || ''
      const width = block.content[`col${colIdx}ImageWidth`] || '100'
      const widthUnit = block.content[`col${colIdx}ImageWidthUnit`] || '%'
      const align = block.content[`col${colIdx}ImageAlignment`] || 'center'
      
      return (
        <div style={{ textAlign: align as any }}>
          <img 
            src={src} 
            alt={alt} 
            style={{ 
              width: `${width}${widthUnit}`, 
              maxWidth: '100%', 
              height: 'auto',
              borderRadius: block.styles?.borderRadius || '8px',
              border: block.styles?.border || 'none',
              boxShadow: block.styles?.boxShadow || 'none',
              display: 'inline-block'
            }} 
          />
        </div>
      )
    }
    
    if (colType === 'button') {
      const btnText = block.content[`col${colIdx}ButtonText`] || 'Click Here'
      const btnUrl = block.content[`col${colIdx}ButtonUrl`] || '#'
      const btnBg = block.content[`col${colIdx}ButtonBg`] || '#007bff'
      const btnColor = block.content[`col${colIdx}ButtonColor`] || '#ffffff'
      const align = block.content[`col${colIdx}ButtonAlignment`] || 'center'
      
      return (
        <div style={{ textAlign: align as any }}>
          <button
            style={{
              backgroundColor: btnBg,
              color: btnColor,
              padding: '8px 16px',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '12px',
              display: 'inline-block',
              textDecoration: 'none'
            }}
            onClick={(e) => e.preventDefault()}
          >
            {btnText}
          </button>
        </div>
      )
    }
    
    // Default text type Tiptap
    return (
      <div 
        style={{ border: '1px dashed #e5e7eb', padding: '10px', minHeight: '50px', fontSize: fontSizeClass === 'text-xs' ? '12px' : '13px' }}
        onDoubleClick={() => setActiveEditField({ blockId: block.id, field: textField })}
      >
        {activeEditField?.blockId === block.id && activeEditField?.field === textField && editor ? (
          <EditorContent editor={editor} className="outline-none tiptap-wysiwyg" />
        ) : (
          <div 
            className="tiptap-wysiwyg"
            dangerouslySetInnerHTML={{ __html: block.content[textField] || defaultText }}
          />
        )}
      </div>
    )
  }

  const renderBlock = (block: TemplateBlock) => {
    const isSelected = selectedBlock?.id === block.id
    const styles = Object.entries(block.styles)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ')

    const blockStyle: React.CSSProperties = {
      position: 'relative',
      transition: 'all 0.2s ease-in-out'
    }

    const renderContent = () => {
      switch (block.type) {
        case 'header':
          return (
            <div 
              style={{ padding: '20px', textAlign: 'center', ...block.styles }}
              onDoubleClick={() => setEditingBlockId(block.id)}
            >
              {editingBlockId === block.id && editor ? (
                <EditorContent editor={editor} className="outline-none text-center tiptap-wysiwyg" />
              ) : (
                <h1 
                  style={{ margin: 0, fontSize: '24px', color: block.styles.color || '#ffffff' }}
                  className="tiptap-wysiwyg"
                  dangerouslySetInnerHTML={{ __html: block.content.text || 'Double click to edit header...' }}
                />
              )}
            </div>
          )
        case 'text':
          return (
            <div 
              style={{ 
                padding: '20px', 
                fontFamily: 'Arial, sans-serif', 
                fontSize: '14px', 
                lineHeight: '1.6',
                color: block.styles.color || '#333333',
                ...block.styles 
              }}
              onDoubleClick={() => setEditingBlockId(block.id)}
            >
              {editingBlockId === block.id && editor ? (
                <EditorContent editor={editor} className="outline-none text-left tiptap-wysiwyg" />
              ) : (
                <div 
                  className="tiptap-wysiwyg"
                  dangerouslySetInnerHTML={{ __html: block.content.text || 'Double click to edit paragraph content...' }} 
                />
              )}
            </div>
          )
        case 'button':
          return (
            <div style={{ padding: '20px', textAlign: 'center', ...block.styles }}>
              <button
                style={{
                  backgroundColor: block.content.backgroundColor || '#007bff',
                  color: block.content.color || '#ffffff',
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
                onClick={(e) => e.preventDefault()}
              >
                {block.content.text}
              </button>
            </div>
          )
        case 'image':
          // Rendered by dedicated ImageBlock component (handles resize + alignment + edit mode)
          return (
            <ImageBlock
              block={block}
              isSelected={isSelected}
              onUpdateBlock={onUpdateBlock}
              onSelectBlock={onSelectBlock}
              editingImageBlockId={editingImageBlockId ?? null}
              onSetEditingImageBlockId={onSetEditingImageBlockId ?? (() => {})}
            />
          )
        case 'divider':
          return (
            <div style={{ padding: '20px 0', textAlign: 'center' }}>
              <hr style={{
                border: 'none',
                borderTop: '1px solid #e5e7eb',
                width: '100%',
                ...block.styles
              }} />
            </div>
          )
        case 'spacer':
          return (
            <div style={{
              height: block.content.height || '20px',
              lineHeight: block.content.height || '20px',
              fontSize: block.content.height || '20px',
              ...block.styles
            }}>
              &nbsp;
            </div>
          )
        case '2column':
          const ratioVal = block.content.layoutRatio || "50/50"
          const [w1, w2] = ratioVal.split('/').map((s: string) => s.trim() + '%')
          return (
            <div style={{ padding: '10px', display: 'table', width: '100%', tableLayout: 'fixed', ...block.styles }}>
              <div style={{ display: 'table-row' }}>
                <div style={{ display: 'table-cell', width: w1, padding: '10px', verticalAlign: 'top' }}>
                  {renderColumnCell(block, 1, "Column 1 (Double click)", 'text-sm')}
                </div>
                <div style={{ display: 'table-cell', width: w2, padding: '10px', verticalAlign: 'top' }}>
                  {renderColumnCell(block, 2, "Column 2 (Double click)", 'text-sm')}
                </div>
              </div>
            </div>
          )
        case '3column':
          return (
            <div style={{ padding: '10px', display: 'table', width: '100%', tableLayout: 'fixed', ...block.styles }}>
              <div style={{ display: 'table-row' }}>
                <div style={{ display: 'table-cell', width: '33.33%', padding: '10px', verticalAlign: 'top' }}>
                  {renderColumnCell(block, 1, "Col 1 (Double click)", 'text-xs')}
                </div>
                <div style={{ display: 'table-cell', width: '33.33%', padding: '10px', verticalAlign: 'top' }}>
                  {renderColumnCell(block, 2, "Col 2 (Double click)", 'text-xs')}
                </div>
                <div style={{ display: 'table-cell', width: '33.34%', padding: '10px', verticalAlign: 'top' }}>
                  {renderColumnCell(block, 3, "Col 3 (Double click)", 'text-xs')}
                </div>
              </div>
            </div>
          )
        case 'social':
        case 'social-follow':
          const socialLayout = block.content?.layout || (block.type === 'social-follow' ? 'follow-section' : 'icons-only')
          const socialHeading = block.content?.heading || ''
          const socialDesc = block.content?.description || ''
          const socialAlign = block.content?.alignment || 'center'
          const iconSz = block.content?.iconSize || 32
          const iconSpc = block.content?.spacing !== undefined ? block.content.spacing : 12
          const iconStyle = block.content?.iconStyle || 'brand'
          const socialEnabled = block.content?.enabledNetworks || { linkedin: true, instagram: true, youtube: true }
          const socialUrls = block.content?.urls || {}

          const ALL_NETWORKS = [
            { id: 'facebook', label: 'Facebook' },
            { id: 'twitter', label: 'X' },
            { id: 'linkedin', label: 'LinkedIn' },
            { id: 'instagram', label: 'Instagram' },
            { id: 'youtube', label: 'YouTube' },
            { id: 'pinterest', label: 'Pinterest' },
            { id: 'tiktok', label: 'TikTok' },
            { id: 'github', label: 'GitHub' },
            { id: 'whatsapp', label: 'WhatsApp' },
            { id: 'telegram', label: 'Telegram' },
            { id: 'discord', label: 'Discord' },
            { id: 'website', label: 'Website' },
            { id: 'email', label: 'Email' },
          ]

          const BRAND_ICONS: Record<string, string> = {
            facebook: 'https://img.icons8.com/color/48/facebook-new.png',
            twitter: 'https://img.icons8.com/color/48/twitterx--v1.png',
            linkedin: 'https://img.icons8.com/color/48/linkedin.png',
            instagram: 'https://img.icons8.com/color/48/instagram-new.png',
            youtube: 'https://img.icons8.com/color/48/youtube-play.png',
            pinterest: 'https://img.icons8.com/color/48/pinterest.png',
            tiktok: 'https://img.icons8.com/color/48/tiktok.png',
            github: 'https://img.icons8.com/color/48/github--v1.png',
            whatsapp: 'https://img.icons8.com/color/48/whatsapp.png',
            telegram: 'https://img.icons8.com/color/48/telegram-app.png',
            discord: 'https://img.icons8.com/color/48/discord-logo.png',
            website: 'https://img.icons8.com/color/48/domain.png',
            email: 'https://img.icons8.com/color/48/new-post.png',
          }
          const MONO_ICONS: Record<string, string> = {
            facebook: 'https://img.icons8.com/ios-filled/48/333333/facebook-new.png',
            twitter: 'https://img.icons8.com/ios-filled/48/333333/twitterx.png',
            linkedin: 'https://img.icons8.com/ios-filled/48/333333/linkedin.png',
            instagram: 'https://img.icons8.com/ios-filled/48/333333/instagram-new.png',
            youtube: 'https://img.icons8.com/ios-filled/48/333333/youtube-play.png',
            pinterest: 'https://img.icons8.com/ios-filled/48/333333/pinterest.png',
            tiktok: 'https://img.icons8.com/ios-filled/48/333333/tiktok.png',
            github: 'https://img.icons8.com/ios-filled/48/333333/github.png',
            whatsapp: 'https://img.icons8.com/ios-filled/48/333333/whatsapp.png',
            telegram: 'https://img.icons8.com/ios-filled/48/333333/telegram-app.png',
            discord: 'https://img.icons8.com/ios-filled/48/333333/discord-logo.png',
            website: 'https://img.icons8.com/ios-filled/48/333333/domain.png',
            email: 'https://img.icons8.com/ios-filled/48/333333/new-post.png',
          }

          const getIconUrl = (id: string) => {
            if (iconStyle === 'monochrome') return MONO_ICONS[id] || MONO_ICONS.website
            return BRAND_ICONS[id] || BRAND_ICONS.website
          }

          const flexJustify = socialAlign === 'left' ? 'flex-start' : socialAlign === 'right' ? 'flex-end' : 'center'
          const textAlignVal = socialAlign as 'left' | 'center' | 'right'

          const activeNets = ALL_NETWORKS.filter(n => socialEnabled[n.id])

          return (
            <div
              style={{ padding: '20px', textAlign: textAlignVal, width: '100%', boxSizing: 'border-box', ...block.styles }}
              onDoubleClick={() => socialLayout === 'follow-section' && setEditingBlockId(block.id)}
            >
              {/* Heading – follow-section only */}
              {socialLayout === 'follow-section' && (
                <>
                  {editingBlockId === block.id && editor ? (
                    <div style={{ marginBottom: '10px' }}>
                      <EditorContent editor={editor} className="outline-none tiptap-wysiwyg" style={{ textAlign: textAlignVal }} />
                    </div>
                  ) : (
                    <>
                      {socialHeading && (
                        <h3
                          style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: 'bold', color: block.styles?.color || '#1e293b', textAlign: textAlignVal }}
                          dangerouslySetInnerHTML={{ __html: socialHeading }}
                        />
                      )}
                      {socialDesc && (
                        <p
                          style={{ margin: '0 0 16px 0', fontSize: '13px', color: block.styles?.color || '#64748b', textAlign: textAlignVal, lineHeight: '1.5' }}
                          dangerouslySetInnerHTML={{ __html: socialDesc }}
                        />
                      )}
                    </>
                  )}
                </>
              )}

              {/* Icons row */}
              {activeNets.length > 0 ? (
                <div style={{ display: 'flex', justifyContent: flexJustify, alignItems: 'center', flexWrap: 'wrap', gap: `${iconSpc}px` }}>
                  {activeNets.map(net => {
                    const href = socialUrls[net.id] || block.content?.[net.id] || ''
                    const imgEl = (
                      <img
                        key={net.id}
                        src={getIconUrl(net.id)}
                        alt={net.label}
                        title={net.label}
                        style={{ width: `${iconSz}px`, height: `${iconSz}px`, display: 'block', border: 'none' }}
                      />
                    )
                    return href ? (
                      <a key={net.id} href={href} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', textDecoration: 'none' }}>
                        {imgEl}
                      </a>
                    ) : (
                      <span key={net.id} style={{ display: 'inline-block', opacity: 0.7 }}>{imgEl}</span>
                    )
                  })}
                </div>
              ) : (
                <div style={{ color: '#94a3b8', fontSize: '12px', fontStyle: 'italic', textAlign: textAlignVal }}>
                  Enable networks in the Social Settings panel →
                </div>
              )}
            </div>
          )
        case 'footer':
          return (
            <div style={{ 
              padding: '20px', 
              textAlign: 'center', 
              backgroundColor: '#f8f9fa', 
              color: '#6c757d', 
              fontSize: '12px',
              ...block.styles 
            }}>
              <div 
                style={{ border: '1px dashed #e5e7eb', padding: '4px', margin: '0 0 10px 0', fontSize: '11px' }}
                onDoubleClick={() => setActiveEditField({ blockId: block.id, field: 'unsubscribeText' })}
              >
                {activeEditField?.blockId === block.id && activeEditField?.field === 'unsubscribeText' && editor ? (
                  <EditorContent editor={editor} className="outline-none tiptap-wysiwyg" />
                ) : (
                  <div 
                    className="tiptap-wysiwyg"
                    dangerouslySetInnerHTML={{ __html: block.content?.unsubscribeText || "You received this email because you're subscribed to our newsletter." }}
                  />
                )}
              </div>
              <p style={{ margin: '0 0 10px 0', fontSize: '11px' }}>
                <a href="#" style={{ color: '#6c757d', textDecoration: 'underline', marginRight: '10px' }}>Unsubscribe</a>
                <a href="#" style={{ color: '#6c757d', textDecoration: 'underline', marginRight: '10px' }}>Privacy Policy</a>
                <a href="#" style={{ color: '#6c757d', textDecoration: 'underline' }}>Terms of Service</a>
              </p>
              <div 
                style={{ border: '1px dashed #e5e7eb', padding: '4px', margin: '0 0 5px 0', fontSize: '11px' }}
                onDoubleClick={() => setActiveEditField({ blockId: block.id, field: 'company' })}
              >
                {activeEditField?.blockId === block.id && activeEditField?.field === 'company' && editor ? (
                  <EditorContent editor={editor} className="outline-none tiptap-wysiwyg" />
                ) : (
                  <div 
                    className="tiptap-wysiwyg"
                    dangerouslySetInnerHTML={{ __html: block.content?.company || "Your Company Name" }}
                  />
                )}
              </div>
              <div 
                style={{ border: '1px dashed #e5e7eb', padding: '4px', margin: '0 0 5px 0', fontSize: '10px' }}
                onDoubleClick={() => setActiveEditField({ blockId: block.id, field: 'address' })}
              >
                {activeEditField?.blockId === block.id && activeEditField?.field === 'address' && editor ? (
                  <EditorContent editor={editor} className="outline-none tiptap-wysiwyg" />
                ) : (
                  <div 
                    className="tiptap-wysiwyg"
                    dangerouslySetInnerHTML={{ __html: block.content?.address || "123 Business St, City, State 12345" }}
                  />
                )}
              </div>
              <div 
                style={{ border: '1px dashed #e5e7eb', padding: '4px', margin: '0', fontSize: '10px', borderTop: '1px solid #dee2e6', paddingTop: '10px' }}
                onDoubleClick={() => setActiveEditField({ blockId: block.id, field: 'copyright' })}
              >
                {activeEditField?.blockId === block.id && activeEditField?.field === 'copyright' && editor ? (
                  <EditorContent editor={editor} className="outline-none tiptap-wysiwyg" />
                ) : (
                  <div 
                    className="tiptap-wysiwyg"
                    dangerouslySetInnerHTML={{ __html: block.content?.copyright || `© ${new Date().getFullYear()} Your Company Name. All rights reserved.` }}
                  />
                )}
              </div>
            </div>
          )
        case 'html':
          const isEditingHtml = htmlEditorState?.blockId === block.id
          return (
            <div 
              style={{ padding: '20px', position: 'relative' }}
              onDoubleClick={(e) => {
                e.stopPropagation()
                setHtmlEditorState({ blockId: block.id, code: block.content?.html || '' })
              }}
            >
              {isEditingHtml ? (
                <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 shadow-xl space-y-3 z-30">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                    <span className="text-xs font-mono font-bold text-slate-400">Edit Custom HTML</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setHtmlEditorState(null)
                        }}
                        className="px-3 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          onUpdateBlock(block.id, { content: { ...block.content, html: htmlEditorState.code } })
                          setHtmlEditorState(null)
                        }}
                        className="px-3 py-1 text-xs font-bold rounded bg-indigo-600 hover:bg-indigo-750 text-white transition-colors cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                  <div className="w-full h-[300px] border border-slate-800 rounded overflow-hidden">
                    <Editor
                      height="100%"
                      defaultLanguage="html"
                      language="html"
                      theme="vs-dark"
                      value={htmlEditorState.code}
                      onChange={(val) => setHtmlEditorState({ ...htmlEditorState, code: val || '' })}
                      options={{
                        wordWrap: "on",
                        lineNumbers: "on",
                        minimap: { enabled: false },
                        autoClosingBrackets: "always",
                        tabSize: 2,
                        fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                        fontSize: 12,
                        formatOnPaste: true,
                        formatOnType: true,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <>
                  {block.content?.html ? (
                    <div
                      style={{
                        width: '100%',
                        overflow: 'auto',
                        border: '1px solid #e2e8f0',
                        borderRadius: '4px',
                        padding: '8px'
                      }}
                      dangerouslySetInnerHTML={{ __html: sanitizeEmailHTML(block.content.html) }}
                    />
                  ) : (
                    <div style={{ border: '1px dashed #ccc', padding: '10px', minHeight: '50px', backgroundColor: '#f9f9f9' }}>
                      <div style={{ color: '#666', fontSize: '12px', fontFamily: 'monospace' }}>
                        Double click to write custom HTML...
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )
        default:
          return (
            <div style={{ padding: '20px', backgroundColor: '#f9f9f9', border: '1px dashed #ccc' }}>
              <div style={{ color: '#666', textAlign: 'center' }}>
                Unknown block type: {block.type}
              </div>
            </div>
          )
      }
    }

    return (
      <div
        key={block.id}
        style={blockStyle}
        onClick={() => onSelectBlock(block)}
        onMouseDown={(e) => {
          if (e.target === e.currentTarget || e.currentTarget.contains(e.target as Node)) {
            setDraggedBlockId(block.id)
            setIsDragging(true)
          }
        }}
        className={`cursor-pointer rounded-lg border-2 shadow-sm transition-all duration-200 ${
          isSelected 
            ? 'border-red-500 bg-red-550/5 shadow-md' 
            : 'border-slate-100 hover:border-red-200 hover:bg-slate-50/30'
        }`}
      >
        {/* Floating Formatting Toolbar for Text/Header/Column/Footer Components */}
        {(editingBlockId === block.id || activeEditField?.blockId === block.id) && editor && (
          <div 
            className="absolute -top-14 left-1/2 -translate-x-1/2 flex flex-wrap items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg shadow-xl px-2.5 py-1.5 z-50 text-white select-none animate-in fade-in slide-in-from-bottom-2 duration-150 w-max max-w-[580px]"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
          >
            {/* Inline typography options */}
            <select
              value={editor.getAttributes('textStyle').fontFamily || 'Arial'}
              onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
              className="bg-slate-800 text-slate-200 border border-slate-750 text-[10px] rounded px-1.5 py-0.5 outline-none font-sans cursor-pointer"
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
            </select>

            <select
              value={editor.getAttributes('textStyle').fontSize || '16px'}
              onChange={(e) => editor.chain().focus().setMark('textStyle', { fontSize: e.target.value }).run()}
              className="bg-slate-800 text-slate-200 border border-slate-750 text-[10px] rounded px-1.5 py-0.5 outline-none cursor-pointer"
            >
              {[12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48].map(sz => (
                <option key={sz} value={`${sz}px`}>{sz}px</option>
              ))}
            </select>

            <input
              type="color"
              value={editor.getAttributes('textStyle').color || '#000000'}
              onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
              className="w-4 h-4 rounded border-none bg-transparent cursor-pointer p-0"
              title="Text Color"
            />

            <div className="w-px h-4 bg-slate-800" />

            <button
              type="button"
              className={`p-1 rounded transition-colors ${editor.isActive('bold') ? 'bg-red-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
              onClick={() => editor.chain().focus().toggleBold().run()}
              title="Bold"
            >
              <Bold className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={`p-1 rounded transition-colors ${editor.isActive('italic') ? 'bg-red-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              title="Italic"
            >
              <Italic className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={`p-1 rounded transition-colors ${editor.isActive('underline') ? 'bg-red-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              title="Underline"
            >
              <UnderlineIcon className="h-3.5 w-3.5" />
            </button>

            <div className="w-px h-4 bg-slate-800" />

            <button
              type="button"
              className={`p-1 rounded transition-colors ${editor.isActive({ textAlign: 'left' }) ? 'bg-red-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              title="Align Left"
            >
              <AlignLeft className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={`p-1 rounded transition-colors ${editor.isActive({ textAlign: 'center' }) ? 'bg-red-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              title="Align Center"
            >
              <AlignCenter className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={`p-1 rounded transition-colors ${editor.isActive({ textAlign: 'right' }) ? 'bg-red-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              title="Align Right"
            >
              <AlignRight className="h-3.5 w-3.5" />
            </button>

            <div className="w-px h-4 bg-slate-800" />

            <button
              type="button"
              className={`p-1 rounded transition-colors ${editor.isActive('bulletList') ? 'bg-red-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              title="Bullet List"
            >
              <List className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              className={`p-1 rounded transition-colors ${editor.isActive('orderedList') ? 'bg-red-600 text-white' : 'hover:bg-slate-800 text-slate-300'}`}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              title="Numbered List"
            >
              <ListOrdered className="h-3.5 w-3.5" />
            </button>

            <div className="w-px h-4 bg-slate-800" />

            <button
              type="button"
              className={`p-1 rounded hover:bg-slate-800 text-slate-300`}
              onClick={() => {
                const url = prompt("Enter link URL:")
                if (url) {
                  editor.chain().focus().setLink({ href: url }).run()
                } else {
                  editor.chain().focus().unsetLink().run()
                }
              }}
              title="Link"
            >
              <Link2 className="h-3.5 w-3.5" />
            </button>

            <div className="relative">
              <button
                type="button"
                className="p-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors flex items-center justify-center font-bold text-[11px]"
                onClick={() => setCanvasPickerOpen(canvasPickerOpen === block.id ? null : block.id)}
                title="Insert variable"
              >
                {"{}"}
              </button>
              {canvasPickerOpen === block.id && (
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2">
                  <VariablePicker
                    onSelect={(tagValue) => {
                      editor.chain().focus().insertContent(tagValue).run()
                      setCanvasPickerOpen(null)
                    }}
                    onClose={() => setCanvasPickerOpen(null)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Block Controls */}
        <div
          className={`absolute top-2 right-2 flex gap-1 ${isSelected ? 'opacity-100' : 'opacity-0'} hover:opacity-100 transition-all duration-200 z-40`}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Movement Controls */}
          <div className="flex flex-col gap-1 bg-white rounded-md shadow-sm border border-gray-200 p-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-gray-100 disabled:opacity-50"
              onClick={() => onMoveBlock(block.id, 'up')}
              disabled={blocks.findIndex(b => b.id === block.id) === 0}
              title="Move up"
            >
              <ChevronUp className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-gray-100 disabled:opacity-50"
              onClick={() => onMoveBlock(block.id, 'down')}
              disabled={blocks.findIndex(b => b.id === block.id) === blocks.length - 1}
              title="Move down"
            >
              <ChevronDown className="h-3 w-3" />
            </Button>
          </div>
          
          {/* Action Controls */}
          <div className="flex gap-1 bg-white rounded-md shadow-sm border border-gray-200 p-1">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-gray-100"
              onClick={() => onDuplicateBlock(block.id)}
              title="Duplicate"
            >
              <Copy className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-gray-100"
              onClick={() => onSelectBlock(block)}
              title="Edit"
            >
              <Edit className="h-3 w-3" />
            </Button>
            {block.type === 'html' && (
              <Button
                size="sm"
                variant="ghost"
                className="h-6 w-6 p-0 hover:bg-gray-100 text-indigo-650"
                onClick={() => setHtmlEditorState({ blockId: block.id, code: block.content?.html || '' })}
                title="Edit HTML Code"
              >
                <Code className="h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0 hover:bg-red-50 text-red-600"
              onClick={() => onDeleteBlock(block.id)}
              title="Delete"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Drag Handle */}
        {isSelected && (
          <div
            className="absolute top-2 left-2 cursor-move bg-white rounded-md shadow-sm border border-gray-200 p-1 hover:bg-gray-50 transition-colors z-40"
            onMouseDown={(e) => {
              e.stopPropagation()
              setDraggedBlockId(block.id)
              setIsDragging(true)
            }}
            title="Drag to reorder"
          >
            <GripVertical className="h-4 w-4 text-gray-500" />
          </div>
        )}

        {/* Block Content */}
        {renderContent()}
      </div>
    )
  }

  // Defensive check - ensure blocks is always an array
  if (!Array.isArray(blocks) || blocks.length === 0) {
    return (
      <div 
        className="h-full w-full flex items-center justify-center p-8 bg-slate-50/20 relative"
        onDragOver={handleCanvasDragOver}
        onDragLeave={handleCanvasDragLeave}
        onDrop={handleCanvasDrop}
      >
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200/80 p-8 shadow-lg text-center flex flex-col items-center">
          <div className="w-16 h-16 rounded-3xl bg-blue-50/60 border border-blue-100 flex items-center justify-center mb-5 shadow-inner">
            <Mail className="h-7 w-7 text-blue-600 animate-pulse" />
          </div>
          <h3 className="text-base font-bold text-slate-800 mb-2">Start Building Your Email</h3>
          <p className="text-xs text-slate-450 max-w-xs mx-auto mb-6 leading-relaxed">
            Choose from professionally pre-styled sections in the left sidebar, drag files to upload directly, or use the quick additions below.
          </p>
          
          <div className="grid grid-cols-2 gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              className="h-10 border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-semibold text-slate-700 text-xs shadow-none gap-1.5"
              onClick={() => onAddBlock?.("header")}
            >
              <Plus className="h-3 w-3 text-slate-500" />
              Add Header
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-semibold text-slate-700 text-xs shadow-none gap-1.5"
              onClick={() => onAddBlock?.("header", { text: "🚀 Get Started Today" }, { textAlign: "center", padding: "40px 24px", backgroundColor: "#1e293b", color: "#ffffff", fontSize: "24px", fontWeight: "800" })}
            >
              <Plus className="h-3 w-3 text-slate-500" />
              Add Hero
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-semibold text-slate-700 text-xs shadow-none gap-1.5"
              onClick={() => onAddBlock?.("button")}
            >
              <Plus className="h-3 w-3 text-slate-500" />
              Add CTA
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-10 border-slate-200 hover:bg-slate-50 hover:border-slate-300 font-semibold text-slate-700 text-xs shadow-none gap-1.5"
              onClick={() => onAddBlock?.("footer")}
            >
              <Plus className="h-3 w-3 text-slate-500" />
              Add Footer
            </Button>
          </div>
        </div>

        {dragOverActive && (
          <div className="absolute inset-0 bg-indigo-650/10 border-4 border-dashed border-indigo-500 rounded-xl flex flex-col items-center justify-center z-50 backdrop-blur-[1px] transition-all">
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-indigo-100 text-center flex flex-col items-center max-w-xs animate-in zoom-in-95">
              <Upload className="h-8 w-8 text-indigo-600 animate-bounce mb-3" />
              <h4 className="text-xs font-bold text-slate-800">Drop Image to Upload</h4>
              <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">
                Automatically upload via UploadThing and insert it as an image component block.
              </p>
            </div>
          </div>
        )}

        {isCanvasUploading && (
          <div className="absolute inset-0 bg-slate-900/40 rounded-xl flex flex-col items-center justify-center z-50 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 text-center flex flex-col items-center max-w-xs animate-in zoom-in-95">
              <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mb-3" />
              <h4 className="text-xs font-bold text-slate-800">Uploading Image</h4>
              <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">
                Processing image routing on UploadThing servers. Please wait...
              </p>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="h-full overflow-auto p-8 relative transition-all duration-200"
      style={{ backgroundColor: globalBgColor || '#f3f4f6' }}
      onDragOver={handleCanvasDragOver}
      onDragLeave={handleCanvasDragLeave}
      onDrop={handleCanvasDrop}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        .tiptap-wysiwyg ul {
          list-style-type: disc !important;
          padding-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .tiptap-wysiwyg ol {
          list-style-type: decimal !important;
          padding-left: 1.5rem !important;
          margin-top: 0.5rem !important;
          margin-bottom: 0.5rem !important;
        }
        .tiptap-wysiwyg li {
          display: list-item !important;
          margin-bottom: 0.25rem !important;
        }
        .tiptap-wysiwyg p {
          margin-top: 0 !important;
          margin-bottom: 0.5rem !important;
        }
        .tiptap-wysiwyg p:last-child {
          margin-bottom: 0 !important;
        }
        .tiptap-wysiwyg h1,
        .tiptap-wysiwyg h2,
        .tiptap-wysiwyg h3,
        .tiptap-wysiwyg h4,
        .tiptap-wysiwyg h5,
        .tiptap-wysiwyg h6 {
          margin-top: 0 !important;
          margin-bottom: 0.5rem !important;
        }
        .tiptap-wysiwyg h1:last-child,
        .tiptap-wysiwyg h2:last-child,
        .tiptap-wysiwyg h3:last-child,
        .tiptap-wysiwyg h4:last-child,
        .tiptap-wysiwyg h5:last-child,
        .tiptap-wysiwyg h6:last-child {
          margin-bottom: 0 !important;
        }
      `}} />
      <div 
        style={{ 
          margin: '0 auto', 
          maxWidth: `${globalWidth || 600}px`, 
          width: '100%',
          backgroundColor: '#ffffff', 
          borderRadius: '16px', 
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', 
          border: '1px solid #e4e4e7',
          overflow: 'hidden',
          minHeight: '100%'
        }}
      >
        <div className="space-y-0">
          {blocks.map(renderBlock)}
        </div>
      </div>

      {dragOverActive && (
        <div className="absolute inset-0 bg-indigo-655/10 border-4 border-dashed border-indigo-500 rounded-xl flex flex-col items-center justify-center z-50 backdrop-blur-[1px] transition-all">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-indigo-100 text-center flex flex-col items-center max-w-xs animate-in zoom-in-95">
            <Upload className="h-8 w-8 text-indigo-650 animate-bounce mb-3" />
            <h4 className="text-xs font-bold text-slate-800">Drop Image to Upload</h4>
            <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">
              Automatically upload via UploadThing and insert it as an image component block.
            </p>
          </div>
        </div>
      )}

      {isCanvasUploading && (
        <div className="absolute inset-0 bg-slate-900/40 rounded-xl flex flex-col items-center justify-center z-50 backdrop-blur-sm transition-all">
          <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 text-center flex flex-col items-center max-w-xs animate-in zoom-in-95">
            <Loader2 className="h-8 w-8 text-indigo-650 animate-spin mb-3" />
            <h4 className="text-xs font-bold text-slate-800">Uploading Image</h4>
            <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">
              Processing image routing on UploadThing servers. Please wait...
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
