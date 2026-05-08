"use client"

import { useState } from "react"
import { Settings, Type, Palette, Grid3x3, AlignLeft, AlignCenter, AlignRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface TemplateBlock {
  id: string
  type: string
  content: Record<string, any>
  styles: Record<string, any>
  children?: TemplateBlock[]
}

interface StylePanelProps {
  block: TemplateBlock
  onUpdateBlock: (blockId: string, updates: Partial<TemplateBlock>) => void
}

export default function StylePanel({ block, onUpdateBlock }: StylePanelProps) {
  const [localContent, setLocalContent] = useState(block.content)
  const [localStyles, setLocalStyles] = useState(block.styles)

  const handleContentChange = (key: string, value: any) => {
    const newContent = { ...localContent, [key]: value }
    setLocalContent(newContent)
    onUpdateBlock(block.id, { content: newContent })
  }

  const handleStyleChange = (key: string, value: any) => {
    const newStyles = { ...localStyles, [key]: value }
    setLocalStyles(newStyles)
    onUpdateBlock(block.id, { styles: newStyles })
  }

  const renderContentControls = () => {
    switch (block.type) {
      case 'header':
      case 'text':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text" className="text-sm font-medium">Text Content</Label>
              <textarea
                id="text"
                value={localContent.text || ''}
                onChange={(e) => handleContentChange('text', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                rows={3}
                placeholder="Enter text content..."
              />
            </div>
          </div>
        )

      case 'button':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="buttonText" className="text-sm font-medium">Button Text</Label>
              <Input
                id="buttonText"
                value={localContent.text || ''}
                onChange={(e) => handleContentChange('text', e.target.value)}
                placeholder="Click Here"
              />
            </div>
            <div>
              <Label htmlFor="buttonUrl" className="text-sm font-medium">Button URL</Label>
              <Input
                id="buttonUrl"
                value={localContent.url || ''}
                onChange={(e) => handleContentChange('url', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bgColor" className="text-sm font-medium">Background Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="bgColor"
                    type="color"
                    value={localContent.backgroundColor || '#007bff'}
                    onChange={(e) => handleContentChange('backgroundColor', e.target.value)}
                    className="h-10 w-20"
                  />
                  <Input
                    value={localContent.backgroundColor || '#007bff'}
                    onChange={(e) => handleContentChange('backgroundColor', e.target.value)}
                    placeholder="#007bff"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="textColor" className="text-sm font-medium">Text Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="textColor"
                    type="color"
                    value={localContent.color || '#ffffff'}
                    onChange={(e) => handleContentChange('color', e.target.value)}
                    className="h-10 w-20"
                  />
                  <Input
                    value={localContent.color || '#ffffff'}
                    onChange={(e) => handleContentChange('color', e.target.value)}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 'image':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="imageUrl" className="text-sm font-medium">Image URL</Label>
              <Input
                id="imageUrl"
                value={localContent.src || ''}
                onChange={(e) => handleContentChange('src', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <Label htmlFor="altText" className="text-sm font-medium">Alt Text</Label>
              <Input
                id="altText"
                value={localContent.alt || ''}
                onChange={(e) => handleContentChange('alt', e.target.value)}
                placeholder="Image description"
              />
            </div>
          </div>
        )

      case 'spacer':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="spacerHeight" className="text-sm font-medium">Height</Label>
              <div className="flex gap-2">
                <Input
                  id="spacerHeight"
                  type="number"
                  value={parseInt(localContent.height) || 20}
                  onChange={(e) => handleContentChange('height', `${e.target.value}px`)}
                  min="0"
                  max="200"
                />
                <span className="text-sm text-gray-500 self-center">px</span>
              </div>
            </div>
          </div>
        )

      default:
        return (
          <div className="text-center text-gray-500 py-4">
            <p className="text-sm">No content controls available for this block type</p>
          </div>
        )
    }
  }

  const renderStyleControls = () => {
    return (
      <div className="space-y-4">
        {/* Typography */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Type className="h-4 w-4 mr-2" />
            Typography
          </h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="fontFamily" className="text-sm font-medium">Font Family</Label>
              <Select value={localStyles.fontFamily || 'Arial'} onValueChange={(value) => handleStyleChange('fontFamily', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select font" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Helvetica">Helvetica</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                  <SelectItem value="Verdana">Verdana</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="fontSize" className="text-sm font-medium">Font Size</Label>
                <div className="flex gap-2">
                  <Input
                    id="fontSize"
                    type="number"
                    value={parseInt(localStyles.fontSize) || 16}
                    onChange={(e) => handleStyleChange('fontSize', `${e.target.value}px`)}
                    min="8"
                    max="72"
                  />
                  <span className="text-sm text-gray-500 self-center">px</span>
                </div>
              </div>
              <div>
                <Label htmlFor="lineHeight" className="text-sm font-medium">Line Height</Label>
                <div className="flex gap-2">
                  <Input
                    id="lineHeight"
                    type="number"
                    value={parseFloat(localStyles.lineHeight) || 1.6}
                    onChange={(e) => handleStyleChange('lineHeight', e.target.value)}
                    min="1"
                    max="3"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Colors */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Palette className="h-4 w-4 mr-2" />
            Colors
          </h4>
          <div className="space-y-3">
            <div>
              <Label htmlFor="bgColor" className="text-sm font-medium">Background Color</Label>
              <div className="flex gap-2">
                <Input
                  id="bgColor"
                  type="color"
                  value={localStyles.backgroundColor || '#ffffff'}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                  className="h-10 w-20"
                />
                <Input
                  value={localStyles.backgroundColor || '#ffffff'}
                  onChange={(e) => handleStyleChange('backgroundColor', e.target.value)}
                  placeholder="#ffffff"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="textColor" className="text-sm font-medium">Text Color</Label>
              <div className="flex gap-2">
                <Input
                  id="textColor"
                  type="color"
                  value={localStyles.color || '#333333'}
                  onChange={(e) => handleStyleChange('color', e.target.value)}
                  className="h-10 w-20"
                />
                <Input
                  value={localStyles.color || '#333333'}
                  onChange={(e) => handleStyleChange('color', e.target.value)}
                  placeholder="#333333"
                  className="flex-1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Spacing */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3 flex items-center">
            <Grid3x3 className="h-4 w-4 mr-2" />
            Spacing
          </h4>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="padding" className="text-sm font-medium">Padding</Label>
                <div className="flex gap-2">
                  <Input
                    id="padding"
                    type="number"
                    value={parseInt(localStyles.padding) || 20}
                    onChange={(e) => handleStyleChange('padding', `${e.target.value}px`)}
                    min="0"
                    max="100"
                  />
                  <span className="text-sm text-gray-500 self-center">px</span>
                </div>
              </div>
              <div>
                <Label htmlFor="margin" className="text-sm font-medium">Margin</Label>
                <div className="flex gap-2">
                  <Input
                    id="margin"
                    type="number"
                    value={parseInt(localStyles.margin) || 0}
                    onChange={(e) => handleStyleChange('margin', `${e.target.value}px`)}
                    min="0"
                    max="100"
                  />
                  <span className="text-sm text-gray-500 self-center">px</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Alignment */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Alignment</h4>
          <div className="flex gap-2">
            <Button
              variant={localStyles.textAlign === 'left' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStyleChange('textAlign', 'left')}
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={localStyles.textAlign === 'center' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStyleChange('textAlign', 'center')}
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              variant={localStyles.textAlign === 'right' ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleStyleChange('textAlign', 'right')}
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <Settings className="h-4 w-4 mr-2" />
          Style Settings
        </h3>
        <div className="mt-2">
          <Badge variant="outline" className="text-xs">
            {block.type}
          </Badge>
        </div>
      </div>

      {/* Content Controls */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-6">
          {/* Content Section */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Content</h4>
            {renderContentControls()}
          </div>

          {/* Style Section */}
          {renderStyleControls()}
        </div>
      </div>
    </div>
  )
}
