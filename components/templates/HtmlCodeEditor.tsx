"use client"

import { useState, useRef } from "react"
import { Copy, Check, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HtmlCodeEditorProps {
  html: string
  onChange: (html: string) => void
}

export default function HtmlCodeEditor({ html, onChange }: HtmlCodeEditorProps) {
  const [copied, setCopied] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(html)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy HTML:", error)
    }
  }

  const handleDownload = () => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle tab key for indentation
    if (e.key === 'Tab') {
      e.preventDefault()
      const target = e.currentTarget
      const start = target.selectionStart
      const end = target.selectionEnd
      
      const newHtml = html.substring(0, start) + '  ' + html.substring(end)
      onChange(newHtml)
      
      // Restore cursor position
      setTimeout(() => {
        target.selectionStart = target.selectionEnd = start + 2
      }, 0)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">HTML Code</span>
          <span className="text-xs text-gray-500">
            {html.length} characters
          </span>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="flex items-center gap-2"
          >
            <Download className="h-3 w-3" />
            Download
          </Button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto">
        <textarea
          ref={textareaRef}
          value={html}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-full p-4 font-mono text-sm bg-gray-900 text-green-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="HTML content will appear here..."
          style={{ 
            minHeight: '500px',
            tabSize: 2,
            fontFamily: 'Consolas, Monaco, "Courier New", monospace'
          }}
          spellCheck={false}
        />
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 bg-gray-50 px-4 py-2">
        <div className="flex justify-between items-center text-xs text-gray-600">
          <div>
            Press Tab to indent • Use Shift+Tab to unindent
          </div>
          <div>
            HTML is automatically synced with visual editor
          </div>
        </div>
      </div>
    </div>
  )
}
