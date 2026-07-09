"use client"

import { useState, useEffect } from "react"
import { Settings, Type, Palette, Grid3x3, AlignLeft, AlignCenter, AlignRight, ChevronRight, Info, ArrowLeft, CheckCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

import VariableInput from "./VariableInput"
import AssetManager from "./AssetManager"

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
  onDeleteBlock?: (blockId: string) => void
  activeEditor?: any
  onOpenAssetManager?: (blockId: string, colIdx?: number | null) => void
  /** Called when the user clicks Done — returns the left sidebar to the palette */
  onDone?: () => void
}

function parseShorthand(value: string | undefined, defaultValue = 0) {
  if (!value) return { top: defaultValue, right: defaultValue, bottom: defaultValue, left: defaultValue };
  const parts = value.trim().split(/\s+/).map(p => parseInt(p) || 0);
  if (parts.length === 1) return { top: parts[0], right: parts[0], bottom: parts[0], left: parts[0] };
  if (parts.length === 2) return { top: parts[0], right: parts[1], bottom: parts[0], left: parts[1] };
  if (parts.length === 3) return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[1] };
  return { top: parts[0], right: parts[1], bottom: parts[2], left: parts[3] };
}

function serializeShorthand(top: number, right: number, bottom: number, left: number): string {
  return `${top}px ${right}px ${bottom}px ${left}px`;
}

