"use client"

import { useState } from "react"
import { Plus, Type, Image, Square, Layout, Grid3x3, Share2, Code, Settings, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface TemplateBlock {
  id: string
  type: string
  content: Record<string, any>
  styles: Record<string, any>
  children?: TemplateBlock[]
}

interface BlockPaletteProps {
  onAddBlock: (blockType: string) => void
  selectedBlock: TemplateBlock | null
  isInserting: boolean
  pendingBlockType: string | null
}

interface BlockCategory {
  id: string
  label: string
  icon: React.ElementType
  blocks: BlockItem[]
}

interface BlockItem {
  type: string
  label: string
  description: string
  icon: React.ElementType
  category: string
}

export default function BlockPalette({ onAddBlock, selectedBlock, isInserting, pendingBlockType }: BlockPaletteProps) {
  const [activeCategory, setActiveCategory] = useState("basic")
  const [copiedTag, setCopiedTag] = useState<string | null>(null)

  const handleCopyTag = async (tag: string) => {
    const tagText = `{{${tag}}}`
    try {
      await navigator.clipboard.writeText(tagText)
      setCopiedTag(tag)
      setTimeout(() => setCopiedTag(null), 2000)
    } catch (error) {
      console.error("Failed to copy tag:", error)
    }
  }

  const blockCategories: BlockCategory[] = [
    {
      id: "basic",
      label: "Basic",
      icon: Type,
      blocks: [
        {
          type: "header",
          label: "Header",
          description: "Email header with logo and title",
          icon: Type,
          category: "basic"
        },
        {
          type: "text",
          label: "Text",
          description: "Rich text content block",
          icon: Type,
          category: "basic"
        },
        {
          type: "image",
          label: "Image",
          description: "Image block with alt text",
          icon: Image,
          category: "basic"
        },
        {
          type: "button",
          label: "Button",
          description: "Call-to-action button",
          icon: Square,
          category: "basic"
        },
        {
          type: "divider",
          label: "Divider",
          description: "Horizontal line separator",
          icon: Settings,
          category: "basic"
        },
        {
          type: "spacer",
          label: "Spacer",
          description: "Adjustable vertical spacing",
          icon: Settings,
          category: "basic"
        },
        {
          type: "footer",
          label: "Footer",
          description: "Email footer with unsubscribe and company info",
          icon: Settings,
          category: "basic"
        }
      ]
    },
    {
      id: "layout",
      label: "Layout",
      icon: Layout,
      blocks: [
        {
          type: "2column",
          label: "2 Column",
          description: "Two column layout",
          icon: Grid3x3,
          category: "layout"
        },
        {
          type: "3column",
          label: "3 Column",
          description: "Three column layout",
          icon: Grid3x3,
          category: "layout"
        }
      ]
    },
    {
      id: "social",
      label: "Social",
      icon: Share2,
      blocks: [
        {
          type: "social",
          label: "Social Icons",
          description: "Social media links",
          icon: Share2,
          category: "social"
        },
        {
          type: "footer",
          label: "Footer",
          description: "Email footer with links",
          icon: Type,
          category: "social"
        }
      ]
    },
    {
      id: "advanced",
      label: "Advanced",
      icon: Code,
      blocks: [
        {
          type: "html",
          label: "Raw HTML",
          description: "Custom HTML block",
          icon: Code,
          category: "advanced"
        }
      ]
    }
  ]

  const currentCategory = blockCategories.find(cat => cat.id === activeCategory)

  const handleAddBlock = (blockType: string) => {
    onAddBlock(blockType)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <Layout className="h-4 w-4 mr-2" />
          Block Palette
        </h3>
      </div>

      {/* Category Tabs */}
      <div className="flex border-b border-gray-200">
        {blockCategories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
              activeCategory === category.id
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
        {isInserting && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 text-center">
            Inserting {pendingBlockType} block...
          </div>
        )}
        
        {currentCategory && (
          <div className="space-y-3">
            {currentCategory.blocks.map((block) => (
              <div
                key={block.type}
                onClick={() => !isInserting && handleAddBlock(block.type)}
                className={`p-3 border rounded-lg transition-all duration-200 group ${
                  isInserting 
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer'
                }`}
              >
                <div className="flex items-start">
                  <div className={`w-8 h-8 rounded-lg mr-3 flex items-center justify-center transition-colors ${
                    isInserting ? 'bg-gray-100' : 'bg-gray-100 group-hover:bg-blue-100'
                  }`}>
                    <block.icon className={`h-4 w-4 transition-colors ${
                      isInserting ? 'text-gray-400' : 'text-gray-600 group-hover:text-blue-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`font-medium text-sm ${
                      isInserting ? 'text-gray-500' : 'text-gray-900'
                    }`}>
                      {block.label}
                    </div>
                    <div className={`text-xs mt-1 ${
                      isInserting ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {block.description}
                    </div>
                    {selectedBlock && !isInserting && (
                      <div className="text-xs text-blue-600 mt-1 flex items-center">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mr-1"></div>
                        Will insert after selected block
                      </div>
                    )}
                  </div>
                  <div className="ml-2">
                    <Plus className={`h-4 w-4 transition-colors ${
                      isInserting ? 'text-gray-300' : 'text-gray-400 group-hover:text-blue-600'
                    }`} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Merge Tags Section */}
      <div className="border-t border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
          <Type className="h-4 w-4 mr-2" />
          Merge Tags
        </h4>
        <div className="space-y-2">
          {[
            { tag: "first_name", label: "First Name" },
            { tag: "last_name", label: "Last Name" },
            { tag: "email", label: "Email" },
            { tag: "company", label: "Company" },
            { tag: "city", label: "City" },
            { tag: "phone", label: "Phone" }
          ].map((mergeTag) => (
            <div
              key={mergeTag.tag}
              className="flex items-center justify-between p-2 bg-gray-50 rounded hover:bg-gray-100 text-sm group"
            >
              <div
                className="flex items-center cursor-pointer flex-1"
                onClick={() => {
                  console.log('Insert merge tag:', mergeTag.tag)
                }}
              >
                <code className="bg-gray-200 px-1 rounded text-xs group-hover:bg-gray-300 transition-colors">
                  {"{{" + mergeTag.tag + "}}"}
                </code>
                <span className="ml-2 text-gray-600">{mergeTag.label}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopyTag(mergeTag.tag)
                }}
                className="ml-2 p-1 rounded hover:bg-gray-200 transition-colors opacity-0 group-hover:opacity-100"
                title="Copy to clipboard"
              >
                {copiedTag === mergeTag.tag ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3 text-gray-500" />
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Block Info */}
      {selectedBlock && (
        <div className="border-t border-gray-200 p-4">
          <h4 className="font-medium text-gray-900 mb-3">Selected Block</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Type:</span>
              <Badge variant="secondary" className="text-xs">
                {selectedBlock.type}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">ID:</span>
              <span className="text-gray-900 font-mono text-xs">
                {selectedBlock.id}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
