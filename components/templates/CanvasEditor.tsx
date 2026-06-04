"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Plus, GripVertical, Trash2, Edit, ChevronUp, ChevronDown, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

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
  previewMode: "desktop" | "mobile"
  onSelectBlock: (block: TemplateBlock | null) => void
  onUpdateBlock: (blockId: string, updates: Partial<TemplateBlock>) => void
  onDeleteBlock: (blockId: string) => void
  onMoveBlock: (blockId: string, direction: 'up' | 'down') => void
  onDuplicateBlock: (blockId: string) => void
}

// ─── Resize handle cursor map ───────────────────────────────────────────────
const HANDLE_CURSORS: Record<string, string> = {
  'tl': 'nw-resize',
  'tr': 'ne-resize',
  'bl': 'sw-resize',
  'br': 'se-resize',
}

// ─── ImageBlock — self-contained resize + alignment logic ────────────────────
interface ImageBlockProps {
  block: TemplateBlock
  isSelected: boolean
  onUpdateBlock: (blockId: string, updates: Partial<TemplateBlock>) => void
  onSelectBlock: (block: TemplateBlock) => void
}

function ImageBlock({ block, isSelected, onUpdateBlock, onSelectBlock }: ImageBlockProps) {
  const imgRef = useRef<HTMLImageElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const resizeState = useRef<{
    active: boolean
    handle: string
    startX: number
    startWidth: number
    aspectRatio: number
  }>({ active: false, handle: '', startX: 0, startWidth: 0, aspectRatio: 1 })

  // Compute display dimensions
  const imgWidth = block.content?.widthUnit === 'px'
    ? (block.content?.width ?? 300) + 'px'
    : (block.content?.width ?? 100) + '%'
  const imgHeight = !block.content?.height || block.content?.height === 'auto'
    ? 'auto'
    : block.content.height + 'px'
  const alignment = block.content?.alignment || 'center'

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

    // Current rendered px width
    const currentPxWidth = img ? img.getBoundingClientRect().width : (block.content?.width ?? 300)

    resizeState.current = {
      active: true,
      handle,
      startX: e.clientX,
      startWidth: currentPxWidth,
      aspectRatio: ar,
    }
  }, [block.content?.width])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!resizeState.current.active) return
      const { handle, startX, startWidth, aspectRatio } = resizeState.current

      const deltaX = handle === 'tl' || handle === 'bl'
        ? startX - e.clientX   // left handles: drag left = grow
        : e.clientX - startX   // right handles: drag right = grow

      const newWidth = Math.min(600, Math.max(50, startWidth + deltaX))
      const newHeight = Math.round(newWidth / aspectRatio)

      // Live-update the img element directly for smooth feedback (no React re-render per px)
      if (imgRef.current) {
        imgRef.current.style.width = newWidth + 'px'
        imgRef.current.style.height = newHeight + 'px'
      }
    }

    const onMouseUp = (e: MouseEvent) => {
      if (!resizeState.current.active) return
      const { handle, startX, startWidth, aspectRatio } = resizeState.current
      resizeState.current.active = false

      const deltaX = handle === 'tl' || handle === 'bl'
        ? startX - e.clientX
        : e.clientX - startX

      const newWidth = Math.min(600, Math.max(50, startWidth + deltaX))
      const newHeight = Math.round(newWidth / aspectRatio)

      onUpdateBlock(block.id, {
        content: {
          ...block.content,
          width: Math.round(newWidth),
          widthUnit: 'px',
          height: newHeight,
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
      style={{ padding: '20px', textAlign: alignment as any, position: 'relative', userSelect: 'none' }}
      onClick={(e) => { e.stopPropagation(); onSelectBlock(block) }}
    >
      {/* Alignment toolbar — only when selected */}
      {isSelected && (
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
          <span style={{ fontSize: '10px', color: '#9ca3af', alignSelf: 'center', whiteSpace: 'nowrap' }}>
            Drag corners to resize
          </span>
        </div>
      )}

      {/* Image + corner handles */}
      <div style={{ position: 'relative', display: 'inline-block', marginTop: isSelected ? '28px' : '0' }}>
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
            borderRadius: '8px',
            display: 'block',
            pointerEvents: 'none', // prevent img drag interfering with resize
          }}
        />

        {/* 4 corner resize handles — only when selected */}
        {isSelected && (
          <>
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
  onDuplicateBlock
}: CanvasEditorProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [draggedBlockId, setDraggedBlockId] = useState<string | null>(null)

  const renderBlock = (block: TemplateBlock) => {
    const isSelected = selectedBlock?.id === block.id
    const styles = Object.entries(block.styles)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, '-$1').toLowerCase()}: ${value}`)
      .join('; ')

    const blockStyle: React.CSSProperties = {
      position: 'relative',
      margin: '12px',
      border: isSelected ? '2px solid #3b82f6' : '1px solid #e5e7eb',
      borderRadius: '6px',
      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
      boxShadow: isSelected ? '0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' : '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      transition: 'all 0.2s ease-in-out'
    }

    const renderContent = () => {
      switch (block.type) {
        case 'header':
          return (
            <div style={{ padding: '20px', textAlign: 'center', ...block.styles }}>
              <h1 style={{ margin: 0, fontSize: '24px', color: block.styles.color || '#ffffff' }}>
                {block.content.text}
              </h1>
            </div>
          )
        case 'text':
          return (
            <div style={{ 
              padding: '20px', 
              fontFamily: 'Arial, sans-serif', 
              fontSize: '14px', 
              lineHeight: '1.6',
              color: block.styles.color || '#333333',
              ...block.styles 
            }}>
              <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{block.content.text}</p>
            </div>
          )
        case 'button':
          return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
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
          // Rendered by dedicated ImageBlock component (handles resize + alignment)
          return (
            <ImageBlock
              block={block}
              isSelected={isSelected}
              onUpdateBlock={onUpdateBlock}
              onSelectBlock={onSelectBlock}
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
          return (
            <div style={{ padding: '10px', display: 'table', width: '100%', tableLayout: 'fixed' }}>
              <div style={{ display: 'table-row' }}>
                <div style={{ display: 'table-cell', width: '50%', padding: '10px', verticalAlign: 'top' }}>
                  <div style={{ border: '1px dashed #e5e7eb', padding: '10px', minHeight: '50px', fontSize: '13px' }}>
                    {block.content.text1 || "Column 1"}
                  </div>
                </div>
                <div style={{ display: 'table-cell', width: '50%', padding: '10px', verticalAlign: 'top' }}>
                  <div style={{ border: '1px dashed #e5e7eb', padding: '10px', minHeight: '50px', fontSize: '13px' }}>
                    {block.content.text2 || "Column 2"}
                  </div>
                </div>
              </div>
            </div>
          )
        case '3column':
          return (
            <div style={{ padding: '10px', display: 'table', width: '100%', tableLayout: 'fixed' }}>
              <div style={{ display: 'table-row' }}>
                <div style={{ display: 'table-cell', width: '33.33%', padding: '10px', verticalAlign: 'top' }}>
                  <div style={{ border: '1px dashed #e5e7eb', padding: '10px', minHeight: '50px', fontSize: '12px' }}>
                    {block.content.text1 || "Col 1"}
                  </div>
                </div>
                <div style={{ display: 'table-cell', width: '33.33%', padding: '10px', verticalAlign: 'top' }}>
                  <div style={{ border: '1px dashed #e5e7eb', padding: '10px', minHeight: '50px', fontSize: '12px' }}>
                    {block.content.text2 || "Col 2"}
                  </div>
                </div>
                <div style={{ display: 'table-cell', width: '33.34%', padding: '10px', verticalAlign: 'top' }}>
                  <div style={{ border: '1px dashed #e5e7eb', padding: '10px', minHeight: '50px', fontSize: '12px' }}>
                    {block.content.text3 || "Col 3"}
                  </div>
                </div>
              </div>
            </div>
          )
        case 'social':
          const platforms = [
            { id: 'facebook', label: 'FB' },
            { id: 'twitter', label: 'X' },
            { id: 'linkedin', label: 'IN' },
            { id: 'instagram', label: 'IG' },
            { id: 'youtube', label: 'YT' }
          ]
          return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {platforms.map(p => (
                  block.content[p.id] && (
                    <a 
                      key={p.id} 
                      href={block.content[p.id]} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ 
                        width: '36px', 
                        height: '36px', 
                        backgroundColor: '#3b82f6', 
                        borderRadius: '4px', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        color: 'white', 
                        textDecoration: 'none',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      {p.label}
                    </a>
                  )
                ))}
                {!Object.values(block.content).some(v => v) && (
                  <div style={{ color: '#9ca3af', fontSize: '12px', fontStyle: 'italic' }}>
                    Configure social links in the style panel
                  </div>
                )}
              </div>
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
              <p style={{ margin: '0 0 10px 0', fontSize: '11px' }}>
                {block.content?.unsubscribeText || "You received this email because you're subscribed to our newsletter."}
              </p>
              <p style={{ margin: '0 0 10px 0', fontSize: '11px' }}>
                <a href="#" style={{ color: '#6c757d', textDecoration: 'underline', marginRight: '10px' }}>Unsubscribe</a>
                <a href="#" style={{ color: '#6c757d', textDecoration: 'underline', marginRight: '10px' }}>Privacy Policy</a>
                <a href="#" style={{ color: '#6c757d', textDecoration: 'underline' }}>Terms of Service</a>
              </p>
              <p style={{ margin: '0 0 5px 0', fontSize: '11px' }}>
                {block.content?.company || "Your Company Name"}
              </p>
              <p style={{ margin: '0 0 5px 0', fontSize: '10px' }}>
                {block.content?.address || "123 Business St, City, State 12345"}
              </p>
              <p style={{ margin: '0', fontSize: '10px', borderTop: '1px solid #dee2e6', paddingTop: '10px' }}>
                {block.content?.copyright || `© ${new Date().getFullYear()} Your Company Name. All rights reserved.`}
              </p>
            </div>
          )
        case 'html':
          return (
            <div style={{ padding: '20px' }}>
              {block.content?.html ? (
                <div
                  style={{
                    width: '100%',
                    overflow: 'auto',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    padding: '8px'
                  }}
                  dangerouslySetInnerHTML={{ __html: block.content.html }}
                />
              ) : (
                <div style={{ border: '1px dashed #ccc', padding: '10px', minHeight: '50px', backgroundColor: '#f9f9f9' }}>
                  <div style={{ color: '#666', fontSize: '12px', fontFamily: 'monospace' }}>
                    Custom HTML content
                  </div>
                </div>
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
        className="cursor-pointer hover:shadow-md hover:border-blue-300 transition-all duration-200"
        onMouseEnter={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = '#f9fafb'
          }
        }}
        onMouseLeave={(e) => {
          if (!isSelected) {
            e.currentTarget.style.backgroundColor = '#ffffff'
          }
        }}
      >
        {/* Block Controls */}
        <div
          className={`absolute top-2 right-2 flex gap-1 ${isSelected ? 'opacity-100' : 'opacity-0'} hover:opacity-100 transition-all duration-200`}
          onClick={(e) => e.stopPropagation()}
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
            className="absolute top-2 left-2 cursor-move bg-white rounded-md shadow-sm border border-gray-200 p-1 hover:bg-gray-50 transition-colors"
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
  if (!Array.isArray(blocks)) {
    console.error("CanvasEditor: blocks is not an array", blocks)
    return (
      <div className="h-full flex items-center justify-center">
        <Card className="w-96 p-8 text-center">
          <div className="mb-4">
            <Plus className="h-12 w-12 text-gray-400 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Start Building Your Email</h3>
          <p className="text-gray-600 mb-4">
            Add blocks from the left panel to create your email template
          </p>
          <div className="text-sm text-gray-500">
            <p>• Drag and drop blocks to reorder</p>
            <p>• Click blocks to edit</p>
            <p>• Use the style panel to customize</p>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div
      className="h-full overflow-auto p-4"
      style={{
        maxWidth: previewMode === "mobile" ? "375px" : "600px",
        margin: "0 auto",
        backgroundColor: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "8px"
      }}
    >
      <div className="space-y-2">
        {blocks.map(renderBlock)}
      </div>
    </div>
  )
}
