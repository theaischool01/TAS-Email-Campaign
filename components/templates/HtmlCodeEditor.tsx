"use client"

import { useState, useRef, useEffect } from "react"
import { Copy, Check, RefreshCw, Play, Sparkles, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Editor from "@monaco-editor/react"

// Module-level: survives component unmount, preserves cursor/scroll/folds
let savedViewState: any = null

interface HtmlCodeEditorProps {
  html: string
  onChange: (html: string) => void
  onApplyChanges?: () => void
  onResetFromVisual?: () => void
  isDirty?: boolean
  validationError?: string | null
}

export default function HtmlCodeEditor({
  html,
  onChange,
  onApplyChanges,
  onResetFromVisual,
  isDirty = false,
  validationError = null
}: HtmlCodeEditorProps) {
  const [copied, setCopied] = useState(false)
  const editorRef = useRef<any>(null)

  // Save view state on unmount so it can be restored on remount
  useEffect(() => {
    return () => {
      if (editorRef.current) {
        savedViewState = editorRef.current.saveViewState()
      }
    }
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(html)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Failed to copy HTML:", error)
    }
  }

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor
    // Restore previous view state (cursor, scroll, folds) if available
    if (savedViewState) {
      editor.restoreViewState(savedViewState)
    }
  }

  const handleFormat = () => {
    if (editorRef.current) {
      editorRef.current.trigger("source", "editor.action.formatDocument")
    }
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 text-white select-none">
      {/* Editor Subbar Toolbar */}
      <div className="border-b border-slate-800 bg-slate-950 px-4 py-3 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-450">HTML Editor</span>
          {isDirty && (
            <span className="text-[10px] font-semibold bg-amber-500/20 text-amber-450 border border-amber-500/30 rounded px-2 py-0.5 animate-pulse">
              Pending Changes
            </span>
          )}
          {!isDirty && (
            <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-450 border border-emerald-500/30 rounded px-2 py-0.5">
              Synced
            </span>
          )}
        </div>
        <div className="flex gap-2 items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFormat}
            className="text-xs h-8 text-slate-300 hover:text-white hover:bg-slate-850 gap-1.5"
            title="Format HTML code using Monaco auto-formatter"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Format Document
          </Button>

          {onResetFromVisual && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFromVisual}
              className="text-xs h-8 text-slate-300 hover:text-white hover:bg-slate-850 gap-1.5"
              title="Reset HTML template from visual canvas editor state"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reset From Visual
            </Button>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="text-xs h-8 text-slate-300 hover:text-white hover:bg-slate-850 gap-1.5"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-500" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                Copy
              </>
            )}
          </Button>

          {onApplyChanges && (
            <Button
              size="sm"
              onClick={onApplyChanges}
              className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5"
              title="Apply edits to visual canvas blocks"
            >
              <Play className="h-3.5 w-3.5" />
              Apply Changes
            </Button>
          )}
        </div>
      </div>

      {/* Parsing Validation Error Banner */}
      {validationError && (
        <div className="bg-red-500/10 border-b border-red-500/30 px-4 py-2.5 flex items-start gap-2 text-xs text-red-400 shrink-0">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-500" />
          <div className="leading-relaxed">
            <span className="font-bold">HTML Compilation Error: </span>
            {validationError}
          </div>
        </div>
      )}

      {/* Code Editor Container */}
      <div className="flex-1 overflow-hidden relative">
        <Editor
          height="100%"
          defaultLanguage="html"
          language="html"
          theme="vs-dark"
          path="mailflow-html-editor.html"
          value={html}
          onChange={(val) => onChange(val || "")}
          onMount={handleEditorDidMount}
          options={{
            wordWrap: "on",
            lineNumbers: "on",
            minimap: { enabled: false },
            autoClosingBrackets: "always",
            tabSize: 2,
            fontFamily: 'Consolas, Monaco, "Courier New", monospace',
            fontSize: 13,
            formatOnPaste: true,
            formatOnType: true,
            scrollBeyondLastLine: false,
          }}
        />
      </div>

      {/* Editor Status bar Footer */}
      <div className="border-t border-slate-800 bg-slate-950 px-4 py-2 shrink-0">
        <div className="flex justify-between items-center text-[10px] text-slate-500">
          <div>
            Format Document formats layout • Apply Changes parses back to drag & drop canvas.
          </div>
          <div>
            {html.length} chars
          </div>
        </div>
      </div>
    </div>
  )
}
