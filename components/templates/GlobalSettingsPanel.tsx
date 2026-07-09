"use client"

import React, { useMemo } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Settings, ShieldCheck, AlertTriangle, Info, Palette } from "lucide-react"

interface TemplateBlock {
  id: string
  type: string
  content: Record<string, any>
  styles: Record<string, any>
}

interface GlobalSettingsPanelProps {
  blocks: TemplateBlock[]
  globalWidth: number
  onGlobalWidthChange: (width: number) => void
  globalBgColor: string
  onGlobalBgColorChange: (color: string) => void
  globalFont: string
  onGlobalFontChange: (font: string) => void
  brandColor: string
  onBrandColorChange: (color: string) => void
}

export default function GlobalSettingsPanel({
  blocks,
  globalWidth,
  onGlobalWidthChange,
  globalBgColor,
  onGlobalBgColorChange,
  globalFont,
  onGlobalFontChange,
  brandColor,
  onBrandColorChange
}: GlobalSettingsPanelProps) {
  // Real-time Advisory Email Health Checks
  const healthStats = useMemo(() => {
    const images = blocks.filter(b => b.type === 'image')
    const imagesCount = images.length
    const imagesWithAlt = images.filter(b => b.content?.alt && b.content.alt !== 'Placeholder').length

    const buttons = blocks.filter(b => b.type === 'button')
    const buttonsCount = buttons.length
    const buttonsWithUrl = buttons.filter(b => b.content?.url && b.content.url !== '#' && b.content.url !== '').length

    const hasFooter = blocks.some(b => b.type === 'footer')
    
    // Check if unsubscribe merge tag or standard link exists anywhere
    const hasUnsubscribe = blocks.some(b => {
      const textVal = b.content?.text || b.content?.unsubscribeText || b.content?.html || ""
      return textVal.includes("{{unsubscribe_url}}") || textVal.includes("unsubscribe") || textVal.includes("{{unsubscribeLink}}")
    })

    // Calculate score
    let score = 100
    const deductions: { label: string; type: "warning" | "info" }[] = []

    if (imagesCount > 0 && imagesWithAlt < imagesCount) {
      score -= (imagesCount - imagesWithAlt) * 10
      deductions.push({ label: `${imagesCount - imagesWithAlt} image(s) missing Alt Text description`, type: "info" })
    }

    if (buttonsCount > 0 && buttonsWithUrl < buttonsCount) {
      score -= (buttonsCount - buttonsWithUrl) * 15
      deductions.push({ label: `${buttonsCount - buttonsWithUrl} button(s) missing redirect URLs`, type: "warning" })
    }

    if (!hasFooter) {
      score -= 20
      deductions.push({ label: "Missing footer component block", type: "warning" })
    } else if (!hasUnsubscribe) {
      score -= 25
      deductions.push({ label: "Missing unsubscribe tag in footer/body", type: "warning" })
    }

    if (globalWidth > 650 || globalWidth < 500) {
      score -= 10
      deductions.push({ label: "Width outside recommended (500px - 650px) range", type: "info" })
    }

    return {
      score: Math.max(0, score),
      deductions,
      imagesCheck: imagesCount === 0 || imagesWithAlt === imagesCount,
      buttonsCheck: buttonsCount === 0 || buttonsWithUrl === buttonsCount,
      unsubscribeCheck: hasUnsubscribe
    }
  }, [blocks, globalWidth])

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-y-auto select-none">
      <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10 shrink-0">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
          <Settings className="h-4 w-4 text-slate-500" />
          Global Settings
        </h3>
      </div>

      <div className="p-4 space-y-5">
        {/* Email Health Card */}
        <Card className="border-slate-200 shadow-sm overflow-hidden bg-white">
          <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Email Health Checker
            </h4>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              healthStats.score >= 80 
                ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                : "bg-amber-50 text-amber-700 border border-amber-100"
            }`}>
              {healthStats.score}/100
            </span>
          </div>
          <CardContent className="p-4 space-y-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Alt Text Checklist</span>
                <span className="font-semibold text-slate-700">{healthStats.imagesCheck ? "✓ Complete" : "⚠ Missing"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Buttons Redirect Link</span>
                <span className="font-semibold text-slate-700">{healthStats.buttonsCheck ? "✓ Complete" : "⚠ Missing"}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Unsubscribe Merge Tag</span>
                <span className="font-semibold text-slate-700">{healthStats.unsubscribeCheck ? "✓ Complete" : "⚠ Missing"}</span>
              </div>
            </div>

            {healthStats.deductions.length > 0 && (
              <div className="border-t border-slate-100 pt-3 space-y-2">
                <div className="text-[10px] font-bold uppercase text-slate-400">Suggestions:</div>
                {healthStats.deductions.map((d, idx) => (
                  <div key={idx} className="flex gap-1.5 text-xs leading-relaxed items-start">
                    {d.type === "warning" ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="h-3.5 w-3.5 text-blue-500 shrink-0 mt-0.5" />
                    )}
                    <span className="text-slate-650">{d.label}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Global Design Theme Panel */}
        <div className="space-y-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Palette className="h-3.5 w-3.5 text-slate-500" />
            Global Theme Panel
          </h4>
          
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-semibold text-slate-600">Brand Primary Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={brandColor}
                  onChange={(e) => onBrandColorChange(e.target.value)}
                  className="h-9 w-12 p-0.5 border-slate-200 cursor-pointer"
                />
                <Input
                  type="text"
                  value={brandColor}
                  onChange={(e) => onBrandColorChange(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200 h-9"
                  placeholder="#007bff"
                />
              </div>
              <span className="text-[10px] text-slate-450 mt-1 block">Recolors buttons and headers automatically.</span>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600">Canvas Background Color</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  type="color"
                  value={globalBgColor}
                  onChange={(e) => onGlobalBgColorChange(e.target.value)}
                  className="h-9 w-12 p-0.5 border-slate-200 cursor-pointer"
                />
                <Input
                  type="text"
                  value={globalBgColor}
                  onChange={(e) => onGlobalBgColorChange(e.target.value)}
                  className="text-xs bg-slate-50 border-slate-200 h-9"
                  placeholder="#ffffff"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600">Email Canvas Width</Label>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="range"
                  min="500"
                  max="700"
                  step="10"
                  value={globalWidth}
                  onChange={(e) => onGlobalWidthChange(Number(e.target.value))}
                  className="w-full accent-blue-600"
                />
                <span className="text-xs font-semibold text-slate-655 shrink-0 w-12 text-right">
                  {globalWidth}px
                </span>
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-600">Global Typography Font</Label>
              <Select value={globalFont} onValueChange={onGlobalFontChange}>
                <SelectTrigger className="h-9 border-slate-200 mt-1 text-xs">
                  <SelectValue placeholder="Select font family..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial, sans-serif">Arial (Standard)</SelectItem>
                  <SelectItem value="'Helvetica Neue', Helvetica, sans-serif">Helvetica</SelectItem>
                  <SelectItem value="'Georgia', serif">Georgia (Editorial)</SelectItem>
                  <SelectItem value="'Times New Roman', Times, serif">Times New Roman</SelectItem>
                  <SelectItem value="'Trebuchet MS', sans-serif">Trebuchet MS</SelectItem>
                  <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
