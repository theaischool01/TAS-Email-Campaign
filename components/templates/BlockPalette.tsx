"use client"

import { useState } from "react"
import { 
  Plus, 
  Type, 
  Image as ImageIcon, 
  Square, 
  Layout, 
  Grid3x3, 
  Share2, 
  Code, 
  Settings, 
  Trash2, 
  Layers, 
  Upload, 
  ChevronRight,
  Copy,
  Edit2,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Box,
  Columns
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface TemplateBlock {
  id: string
  type: string
  content: Record<string, any>
  styles: Record<string, any>
  children?: TemplateBlock[]
}

interface BlockPaletteProps {
  onAddBlock: (blockType: string, initialContent?: Record<string, any>, initialStyles?: Record<string, any>) => void
  selectedBlock: TemplateBlock | null
  isInserting: boolean
  pendingBlockType: string | null
  blocks: TemplateBlock[]
  onSelectBlock: (block: TemplateBlock | null) => void
  onDeleteBlock: (blockId: string) => void
  onDuplicateBlock?: (blockId: string) => void
  onMoveBlock?: (blockId: string, direction: 'up' | 'down') => void
  onUpdateBlock?: (blockId: string, updates: Partial<TemplateBlock>) => void
}

export default function BlockPalette({ 
  onAddBlock, 
  selectedBlock, 
  isInserting, 
  pendingBlockType,
  blocks,
  onSelectBlock,
  onDeleteBlock,
  onDuplicateBlock,
  onMoveBlock,
  onUpdateBlock
}: BlockPaletteProps) {
  const [activeTab, setActiveTab] = useState<"sections" | "components" | "assets" | "layers">("sections")
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState("")

  const sectionsList = [
    {
      type: "header",
      label: "Header - Logo Left",
      desc: "Clean header with logo on the left",
      content: { text: "🏢 Company Logo & Branding" },
      styles: { textAlign: "left", padding: "16px 24px", borderBottom: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#1e293b", fontSize: "16px", fontWeight: "bold" },
      preview: (
        <svg viewBox="0 0 100 24" className="w-full h-10 text-slate-300 fill-current bg-slate-50 border border-slate-200/80 rounded-md">
          <rect x="6" y="7" width="10" height="10" rx="1.5" fill="#3b82f6" />
          <rect x="20" y="9" width="35" height="5" rx="1" fill="#94a3b8" />
          <line x1="0" y1="23.5" x2="100" y2="23.5" stroke="#e2e8f0" strokeWidth="0.5" />
        </svg>
      )
    },
    {
      type: "header",
      label: "Header - Centered Logo",
      desc: "Balanced header with logo centered",
      content: { text: "🏢 Company Brand" },
      styles: { textAlign: "center", padding: "20px 16px", borderBottom: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#1e293b", fontSize: "18px", fontWeight: "bold" },
      preview: (
        <svg viewBox="0 0 100 24" className="w-full h-10 text-slate-300 fill-current bg-slate-50 border border-slate-200/80 rounded-md">
          <rect x="45" y="4" width="10" height="8" rx="1.5" fill="#3b82f6" />
          <rect x="35" y="14" width="30" height="4" rx="1" fill="#94a3b8" />
          <line x1="0" y1="23.5" x2="100" y2="23.5" stroke="#e2e8f0" strokeWidth="0.5" />
        </svg>
      )
    },
    {
      type: "header",
      label: "Hero - Center CTA",
      desc: "Bold banner with centered heading",
      content: { text: "🚀 Transform Your Email Strategy" },
      styles: { textAlign: "center", padding: "40px 24px", backgroundColor: "#1e293b", color: "#ffffff", fontSize: "24px", fontWeight: "800" },
      preview: (
        <svg viewBox="0 0 100 24" className="w-full h-10 text-slate-300 fill-current bg-slate-900 border border-slate-950 rounded-md">
          <rect x="20" y="5" width="60" height="6" rx="1" fill="#ffffff" />
          <rect x="30" y="13" width="40" height="3" rx="0.5" fill="#94a3b8" />
          <rect x="42" y="18" width="16" height="4" rx="1" fill="#3b82f6" />
        </svg>
      )
    },
    {
      type: "header",
      label: "Hero - Image Left",
      desc: "Banner with layout spacing",
      content: { text: "📷 Visual Layout Highlight" },
      styles: { textAlign: "left", padding: "30px 24px", backgroundColor: "#f8fafc", color: "#0f172a", fontSize: "20px", fontWeight: "700" },
      preview: (
        <svg viewBox="0 0 100 24" className="w-full h-10 text-slate-300 fill-current bg-slate-50 border border-slate-200/80 rounded-md">
          <rect x="6" y="5" width="24" height="14" rx="1.5" fill="#3b82f6" />
          <rect x="36" y="6" width="55" height="4" rx="1" fill="#475569" />
          <rect x="36" y="12" width="40" height="3" rx="0.5" fill="#94a3b8" />
          <rect x="36" y="17" width="15" height="3" rx="0.5" fill="#94a3b8" />
        </svg>
      )
    },
    {
      type: "2column",
      label: "Two Columns",
      desc: "Responsive side-by-side columns",
      content: { text1: "Left column story text and descriptive info.", text2: "Right column story text and descriptive info." },
      styles: { padding: "16px", backgroundColor: "#ffffff" },
      preview: (
        <svg viewBox="0 0 100 24" className="w-full h-10 text-slate-300 fill-current bg-slate-50 border border-slate-200/80 rounded-md">
          <rect x="6" y="4" width="41" height="16" rx="1" fill="#cbd5e1" stroke="#cbd5e1" strokeWidth="0.5" />
          <rect x="53" y="4" width="41" height="16" rx="1" fill="#cbd5e1" stroke="#cbd5e1" strokeWidth="0.5" />
        </svg>
      )
    },
    {
      type: "3column",
      label: "Three Feature Cards",
      desc: "Multi-column feature layout blocks",
      content: { text1: "Card 1 Detail", text2: "Card 2 Detail", text3: "Card 3 Detail" },
      styles: { padding: "16px", backgroundColor: "#ffffff" },
      preview: (
        <svg viewBox="0 0 100 24" className="w-full h-10 text-slate-300 fill-current bg-slate-50 border border-slate-200/80 rounded-md">
          <rect x="5" y="4" width="26" height="16" rx="1" fill="#cbd5e1" />
          <rect x="37" y="4" width="26" height="16" rx="1" fill="#cbd5e1" />
          <rect x="69" y="4" width="26" height="16" rx="1" fill="#cbd5e1" />
        </svg>
      )
    },
    {
      type: "button",
      label: "CTA Banner",
      desc: "Announcement strip with CTA button",
      content: { text: "Register Now", url: "#", backgroundColor: "#3b82f6", color: "#ffffff" },
      styles: { backgroundColor: "#ffffff", padding: "16px" },
      preview: (
        <svg viewBox="0 0 100 24" className="w-full h-10 text-slate-300 fill-current bg-slate-50 border border-slate-200/80 rounded-md">
          <rect x="30" y="8" width="40" height="8" rx="1.5" fill="#3b82f6" />
        </svg>
      )
    },
    {
      type: "text",
      label: "Newsletter Content",
      desc: "Optimized paragraph typography layout",
      content: { text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aliquam at porttitor sem. Aliquam erat volutpat. Donec placerat nisl magna, et bibendum justo." },
      styles: { fontSize: "14px", color: "#334155", padding: "24px", lineHeight: "1.6", backgroundColor: "#ffffff" },
      preview: (
        <svg viewBox="0 0 100 24" className="w-full h-10 text-slate-300 fill-current bg-slate-50 border border-slate-200/80 rounded-md">
          <rect x="6" y="5" width="88" height="3" rx="0.5" fill="#94a3b8" />
          <rect x="6" y="10" width="88" height="3" rx="0.5" fill="#cbd5e1" />
          <rect x="6" y="15" width="60" height="3" rx="0.5" fill="#cbd5e1" />
        </svg>
      )
    },
    {
      type: "footer",
      label: "Simple Footer",
      desc: "Minimal footer template",
      content: { company: "My Brand Inc.", address: "123 Business St, City", unsubscribeText: "You are receiving this because you signed up." },
      styles: { backgroundColor: "#f8fafc", padding: "16px", color: "#64748b", fontSize: "11px", textAlign: "center" },
      preview: (
        <svg viewBox="0 0 100 24" className="w-full h-10 text-slate-300 fill-current bg-slate-100 border border-slate-200 rounded-md">
          <rect x="25" y="6" width="50" height="3" rx="0.5" fill="#94a3b8" />
          <rect x="35" y="12" width="30" height="2.5" rx="0.5" fill="#cbd5e1" />
          <rect x="40" y="17" width="20" height="2.5" rx="0.5" fill="#cbd5e1" />
        </svg>
      )
    },
    {
      type: "footer",
      label: "Corporate Footer",
      desc: "Rich detailed corporate footprint options",
      content: { company: "MailFlow Corp.", address: "456 Enterprise Ave, Ste 100", unsubscribeText: "Manage your preferences or unsubscribe at any time." },
      styles: { backgroundColor: "#0f172a", padding: "24px", color: "#94a3b8", fontSize: "12px", textAlign: "center" },
      preview: (
        <svg viewBox="0 0 100 24" className="w-full h-10 text-slate-300 fill-current bg-slate-900 border border-slate-950 rounded-md">
          <rect x="15" y="4" width="70" height="2.5" rx="0.5" fill="#cbd5e1" />
          <rect x="25" y="9" width="50" height="2.5" rx="0.5" fill="#94a3b8" />
          <rect x="35" y="14" width="30" height="2.5" rx="0.5" fill="#94a3b8" />
          <rect x="20" y="19" width="60" height="2" rx="0.5" fill="#475569" />
        </svg>
      )
    },
    {
      type: "social",
      label: "Social Icons",
      desc: "Minimal icon row for footers",
      content: {
        layout: "icons-only",
        alignment: "center",
        iconStyle: "brand",
        iconSize: 32,
        spacing: 12,
        enabledNetworks: { linkedin: true, instagram: true, youtube: true },
        urls: { linkedin: "", instagram: "", youtube: "" }
      },
      styles: { backgroundColor: "#ffffff", padding: "20px" },
      preview: (
        <svg viewBox="0 0 100 24" className="w-full h-10 fill-current bg-slate-50 border border-slate-200/80 rounded-md">
          <circle cx="35" cy="12" r="5" fill="#0077b5" />
          <circle cx="50" cy="12" r="5" fill="#e1306c" />
          <circle cx="65" cy="12" r="5" fill="#ff0000" />
        </svg>
      )
    },
    {
      type: "social-follow",
      label: "Social Follow Section",
      desc: "Full section with heading, description and icons",
      content: {
        layout: "follow-section",
        heading: "Stay Connected",
        description: "Follow us on social media for product updates, announcements and news.",
        alignment: "center",
        iconStyle: "brand",
        iconSize: 32,
        spacing: 12,
        enabledNetworks: { linkedin: true, instagram: true, youtube: true },
        urls: { linkedin: "", instagram: "", youtube: "" }
      },
      styles: { backgroundColor: "#f8fafc", padding: "24px" },
      preview: (
        <svg viewBox="0 0 100 28" className="w-full h-10 fill-current bg-slate-50 border border-slate-200/80 rounded-md">
          <rect x="25" y="4" width="50" height="4" rx="1" fill="#334155" />
          <rect x="10" y="11" width="80" height="2.5" rx="0.5" fill="#94a3b8" />
          <circle cx="38" cy="22" r="4" fill="#0077b5" />
          <circle cx="50" cy="22" r="4" fill="#e1306c" />
          <circle cx="62" cy="22" r="4" fill="#ff0000" />
        </svg>
      )
    }
  ]

  const componentsList = [
    { type: "header", label: "Heading", icon: Type },
    { type: "text", label: "Paragraph", icon: Type },
    { 
      type: "text", 
      label: "Boxed Text", 
      icon: Box,
      initialContent: { text: "This is a boxed text block. Double-click here to edit inline." },
      initialStyles: { backgroundColor: "#f8fafc", padding: "20px 20px 20px 20px", borderStyle: "solid", borderWidth: "1px", borderColor: "#cbd5e1", borderRadius: "8px" }
    },
    { type: "image", label: "Image", icon: ImageIcon },
    { 
      type: "2column", 
      label: "Image+Text", 
      icon: Columns,
      initialContent: {
        layoutRatio: "50/50",
        col1Type: "image",
        col1ImageSrc: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&h=200&fit=crop&q=80",
        col1ImageAlt: "Placeholder Image",
        col1ImageAlignment: "center",
        col1ImageWidth: "100",
        col1ImageWidthUnit: "%",
        col2Type: "text",
        text2: "<p><strong>Your Heading Here</strong></p><p>Double-click to add your paragraph description or campaign highlight here.</p>"
      },
      initialStyles: { padding: "16px", backgroundColor: "#ffffff" }
    },
    { type: "button", label: "Button", icon: Square },
    { type: "divider", label: "Divider", icon: Settings },
    { type: "spacer", label: "Spacer", icon: Settings },
    {
      type: "social",
      label: "Social Icons",
      icon: Share2,
      initialContent: {
        layout: "icons-only",
        alignment: "center",
        iconStyle: "brand",
        iconSize: 32,
        spacing: 12,
        enabledNetworks: { linkedin: true, instagram: true, youtube: true },
        urls: { linkedin: "", instagram: "", youtube: "" }
      },
      initialStyles: { backgroundColor: "#ffffff", padding: "20px" }
    },
    {
      type: "social-follow",
      label: "Social Follow",
      icon: Share2,
      initialContent: {
        layout: "follow-section",
        heading: "Stay Connected",
        description: "Follow us on social media for product updates, announcements and news.",
        alignment: "center",
        iconStyle: "brand",
        iconSize: 32,
        spacing: 12,
        enabledNetworks: { linkedin: true, instagram: true, youtube: true },
        urls: { linkedin: "", instagram: "", youtube: "" }
      },
      initialStyles: { backgroundColor: "#f8fafc", padding: "24px" }
    },
    { type: "html", label: "HTML Block", icon: Code }
  ]

  return (
    <div className="h-full flex flex-col bg-white select-none">
      {/* Tab Selectors */}
      <div className="flex border-b border-slate-200 bg-white shrink-0">
        {(["sections", "components", "assets", "layers"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs font-semibold transition-all capitalize border-b-2 rounded-none text-center ${
              activeTab === tab
                ? "border-red-600 text-red-600 font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Scroll Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isInserting && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded-lg flex items-center justify-center text-xs font-semibold text-blue-600 animate-pulse">
            Inserting {pendingBlockType}...
          </div>
        )}

        {/* ─── Tab: Sections ─── */}
        {activeTab === "sections" && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3">
              Starter Layouts
            </h4>
            {sectionsList.map((sec, idx) => (
              <div
                key={`${sec.type}-${idx}`}
                onClick={() => !isInserting && onAddBlock(sec.type, sec.content, sec.styles)}
                className={`p-2 border border-slate-200 rounded-xl transition-all duration-200 flex flex-col gap-2 group ${
                  isInserting
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-red-300 hover:shadow-sm cursor-pointer"
                }`}
              >
                {sec.preview}
                <div className="flex items-center justify-between px-1">
                  <div>
                    <div className="font-semibold text-xs text-slate-700">{sec.label}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{sec.desc}</div>
                  </div>
                  <div className="w-5 h-5 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:bg-red-50 group-hover:border-red-300 transition-colors">
                    <Plus className="h-3 w-3 text-slate-500 group-hover:text-red-600" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Tab: Components ─── */}
        {activeTab === "components" && (
          <div className="grid grid-cols-2 gap-2">
            {componentsList.map((comp) => (
              <div
                key={`${comp.type}-${comp.label}`}
                onClick={() => !isInserting && onAddBlock(comp.type, (comp as any).initialContent, (comp as any).initialStyles)}
                className={`p-3 border border-slate-200 rounded-xl transition-all duration-200 flex flex-col items-center justify-center text-center gap-2 group ${
                  isInserting
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-red-300 hover:shadow-sm cursor-pointer"
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:bg-red-50 group-hover:border-red-300 transition-colors">
                  <comp.icon className="h-4 w-4 text-slate-500 group-hover:text-red-600" />
                </div>
                <span className="text-xs font-semibold text-slate-700">{comp.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* ─── Tab: Assets (Placeholder) ─── */}
        {activeTab === "assets" && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center cursor-pointer hover:border-red-300 transition-colors">
              <Upload className="h-6 w-6 text-slate-400 mx-auto mb-2" />
              <span className="text-xs font-semibold text-slate-700">Upload Image</span>
              <p className="text-[10px] text-slate-400 mt-1">PNG, JPG, GIF (Max 4MB)</p>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Recent Uploads
                </span>
                <Badge variant="outline" className="text-[9px] text-slate-400">
                  Placeholder
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="aspect-square bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center"
                  >
                    <ImageIcon className="h-4 w-4 text-slate-300" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ─── Tab: Layers ─── */}
        {activeTab === "layers" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Section Tree Hierarchy
              </h4>
              <span className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded font-medium">
                {blocks.length} sections
              </span>
            </div>
            {(!Array.isArray(blocks) || blocks.length === 0) ? (
              <div className="text-center py-8 text-xs text-slate-450 border border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                No sections placed yet.
              </div>
            ) : (
              <div className="space-y-1">
                {blocks.map((block, idx) => {
                  const isSelected = selectedBlock?.id === block.id
                  const BlockIcon = (() => {
                    switch (block.type) {
                      case 'header': return Layout
                      case 'text': return Type
                      case 'button': return Square
                      case 'image': return ImageIcon
                      case 'divider': return Settings
                      case 'spacer': return Settings
                      case 'social': return Share2
                      case 'html': return Code
                      default: return Layers
                    }
                  })()

                  const customName = block.content?.customName || `${block.type.charAt(0).toUpperCase() + block.type.slice(1)} Section`

                  return (
                    <div
                      key={block.id}
                      onClick={() => onSelectBlock(block)}
                      className={`group p-2 rounded-lg border text-xs flex flex-col gap-1 cursor-pointer transition-all ${
                        isSelected
                          ? "bg-red-50/70 border-red-200 text-red-750 shadow-sm"
                          : "border-slate-100 hover:border-slate-200 bg-white text-slate-650 hover:text-slate-800"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <ChevronRight className={`h-3 w-3 shrink-0 transition-transform ${isSelected ? "text-red-500 rotate-90" : "text-slate-400"}`} />
                          <BlockIcon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-red-500" : "text-slate-450"}`} />
                          
                          {renamingId === block.id ? (
                            <input
                              type="text"
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={() => saveRename(block.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveRename(block.id)
                                if (e.key === 'Escape') setRenamingId(null)
                              }}
                              className="text-xs px-1 border border-slate-300 rounded font-semibold text-slate-800 focus:outline-none focus:border-red-400 bg-white w-28 shrink-0"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span className="font-semibold truncate">
                              {customName}
                            </span>
                          )}
                        </div>
                        
                        {/* Quick hover layers actions */}
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {onMoveBlock && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onMoveBlock(block.id, 'up')
                                }}
                                disabled={idx === 0}
                                className="text-slate-450 hover:text-red-650 disabled:opacity-30 p-0.5 rounded"
                                title="Move Up"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onMoveBlock(block.id, 'down')
                                }}
                                disabled={idx === blocks.length - 1}
                                className="text-slate-450 hover:text-red-650 disabled:opacity-30 p-0.5 rounded"
                                title="Move Down"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setRenamingId(block.id)
                              setRenameValue(customName)
                            }}
                            className="text-slate-455 hover:text-red-650 p-0.5 rounded"
                            title="Rename"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          {onDuplicateBlock && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onDuplicateBlock(block.id)
                              }}
                              className="text-slate-455 hover:text-red-650 p-0.5 rounded"
                              title="Duplicate"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteBlock(block.id)
                            }}
                            className="text-slate-455 hover:text-red-650 p-0.5 rounded"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )

  function saveRename(blockId: string) {
    if (onUpdateBlock && renameValue.trim()) {
      const targetBlock = blocks.find(b => b.id === blockId)
      if (targetBlock) {
        onUpdateBlock(blockId, {
          content: {
            ...targetBlock.content,
            customName: renameValue.trim()
          }
        })
      }
    }
    setRenamingId(null)
  }
}