export default function StylePanel({ block, onUpdateBlock, onDeleteBlock, activeEditor, onOpenAssetManager, onDone }: StylePanelProps) {
  const [localContent, setLocalContent] = useState(block.content)
  const [localStyles, setLocalStyles] = useState(block.styles)
  const [focusedPaddingField, setFocusedPaddingField] = useState<'top' | 'right' | 'bottom' | 'left' | null>(null)
  const [focusedMarginField, setFocusedMarginField] = useState<'top' | 'right' | 'bottom' | 'left' | null>(null)

  // Keep state synchronized with block prop updates
  useEffect(() => {
    setLocalContent(block.content)
    setLocalStyles(block.styles)
  }, [block.content, block.styles])

  // Synchronize inputs with current TipTap text selection formatting attributes
  useEffect(() => {
    if (!activeEditor) return

    const handleSelectionUpdate = () => {
      if (!activeEditor.state.selection.empty) {
        const attrs = activeEditor.getAttributes('textStyle')
        setLocalStyles(prev => ({
          ...prev,
          fontSize: attrs.fontSize || prev.fontSize || '16px',
          fontFamily: attrs.fontFamily || prev.fontFamily || 'Arial',
          color: attrs.color || prev.color || '#333333'
        }))
      } else {
        setLocalStyles(block.styles)
      }
    }

    activeEditor.on('selectionUpdate', handleSelectionUpdate)
    activeEditor.on('transaction', handleSelectionUpdate)
    
    return () => {
      activeEditor.off('selectionUpdate', handleSelectionUpdate)
      activeEditor.off('transaction', handleSelectionUpdate)
    }
  }, [activeEditor, block.styles])

  const handleContentChange = (key: string, value: any) => {
    const newContent = { ...localContent, [key]: value }
    setLocalContent(newContent)
    onUpdateBlock(block.id, { content: newContent })
  }

  const handleStyleChange = (key: string, value: any) => {
    if (activeEditor && !activeEditor.state.selection.empty && ['fontSize', 'color', 'fontFamily', 'textAlign'].includes(key)) {
      if (key === 'fontSize') {
        activeEditor.chain().focus().setMark('textStyle', { fontSize: value }).run()
      } else if (key === 'color') {
        activeEditor.chain().focus().setColor(value).run()
      } else if (key === 'fontFamily') {
        activeEditor.chain().focus().setFontFamily(value).run()
      } else if (key === 'textAlign') {
        activeEditor.chain().focus().setTextAlign(value).run()
      }
      return
    }

    const newStyles = { ...localStyles, [key]: value }
    setLocalStyles(newStyles)
    onUpdateBlock(block.id, { styles: newStyles })
  }

  const renderContentControls = () => {
    switch (block.type) {
      case 'header':
      case 'text':
        return (
          <div className="p-3 bg-blue-50/55 border border-blue-100 rounded-lg text-xs text-blue-700 flex items-start gap-1.5 leading-relaxed">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <span>Double-click text directly on the canvas board to edit inline and apply rich formatting.</span>
          </div>
        )

      case 'button':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="buttonText" className="text-sm font-medium">Button Text</Label>
              <VariableInput
                id="buttonText"
                value={localContent.text || ''}
                onChange={(val) => handleContentChange('text', val)}
                placeholder="Click Here"
              />
            </div>
            <div>
              <Label htmlFor="buttonUrl" className="text-sm font-medium">Button URL</Label>
              <VariableInput
                id="buttonUrl"
                value={localContent.url || ''}
                onChange={(val) => handleContentChange('url', val)}
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
            {/* Current Image Preview */}
            <div>
              <Label className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Current Image Preview</Label>
              {localContent.src ? (
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 p-2 max-h-[140px] flex items-center justify-center group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={localContent.src}
                    alt={localContent.alt || ''}
                    className="max-h-[120px] object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 text-center text-xs text-slate-400">
                  No image selected
                </div>
              )}
            </div>

            {/* Replace / Choose Buttons */}
            <div className="flex flex-col gap-2 shrink-0">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-[10px] border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold h-8"
                  onClick={() => onOpenAssetManager?.(block.id)}
                >
                  Replace Image
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="flex-1 text-[10px] bg-indigo-600 hover:bg-indigo-750 text-white font-semibold h-8"
                  onClick={() => onOpenAssetManager?.(block.id)}
                >
                  Choose Assets
                </Button>
              </div>
              {onDeleteBlock && (
                <Button
                  variant="destructive"
                  size="sm"
                  className="w-full text-[10px] bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200/50 font-semibold h-8 shadow-none"
                  onClick={() => onDeleteBlock(block.id)}
                >
                  Delete Image Block
                </Button>
              )}
            </div>

            {/* Alt Text */}
            <div>
              <Label htmlFor="altText" className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Alt Text</Label>
              <VariableInput
                id="altText"
                value={localContent.alt || ''}
                onChange={(val) => handleContentChange('alt', val)}
                placeholder="Image description"
              />
            </div>

            {/* Image Link URL */}
            <div>
              <Label htmlFor="imageLink" className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Image Link URL</Label>
              <VariableInput
                id="imageLink"
                value={localContent.link || ''}
                onChange={(val) => handleContentChange('link', val)}
                placeholder="https://example.com"
              />
            </div>

            {/* Border Radius */}
            <div>
              <Label htmlFor="borderRadius" className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Border Radius</Label>
              <div className="flex gap-2">
                <Input
                  id="borderRadius"
                  type="number"
                  value={parseInt(localStyles.borderRadius) || 0}
                  onChange={(e) => handleStyleChange('borderRadius', `${e.target.value}px`)}
                  min="0"
                  max="100"
                  className="text-xs bg-slate-50 border-slate-200"
                />
                <span className="text-xs text-slate-400 self-center">px</span>
              </div>
            </div>

            {/* Opacity */}
            <div>
              <Label htmlFor="opacity" className="text-[10px] font-bold uppercase text-slate-400 mb-1.5">Opacity</Label>
              <div className="flex items-center gap-2">
                <input
                  id="opacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={localStyles.opacity !== undefined ? Number(localStyles.opacity) : 1}
                  onChange={(e) => handleStyleChange('opacity', e.target.value)}
                  className="w-full accent-indigo-650"
                />
                <span className="text-xs text-slate-500 w-8 text-right shrink-0">
                  {Math.round((localStyles.opacity !== undefined ? Number(localStyles.opacity) : 1) * 100)}%
                </span>
              </div>
            </div>

            {/* Legacy localized AssetManager removed. Handled by global layout scope */}

            {/* ── Image Adjustments (imageSettings) ── */}
            <div className="space-y-3 pt-1 border-t border-slate-100">
              <Label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Image Adjustments</Label>
              <p className="text-[10px] text-slate-400 italic leading-relaxed">
                Double-click the image on the canvas to interactively adjust position and zoom. Or set values manually here.
              </p>

              {/* Fit */}
              <div>
                <Label className="text-xs text-slate-500 mb-1.5 block">Fit Mode</Label>
                <div className="flex gap-1.5">
                  {(['fill', 'cover', 'contain'] as const).map(f => {
                    const current = localContent.imageSettings?.fit || 'fill'
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => handleContentChange('imageSettings', {
                          ...(localContent.imageSettings || {}),
                          fit: f,
                        })}
                        className="flex-1 py-1 text-xs font-semibold rounded-md border transition-colors"
                        style={{
                          backgroundColor: current === f ? '#6366f1' : '#f8fafc',
                          color: current === f ? '#ffffff' : '#475569',
                          borderColor: current === f ? '#6366f1' : '#e2e8f0',
                        }}
                      >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Zoom */}
              <div>
                <Label className="text-xs text-slate-500 mb-1">
                  Zoom — {Math.round((localContent.imageSettings?.zoom ?? 1) * 100)}%
                </Label>
                <input
                  type="range" min="0.5" max="3" step="0.05"
                  value={localContent.imageSettings?.zoom ?? 1}
                  onChange={(e) => handleContentChange('imageSettings', {
                    ...(localContent.imageSettings || {}),
                    zoom: parseFloat(e.target.value),
                  })}
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Position X */}
              <div>
                <Label className="text-xs text-slate-500 mb-1">
                  Position X — {localContent.imageSettings?.objectPosition?.x ?? 50}%
                </Label>
                <input
                  type="range" min="0" max="100" step="1"
                  value={localContent.imageSettings?.objectPosition?.x ?? 50}
                  onChange={(e) => handleContentChange('imageSettings', {
                    ...(localContent.imageSettings || {}),
                    objectPosition: {
                      x: parseInt(e.target.value),
                      y: localContent.imageSettings?.objectPosition?.y ?? 50,
                    },
                  })}
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Position Y */}
              <div>
                <Label className="text-xs text-slate-500 mb-1">
                  Position Y — {localContent.imageSettings?.objectPosition?.y ?? 50}%
                </Label>
                <input
                  type="range" min="0" max="100" step="1"
                  value={localContent.imageSettings?.objectPosition?.y ?? 50}
                  onChange={(e) => handleContentChange('imageSettings', {
                    ...(localContent.imageSettings || {}),
                    objectPosition: {
                      x: localContent.imageSettings?.objectPosition?.x ?? 50,
                      y: parseInt(e.target.value),
                    },
                  })}
                  className="w-full accent-indigo-600"
                />
              </div>

              {/* Reset */}
              <button
                type="button"
                onClick={() => handleContentChange('imageSettings', { fit: 'fill', zoom: 1, objectPosition: { x: 50, y: 50 } })}
                className="w-full text-[10px] font-semibold text-slate-500 border border-slate-200 rounded-md py-1.5 hover:bg-slate-50 transition-colors"
              >
                ↺ Reset Adjustments
              </button>
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
              <VariableInput
                id="htmlContent"
                type="textarea"
                value={localContent.html || ''}
                onChange={(val) => handleContentChange('html', val)}
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
      case 'social-follow': {
        const ALL_SOCIAL_NETWORKS = [
          { id: 'facebook', label: 'Facebook' },
          { id: 'twitter', label: 'X (Twitter)' },
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
        const enabledNets = localContent.enabledNetworks || { linkedin: true, instagram: true, youtube: true }
        const urls = localContent.urls || {}
        const isFollowSection = block.type === 'social-follow' || localContent.layout === 'follow-section'

        const updateNetwork = (netId: string, enabled: boolean) => {
          const newEnabled = { ...enabledNets, [netId]: enabled }
          handleContentChange('enabledNetworks', newEnabled)
        }
        const updateUrl = (netId: string, url: string) => {
          const newUrls = { ...urls, [netId]: url }
          handleContentChange('urls', newUrls)
        }

        return (
          <div className="space-y-4">
            {/* Heading & Description – follow section only */}
            {isFollowSection && (
              <div className="space-y-3 border-b border-slate-100 pb-4">
                <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Section Content</Label>
                <div>
                  <Label htmlFor="socialHeading" className="text-xs text-slate-600">Heading</Label>
                  <Input
                    id="socialHeading"
                    value={localContent.heading || ''}
                    onChange={(e) => handleContentChange('heading', e.target.value)}
                    placeholder="Stay Connected"
                    className="mt-1 text-xs"
                  />
                </div>
                <div>
                  <Label htmlFor="socialDesc" className="text-xs text-slate-600">Description</Label>
                  <textarea
                    id="socialDesc"
                    value={localContent.description || ''}
                    onChange={(e) => handleContentChange('description', e.target.value)}
                    placeholder="Follow us for updates..."
                    rows={2}
                    className="mt-1 text-xs w-full rounded-md border border-input bg-background px-3 py-2 resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Leave empty to hide.</p>
                </div>
              </div>
            )}

            {/* Alignment */}
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Alignment</Label>
              <div className="flex gap-1.5">
                {(['left', 'center', 'right'] as const).map(dir => (
                  <button
                    key={dir}
                    type="button"
                    onClick={() => handleContentChange('alignment', dir)}
                    className="flex-1 h-8 text-xs font-medium rounded-md border transition-colors"
                    style={{
                      backgroundColor: (localContent.alignment || 'center') === dir ? '#6366f1' : '#f8fafc',
                      color: (localContent.alignment || 'center') === dir ? '#ffffff' : '#475569',
                      borderColor: (localContent.alignment || 'center') === dir ? '#6366f1' : '#e2e8f0',
                    }}
                  >
                    {dir === 'left' ? '← Left' : dir === 'center' ? '↔ Center' : 'Right →'}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Style */}
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">Icon Style</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'brand', label: 'Brand Colors' },
                  { id: 'monochrome', label: 'Monochrome' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleContentChange('iconStyle', opt.id)}
                    className="h-8 text-xs font-medium rounded-md border transition-colors"
                    style={{
                      backgroundColor: (localContent.iconStyle || 'brand') === opt.id ? '#6366f1' : '#f8fafc',
                      color: (localContent.iconStyle || 'brand') === opt.id ? '#ffffff' : '#475569',
                      borderColor: (localContent.iconStyle || 'brand') === opt.id ? '#6366f1' : '#e2e8f0',
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Icon Size */}
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Icon Size — {localContent.iconSize || 32}px
              </Label>
              <div className="flex gap-1.5">
                {[24, 28, 32, 40, 48].map(sz => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => handleContentChange('iconSize', sz)}
                    className="flex-1 h-7 text-[10px] font-semibold rounded border transition-colors"
                    style={{
                      backgroundColor: (localContent.iconSize || 32) === sz ? '#6366f1' : '#f8fafc',
                      color: (localContent.iconSize || 32) === sz ? '#ffffff' : '#475569',
                      borderColor: (localContent.iconSize || 32) === sz ? '#6366f1' : '#e2e8f0',
                    }}
                  >
                    {sz}
                  </button>
                ))}
              </div>
            </div>

            {/* Spacing */}
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Spacing — {localContent.spacing !== undefined ? localContent.spacing : 12}px
              </Label>
              <input
                type="range"
                min={4}
                max={32}
                step={2}
                value={localContent.spacing !== undefined ? localContent.spacing : 12}
                onChange={(e) => handleContentChange('spacing', Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            {/* Networks */}
            <div className="border-t border-slate-100 pt-4">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-3">Networks</Label>
              <div className="space-y-2">
                {ALL_SOCIAL_NETWORKS.map(net => (
                  <div key={net.id}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <input
                          id={`enable-${net.id}`}
                          type="checkbox"
                          checked={!!enabledNets[net.id]}
                          onChange={(e) => updateNetwork(net.id, e.target.checked)}
                          className="rounded border-slate-300 text-indigo-600 cursor-pointer"
                        />
                        <label htmlFor={`enable-${net.id}`} className="text-xs font-medium text-slate-700 cursor-pointer select-none">
                          {net.label}
                        </label>
                      </div>
                    </div>
                    {enabledNets[net.id] && (
                      <Input
                        value={urls[net.id] || ''}
                        onChange={(e) => updateUrl(net.id, e.target.value)}
                        placeholder={`https://${net.id === 'email' ? 'mailto:you@example.com' : `${net.id}.com/profile`}`}
                        className="text-[11px] h-7 ml-6"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }

      case '2column':
      case '3column': {
        const colCount = block.type === '3column' ? 3 : 2
        return (
          <div className="space-y-4">
            <Label className="text-sm font-medium">Column Settings</Label>
            
            {block.type === '2column' && (
              <div>
                <Label className="text-xs font-semibold text-slate-655 mb-1.5 block">Layout Width Ratio</Label>
                <Select
                  value={localContent.layoutRatio || "50/50"}
                  onValueChange={(val) => handleContentChange('layoutRatio', val)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="Select ratio" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50/50">Equal Width (50% / 50%)</SelectItem>
                    <SelectItem value="40/60">40% / 60%</SelectItem>
                    <SelectItem value="30/70">30% / 70%</SelectItem>
                    <SelectItem value="25/75">25% / 75%</SelectItem>
                    <SelectItem value="60/40">60% / 40%</SelectItem>
                    <SelectItem value="70/30">70% / 30%</SelectItem>
                    <SelectItem value="75/25">75% / 25%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            <Label className="text-sm font-medium pt-2 block border-t border-slate-100">Column Content Settings</Label>
            {Array.from({ length: colCount }).map((_, idx) => {
              const colIdx = idx + 1
              const colType = localContent[`col${colIdx}Type`] || 'text'
              return (
                <div key={colIdx} className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-bold uppercase text-slate-500">Column {colIdx}</Label>
                    <Select
                      value={colType}
                      onValueChange={(val) => handleContentChange(`col${colIdx}Type`, val)}
                    >
                      <SelectTrigger className="h-7 w-24 text-[11px]">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="text">Rich Text</SelectItem>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="button">Button</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {colType === 'text' && (
                    <div>
                      <Label htmlFor={`col-${colIdx}`} className="text-[10px] text-gray-500">HTML/Text Content</Label>
                      <VariableInput
                        id={`col-${colIdx}`}
                        type="textarea"
                        value={localContent[`text${colIdx}`] || ''}
                        onChange={(val) => handleContentChange(`text${colIdx}`, val)}
                        rows={2}
                      />
                    </div>
                  )}

                  {colType === 'image' && (
                    <div className="space-y-2">
                      <div>
                        <Label htmlFor={`col-img-${colIdx}`} className="text-[10px] text-gray-500">Image Source URL</Label>
                        <div className="flex gap-2">
                          <Input
                            id={`col-img-${colIdx}`}
                            value={localContent[`col${colIdx}ImageSrc`] || ''}
                            onChange={(e) => handleContentChange(`col${colIdx}ImageSrc`, e.target.value)}
                            className="h-8 text-xs flex-1"
                            placeholder="https://example.com/logo.png"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2 text-[10px] border-slate-200"
                            onClick={() => onOpenAssetManager?.(block.id, colIdx)}
                          >
                            Upload/Choose
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] text-gray-500">Width (%)</Label>
                          <Input
                            type="number"
                            value={localContent[`col${colIdx}ImageWidth`] || '100'}
                            onChange={(e) => handleContentChange(`col${colIdx}ImageWidth`, e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500">Alignment</Label>
                          <Select
                            value={localContent[`col${colIdx}ImageAlignment`] || 'center'}
                            onValueChange={(val) => handleContentChange(`col${colIdx}ImageAlignment`, val)}
                          >
                            <SelectTrigger className="h-8 text-xs">
                              <SelectValue placeholder="Alignment" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="left">Left</SelectItem>
                              <SelectItem value="center">Center</SelectItem>
                              <SelectItem value="right">Right</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  {colType === 'button' && (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] text-gray-500">Button Text</Label>
                          <Input
                            value={localContent[`col${colIdx}ButtonText`] || 'Click Here'}
                            onChange={(e) => handleContentChange(`col${colIdx}ButtonText`, e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500">Button URL</Label>
                          <Input
                            value={localContent[`col${colIdx}ButtonUrl`] || '#'}
                            onChange={(e) => handleContentChange(`col${colIdx}ButtonUrl`, e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-[10px] text-gray-500">Background Color</Label>
                          <Input
                            type="color"
                            value={localContent[`col${colIdx}ButtonBg`] || '#007bff'}
                            onChange={(e) => handleContentChange(`col${colIdx}ButtonBg`, e.target.value)}
                            className="h-8 w-full p-0 border-0"
                          />
                        </div>
                        <div>
                          <Label className="text-[10px] text-gray-500">Text Color</Label>
                          <Input
                            type="color"
                            value={localContent[`col${colIdx}ButtonColor`] || '#ffffff'}
                            onChange={(e) => handleContentChange(`col${colIdx}ButtonColor`, e.target.value)}
                            className="h-8 w-full p-0 border-0"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      }

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
            {/* Border, Radius & Shadow controls */}
            <div className="border-t border-slate-100 pt-3 space-y-3">
              <Label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Border & Radius</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="borderStyle" className="text-xs text-slate-500">Border Style</Label>
                  <div className="flex gap-1.5 mt-1">
                    {[
                      { id: 'none', label: 'None' },
                      { id: 'solid', label: 'Solid' },
                      { id: 'dashed', label: 'Dashed' },
                      { id: 'dotted', label: 'Dotted' }
                    ].map((style) => {
                      const isActive = (localStyles.borderStyle || 'none') === style.id;
                      return (
                        <button
                          key={style.id}
                          type="button"
                          title={style.label}
                          onClick={() => {
                            handleStyleChange('borderStyle', style.id);
                            if (style.id === 'none') {
                              handleStyleChange('border', 'none');
                            } else {
                              handleStyleChange('border', `${localStyles.borderWidth || '1px'} ${style.id} ${localStyles.borderColor || '#cbd5e1'}`);
                            }
                          }}
                          className={`flex-1 h-8 rounded-md border flex items-center justify-center transition-all ${
                            isActive
                              ? "border-red-650 bg-red-50 text-red-750 font-semibold shadow-sm"
                              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
                          }`}
                        >
                          <div 
                            className="w-5 h-5 rounded flex items-center justify-center"
                            style={{
                              borderWidth: style.id === 'none' ? '0px' : '2px',
                              borderStyle: style.id as any,
                              borderColor: isActive ? '#dc2626' : '#94a3b8',
                            }}
                          >
                            {style.id === 'none' && <span className="text-[10px] text-slate-400 font-bold">∅</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <Label htmlFor="borderWidth" className="text-xs text-slate-500">Border Width (px)</Label>
                  <Input
                    id="borderWidth"
                    type="number"
                    value={parseInt(localStyles.borderWidth) || 0}
                    onChange={(e) => {
                      const val = e.target.value ? `${e.target.value}px` : '0px';
                      handleStyleChange('borderWidth', val);
                      if (localStyles.borderStyle && localStyles.borderStyle !== 'none') {
                        handleStyleChange('border', `${val} ${localStyles.borderStyle} ${localStyles.borderColor || '#cbd5e1'}`);
                      }
                    }}
                    className="h-8 text-xs"
                    min="0"
                    max="20"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="borderColor" className="text-xs text-slate-500">Border Color</Label>
                  <Input
                    id="borderColor"
                    type="color"
                    value={localStyles.borderColor || '#cbd5e1'}
                    onChange={(e) => {
                      handleStyleChange('borderColor', e.target.value);
                      if (localStyles.borderStyle && localStyles.borderStyle !== 'none') {
                        handleStyleChange('border', `${localStyles.borderWidth || '1px'} ${localStyles.borderStyle} ${e.target.value}`);
                      }
                    }}
                    className="h-8 p-1 w-full"
                  />
                </div>
                <div>
                  <Label htmlFor="borderRadius" className="text-xs text-slate-500">Border Radius (px)</Label>
                  <Input
                    id="borderRadius"
                    type="number"
                    value={parseInt(localStyles.borderRadius) || 0}
                    onChange={(e) => handleStyleChange('borderRadius', `${e.target.value}px`)}
                    className="h-8 text-xs"
                    min="0"
                    max="100"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="boxShadow" className="text-xs text-slate-500">Shadow Style</Label>
                <Select value={localStyles.boxShadow || 'none'} onValueChange={(value) => handleStyleChange('boxShadow', value)}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="No Shadow" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="0 1px 3px rgba(0,0,0,0.1)">Light Shadow</SelectItem>
                    <SelectItem value="0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)">Medium Shadow</SelectItem>
                    <SelectItem value="0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)">Deep Shadow</SelectItem>
                  </SelectContent>
                </Select>
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

  const [activeSection, setActiveSection] = useState<'content' | 'style' | 'spacing' | 'actions' | null>('content')

  return (
    <div className="h-full flex flex-col bg-slate-50 select-none">
      {/* Zoho-style Header: back arrow + block-type title + Done button */}
      <div className="shrink-0 bg-white border-b border-slate-200">
        {/* Top row: back button + title */}
        <div className="flex items-center gap-2 px-3 pt-3 pb-2">
          {onDone && (
            <button
              type="button"
              onClick={onDone}
              className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors shrink-0"
              title="Back to palette"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 leading-none">Properties</p>
            <h3 className="text-sm font-semibold text-slate-800 capitalize truncate leading-snug mt-0.5">
              {block.type.replace(/-/g, ' ')} Block
            </h3>
          </div>
        </div>
        {/* Done button — full-width, orange, matching Zoho */}
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white text-xs font-bold uppercase tracking-wider py-2.5 transition-colors"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Done
          </button>
        )}
      </div>

      {/* Accordion Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Accordion 1: Content */}
        <details 
          className="bg-white border border-slate-200 rounded-xl shadow-sm open:pb-4 group transition-all" 
          open={activeSection === 'content'}
        >
          <summary 
            className="font-bold text-[10px] uppercase tracking-wider text-slate-500 p-3.5 flex items-center justify-between cursor-pointer list-none select-none"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection(activeSection === 'content' ? null : 'content');
            }}
          >
            <span>Content Options</span>
            <ChevronRight className="h-4 w-4 text-slate-455 group-open:rotate-90 transition-transform" />
          </summary>
          <div className="px-4 space-y-4">
            {renderContentControls()}
          </div>
        </details>

        {/* Accordion 2: Style */}
        <details 
          className="bg-white border border-slate-200 rounded-xl shadow-sm open:pb-4 group transition-all" 
          open={activeSection === 'style'}
        >
          <summary 
            className="font-bold text-[10px] uppercase tracking-wider text-slate-500 p-3.5 flex items-center justify-between cursor-pointer list-none select-none"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection(activeSection === 'style' ? null : 'style');
            }}
          >
            <span>Style & Typography</span>
            <ChevronRight className="h-4 w-4 text-slate-455 group-open:rotate-90 transition-transform" />
          </summary>
          <div className="px-4 space-y-4">
            {renderStyleControls()}
          </div>
        </details>

        {/* Accordion 3: Spacing */}
        <details 
          className="bg-white border border-slate-200 rounded-xl shadow-sm open:pb-4 group transition-all"
          open={activeSection === 'spacing'}
        >
          <summary 
            className="font-bold text-[10px] uppercase tracking-wider text-slate-500 p-3.5 flex items-center justify-between cursor-pointer list-none select-none"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection(activeSection === 'spacing' ? null : 'spacing');
            }}
          >
            <span>Padding & Margins</span>
            <ChevronRight className="h-4 w-4 text-slate-455 group-open:rotate-90 transition-transform" />
          </summary>
          <div className="px-4 space-y-4">
            {/* Directional Padding */}
            <div className="space-y-2">
              <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Padding</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['top', 'right', 'bottom', 'left'] as const).map((side) => {
                  const pVals = parseShorthand(localStyles.padding, 20);
                  const currentVal = pVals[side];
                  return (
                    <div key={side} className="flex flex-col gap-1 items-center">
                      <span className="text-[9px] text-slate-400 font-semibold uppercase">{side}</span>
                      <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden h-8 w-full bg-white">
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            const updated = { ...pVals, [side]: Math.max(0, currentVal - 1) };
                            handleStyleChange('padding', serializeShorthand(updated.top, updated.right, updated.bottom, updated.left));
                          }}
                          className="flex-none h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors font-bold select-none"
                          style={{ width: 20, fontSize: 13 }}
                        >−</button>
                        <input
                          type="number"
                          value={currentVal}
                          onFocus={() => setFocusedPaddingField(side)}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            const updated = { ...pVals, [side]: val };
                            handleStyleChange('padding', serializeShorthand(updated.top, updated.right, updated.bottom, updated.left));
                          }}
                          className="stepper-input"
                          style={{ flex: '1 1 0%', minWidth: 0, width: 0, textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#334155', background: 'transparent', border: 'none', outline: 'none', padding: 0 }}
                          min="0"
                          max="500"
                        />
                        <button
                          type="button"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            const updated = { ...pVals, [side]: currentVal + 1 };
                            handleStyleChange('padding', serializeShorthand(updated.top, updated.right, updated.bottom, updated.left));
                          }}
                          className="flex-none h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors font-bold select-none"
                          style={{ width: 20, fontSize: 13 }}
                        >+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-1.5 flex-wrap mt-1">
                {[16, 24, 32, 40, 48].map((preset) => {
                  const pVals = parseShorthand(localStyles.padding, 20);
                  const isPresetActive = focusedPaddingField 
                    ? pVals[focusedPaddingField] === preset
                    : Object.values(pVals).every(v => v === preset);

                  return (
                    <button
                      key={preset}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (focusedPaddingField) {
                          const updated = { ...pVals, [focusedPaddingField]: preset };
                          handleStyleChange('padding', serializeShorthand(updated.top, updated.right, updated.bottom, updated.left));
                        } else {
                          handleStyleChange('padding', serializeShorthand(preset, preset, preset, preset));
                        }
                      }}
                      className={`text-[9px] font-medium border px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        isPresetActive
                          ? "bg-red-600 border-red-600 text-white"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border-slate-200"
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Directional Margin */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <Label className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Margin</Label>
              <div className="grid grid-cols-2 gap-2">
                {(['top', 'right', 'bottom', 'left'] as const).map((side) => {
                  const mVals = parseShorthand(localStyles.margin, 0);
                  const currentVal = mVals[side];
                  const isDisabled = block.type === 'image' && (side === 'left' || side === 'right');
                  return (
                    <div key={side} className={`flex flex-col gap-1 items-center ${isDisabled ? 'opacity-40' : ''}`}>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase">{side}</span>
                      <div className={`flex items-center border border-slate-200 rounded-lg overflow-hidden h-8 w-full ${isDisabled ? 'bg-slate-100' : 'bg-white'}`}>
                        <button
                          type="button"
                          disabled={isDisabled}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            const updated = { ...mVals, [side]: Math.max(0, currentVal - 1) };
                            handleStyleChange('margin', serializeShorthand(updated.top, updated.right, updated.bottom, updated.left));
                          }}
                          className="flex-none h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors font-bold select-none disabled:pointer-events-none"
                          style={{ width: 20, fontSize: 13 }}
                        >−</button>
                        <input
                          type="number"
                          value={currentVal}
                          disabled={isDisabled}
                          onFocus={() => setFocusedMarginField(side)}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            const updated = { ...mVals, [side]: val };
                            handleStyleChange('margin', serializeShorthand(updated.top, updated.right, updated.bottom, updated.left));
                          }}
                          className="stepper-input disabled:cursor-not-allowed"
                          style={{ flex: '1 1 0%', minWidth: 0, width: 0, textAlign: 'center', fontSize: '12px', fontWeight: 600, color: '#334155', background: 'transparent', border: 'none', outline: 'none', padding: 0 }}
                          min="0"
                          max="500"
                        />
                        <button
                          type="button"
                          disabled={isDisabled}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => {
                            const updated = { ...mVals, [side]: currentVal + 1 };
                            handleStyleChange('margin', serializeShorthand(updated.top, updated.right, updated.bottom, updated.left));
                          }}
                          className="flex-none h-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors font-bold select-none disabled:pointer-events-none"
                          style={{ width: 20, fontSize: 13 }}
                        >+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              {block.type === 'image' && (
                <p className="text-[9px] text-slate-400 leading-normal mt-1.5 italic">
                  * Horizontal margin is disabled. Position is controlled by Alignment above.
                </p>
              )}
              <div className="flex gap-1.5 flex-wrap mt-1">
                {[16, 24, 32, 40, 48].map((preset) => {
                  const mVals = parseShorthand(localStyles.margin, 0);
                  const isPresetActive = focusedMarginField 
                    ? mVals[focusedMarginField] === preset
                    : Object.values(mVals).every(v => v === preset);

                  return (
                    <button
                      key={preset}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        if (focusedMarginField) {
                          const updated = { ...mVals, [focusedMarginField]: preset };
                          handleStyleChange('margin', serializeShorthand(updated.top, updated.right, updated.bottom, updated.left));
                        } else {
                          handleStyleChange('margin', serializeShorthand(preset, preset, preset, preset));
                        }
                      }}
                      className={`text-[9px] font-medium border px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        isPresetActive
                          ? "bg-red-600 border-red-600 text-white"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700 border-slate-200"
                      }`}
                    >
                      {preset}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </details>

        {/* Accordion 4: Actions */}
        <details 
          className="bg-white border border-slate-200 rounded-xl shadow-sm open:pb-4 group transition-all"
          open={activeSection === 'actions'}
        >
          <summary 
            className="font-bold text-[10px] uppercase tracking-wider text-slate-500 p-3.5 flex items-center justify-between cursor-pointer list-none select-none"
            onClick={(e) => {
              e.preventDefault();
              setActiveSection(activeSection === 'actions' ? null : 'actions');
            }}
          >
            <span>Interactions & Actions</span>
            <ChevronRight className="h-4 w-4 text-slate-455 group-open:rotate-90 transition-transform" />
          </summary>
          <div className="px-4 space-y-4">
            <div>
              <Label htmlFor="actionLink" className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Action Link URL</Label>
              <VariableInput
                id="actionLink"
                value={localContent.url || ''}
                onChange={(val) => handleContentChange('url', val)}
                placeholder="https://example.com"
                className="text-xs"
              />
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input
                id="targetBlank"
                type="checkbox"
                checked={localContent.target === '_blank'}
                onChange={(e) => handleContentChange('target', e.target.checked ? '_blank' : '_self')}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="targetBlank" className="text-xs text-slate-600 font-medium">Open in new tab</Label>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <input
                id="hideMobile"
                type="checkbox"
                checked={localStyles.hideMobile === 'true'}
                onChange={(e) => handleStyleChange('hideMobile', e.target.checked ? 'true' : 'false')}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <Label htmlFor="hideMobile" className="text-xs text-slate-600 font-medium">Hide on mobile</Label>
            </div>
          </div>
        </details>
      </div>
    </div>
  )
}
