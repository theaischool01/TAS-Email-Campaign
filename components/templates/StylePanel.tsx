"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useUploadThing } from "@/lib/uploadthing"
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
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)

  // Keep state synchronized with block prop updates
  useEffect(() => {
    setLocalContent(block.content)
    setLocalStyles(block.styles)
  }, [block.content, block.styles])

  const { startUpload } = useUploadThing("imageUploader", {
    onClientUploadComplete: (res: { url: string }[] | undefined) => {
      if (res && res[0]) {
        const url = res[0].url
        const newContent = { ...localContent, src: url }
        setLocalContent(newContent)
        onUpdateBlock(block.id, { content: newContent })
      }
      setIsUploading(false)
      setUploadProgress(0)
    },
    onUploadError: (err: Error) => {
      setUploadError(err.message || "Upload failed")
      setIsUploading(false)
      setUploadProgress(0)
    },
    onUploadProgress: (p: number) => {
      setUploadProgress(p)
    },
  })

  const handleFileUpload = useCallback(async (file: File) => {
    // Client-side size guard (4MB)
    if (file.size > 4 * 1024 * 1024) {
      setUploadError("File too large. Maximum size is 4MB.")
      return
    }
    setUploadError(null)
    setIsUploading(true)
    setUploadProgress(0)
    await startUpload([file])
  }, [startUpload])

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(file)
    } else {
      setUploadError("Please drop an image file (jpg, png, gif, webp).")
    }
  }, [handleFileUpload])

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

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
            {/* Upload Zone */}
            <div>
              <Label className="text-sm font-medium">Upload Image</Label>
              <div
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className="mt-1 flex flex-col items-center justify-center w-full border-2 border-dashed rounded-md cursor-pointer transition-colors"
                style={{
                  borderColor: isUploading ? '#6366f1' : '#d1d5db',
                  backgroundColor: isUploading ? '#eef2ff' : '#f9fafb',
                  minHeight: '90px',
                  padding: '12px 8px',
                }}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2 w-full px-2">
                    <div className="text-xs text-indigo-600 font-medium">Uploading... {uploadProgress}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className="bg-indigo-500 h-1.5 rounded-full transition-all"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <svg className="h-6 w-6 text-gray-400 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-500 text-center">
                      Drag image here or <span className="text-indigo-600 font-medium">click to upload</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Max 4MB · JPG, PNG, GIF, WEBP</p>
                  </>
                )}
              </div>
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                  // reset so same file can be re-selected
                  e.target.value = ''
                }}
              />
              {/* Upload error */}
              {uploadError && (
                <p className="text-xs text-red-500 mt-1">{uploadError}</p>
              )}
            </div>

            {/* Preview of uploaded/current image */}
            {localContent.src && (
              <div>
                <Label className="text-xs text-gray-500">Preview</Label>
                <div className="mt-1 rounded-md overflow-hidden border border-gray-200" style={{ maxHeight: '100px' }}>
                  <img
                    src={localContent.src}
                    alt={localContent.alt || ''}
                    className="w-full object-contain"
                    style={{ maxHeight: '100px' }}
                  />
                </div>
              </div>
            )}

            {/* URL fallback */}
            <div>
              <Label htmlFor="imageUrl" className="text-sm font-medium">Or paste image URL</Label>
              <Input
                id="imageUrl"
                value={localContent.src || ''}
                onChange={(e) => handleContentChange('src', e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Alt text — unchanged */}
            <div>
              <Label htmlFor="altText" className="text-sm font-medium">Alt Text</Label>
              <Input
                id="altText"
                value={localContent.alt || ''}
                onChange={(e) => handleContentChange('alt', e.target.value)}
                placeholder="Image description"
              />
            </div>

            {/* Resize Controls */}
            <div className="space-y-3 pt-1 border-t border-gray-100">
              <Label className="text-sm font-medium text-gray-700">Size &amp; Alignment</Label>

              {/* Resize hint */}
              <p className="text-xs text-gray-400 italic">
                Drag the corner handles on the canvas to resize. Aspect ratio is locked.
              </p>

              {/* Alignment */}
              <div>
                <Label className="text-xs text-gray-500">Alignment</Label>
                <div className="flex gap-2 mt-1">
                  {(['left', 'center', 'right'] as const).map((dir) => (
                    <button
                      key={dir}
                      type="button"
                      onClick={() => handleContentChange('alignment', dir)}
                      className="flex-1 py-1 text-xs font-medium rounded-md border transition-colors"
                      style={{
                        backgroundColor: (localContent.alignment || 'center') === dir ? '#6366f1' : '#ffffff',
                        color: (localContent.alignment || 'center') === dir ? '#ffffff' : '#374151',
                        borderColor: (localContent.alignment || 'center') === dir ? '#6366f1' : '#d1d5db',
                      }}
                    >
                      {dir === 'left' ? '← Left' : dir === 'center' ? '↔ Center' : 'Right →'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Height */}
              <div>
                <Label className="text-xs text-gray-500">Height</Label>
                <div className="flex gap-2 mt-1">
                  {/* Auto / Fixed toggle */}
                  <div className="flex rounded-md border border-gray-300 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => handleContentChange('height', 'auto')}
                      className="px-2 py-1 text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: (!localContent.height || localContent.height === 'auto') ? '#6366f1' : '#ffffff',
                        color: (!localContent.height || localContent.height === 'auto') ? '#ffffff' : '#374151',
                      }}
                    >
                      Auto
                    </button>
                    <button
                      type="button"
                      onClick={() => handleContentChange('height', localContent.height && localContent.height !== 'auto' ? localContent.height : 200)}
                      className="px-2 py-1 text-xs font-medium transition-colors"
                      style={{
                        backgroundColor: localContent.height && localContent.height !== 'auto' ? '#6366f1' : '#ffffff',
                        color: localContent.height && localContent.height !== 'auto' ? '#ffffff' : '#374151',
                      }}
                    >
                      Fixed
                    </button>
                  </div>
                  <Input
                    id="imgHeight"
                    type="number"
                    value={(!localContent.height || localContent.height === 'auto') ? '' : Number(localContent.height)}
                    min={10}
                    max={2000}
                    disabled={!localContent.height || localContent.height === 'auto'}
                    onChange={(e) => handleContentChange('height', Number(e.target.value))}
                    className="flex-1"
                    placeholder="auto"
                  />
                  <span className="text-xs text-gray-500 self-center">px</span>
                </div>
              </div>
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

      case 'html':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="htmlContent" className="text-sm font-medium">Raw HTML</Label>
              <textarea
                id="htmlContent"
                value={localContent.html || ''}
                onChange={(e) => handleContentChange('html', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono"
                rows={10}
                placeholder="Paste your custom HTML here..."
              />
            </div>
            <p className="text-xs text-gray-500 italic">
              Note: CSS must be inline. External styles will be stripped by most email clients.
            </p>
          </div>
        )

      case 'social':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Social Links</Label>
              <div className="space-y-2 mt-2">
                {['facebook', 'twitter', 'linkedin', 'instagram', 'youtube'].map((platform) => (
                  <div key={platform}>
                    <Label htmlFor={platform} className="text-xs text-gray-500 capitalize">{platform}</Label>
                    <Input
                      id={platform}
                      value={localContent[platform] || ''}
                      onChange={(e) => handleContentChange(platform, e.target.value)}
                      placeholder={`https://${platform}.com/yourprofile`}
                      className="text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )

      case '2column':
      case '3column':
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Column Settings</Label>
              <p className="text-xs text-gray-500 mt-1">
                Column blocks currently support individual text content per column.
              </p>
              <div className="space-y-3 mt-3">
                {[1, 2, block.type === '3column' ? 3 : null].filter(Boolean).map((i) => (
                  <div key={i}>
                    <Label htmlFor={`col-${i}`} className="text-xs text-gray-500">Column {i} Text</Label>
                    <textarea
                      id={`col-${i}`}
                      value={localContent[`text${i}`] || ''}
                      onChange={(e) => handleContentChange(`text${i}`, e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md text-xs"
                      rows={2}
                    />
                  </div>
                ))}
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
