"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"

interface BasicTemplateEditorProps {
  initialHtml?: string
  onSave?: () => Promise<void>
  onChange?: () => void
}

export interface BasicTemplateEditorRef {
  getHtml: () => string
  setHtml: (html: string) => void
}

const BasicTemplateEditor = forwardRef<BasicTemplateEditorRef, BasicTemplateEditorProps>(
  ({ initialHtml = "", onSave, onChange }, ref) => {
    const editorRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
      if (editorRef.current && initialHtml) {
        editorRef.current.value = initialHtml
      }
    }, [initialHtml])

    const handleChange = () => {
      if (onChange) {
        onChange()
      }
    }

    useImperativeHandle(ref, () => ({
      getHtml: () => editorRef.current?.value || "",
      setHtml: (html: string) => {
        if (editorRef.current) {
          editorRef.current.value = html
        }
      }
    }))

    return (
      <textarea
        ref={editorRef}
        onChange={handleChange}
        className="w-full h-full p-4 font-mono text-sm border border-gray-300 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Start typing your email content here..."
        style={{ minHeight: '500px' }}
      />
    )
  }
)

BasicTemplateEditor.displayName = "BasicTemplateEditor"

export default BasicTemplateEditor
