"use client"

import { useState } from "react"
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
          return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
              <img
                src={block.content.src || 'https://via.placeholder.com/600x300'}
                alt={block.content.alt || ''}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                  borderRadius: '8px',
                  ...block.styles
                }}
              />
            </div>
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
              <div style={{ border: '1px dashed #ccc', padding: '10px', minHeight: '50px', backgroundColor: '#f9f9f9' }}>
                <div style={{ color: '#666', fontSize: '12px', fontFamily: 'monospace' }}>
                  Custom HTML content
                </div>
              </div>
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
