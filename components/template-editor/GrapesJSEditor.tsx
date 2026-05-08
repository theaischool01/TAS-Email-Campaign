"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import grapesjs from "grapesjs"
import "grapesjs-preset-newsletter"

interface GrapesJSEditorProps {
  initialHtml?: string
  initialJson?: any
  onSave?: () => Promise<void>
  onChange?: () => void
}

export interface GrapesJSEditorRef {
  getHtml: () => string
  getCss: () => string
  getComponents: () => any
  getProjectData: () => any
  destroy: () => void
}

const GrapesJSEditor = forwardRef<GrapesJSEditorRef, GrapesJSEditorProps>(
  ({ initialHtml, initialJson, onSave, onChange }, ref) => {
    const editorRef = useRef<any>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
      if (!containerRef.current) return

      // Initialize GrapesJS with newsletter preset
      const editor = grapesjs.init({
        container: containerRef.current,
        fromElement: false,
        components: initialJson || [],
        plugins: ['gjs-preset-newsletter'],
        pluginsOpts: {
          'gjs-preset-newsletter': {
            // Newsletter specific options
            blocks: [
              // Custom blocks will be added here
            ],
            blockCategories: {
              basic: {
                label: 'Basic',
                order: 0,
                open: false
              },
              layout: {
                label: 'Layout',
                order: 1,
                open: false
              }
            }
          }
        },
        storageManager: false,
        canvas: {
          styles: [
            // Default email-safe styles
            'body { margin: 0; padding: 0; font-family: Arial, sans-serif; }',
            'table { border-collapse: collapse; }',
            'img { max-width: 100%; height: auto; }'
          ]
        }
      })

      editorRef.current = editor

      // Set initial content if provided
      if (initialHtml) {
        editor.setComponents(initialHtml)
      }

      // Handle changes
      if (onChange) {
        editor.on('component:add', () => onChange())
        editor.on('component:update', () => onChange())
        editor.on('component:remove', () => onChange())
        editor.on('style:update', () => onChange())
        editor.on('storage:start', () => onChange())
      }

      // Auto-save on changes
      if (onSave) {
        let saveTimeout: NodeJS.Timeout
        const debouncedSave = () => {
          clearTimeout(saveTimeout)
          saveTimeout = setTimeout(() => {
            onSave()
          }, 2000) // 2 second debounce
        }

        editor.on('component:add', debouncedSave)
        editor.on('component:update', debouncedSave)
        editor.on('component:remove', debouncedSave)
        editor.on('style:update', debouncedSave)
      }

      // Expose editor methods via ref
      useImperativeHandle(ref, () => ({
        getHtml: () => editor.getHtml(),
        getCss: () => editor.getCss(),
        getComponents: () => editor.getComponents(),
        getProjectData: () => editor.getProjectData(),
        destroy: () => editor.destroy()
      }))

      return () => {
        if (editorRef.current) {
          editorRef.current.destroy()
        }
      }
    }, [initialHtml, initialJson, onChange, onSave])

    return (
      <div 
        ref={containerRef} 
        className="h-full w-full"
        style={{ minHeight: '500px' }}
      />
    )
  }
)

GrapesJSEditor.displayName = "GrapesJSEditor"

export default GrapesJSEditor
