"use client"

import { useEffect, useRef, forwardRef, useImperativeHandle, useState, useCallback } from "react"
import grapesjs from "grapesjs"
import "grapesjs-preset-newsletter"

interface ProfessionalGrapesJSEditorProps {
  initialHtml?: string
  initialJson?: any
  onSave?: () => Promise<void>
  onChange?: () => void
  onBlockAdd?: (blockType: string) => void
}

export interface ProfessionalGrapesJSEditorRef {
  getHtml: () => string
  getCss: () => string
  getComponents: () => any
  getProjectData: () => any
  destroy: () => void
  getEditor: () => any
  addBlock: (blockType: string) => void
  undo: () => void
  redo: () => void
}

const ProfessionalGrapesJSEditor = forwardRef<ProfessionalGrapesJSEditorRef, ProfessionalGrapesJSEditorProps>(
  ({ initialHtml, initialJson, onSave, onChange, onBlockAdd }, ref) => {
    const editorRef = useRef<any>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const [isInitialized, setIsInitialized] = useState(false)
    const [editorInstance, setEditorInstance] = useState<any>(null)

    // Custom email blocks
    const createCustomBlocks = useCallback((editor: any) => {
      // Header Block
      editor.BlockManager.add('email-header', {
        label: 'Header',
        category: 'Basic',
        content: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px; text-align: center; background-color: #007bff; color: white;">
                <h1 style="margin: 0; font-size: 24px;">Your Header Here</h1>
              </td>
            </tr>
          </table>
        `,
        attributes: { class: 'email-header' }
      })

      // Text Block
      editor.BlockManager.add('email-text', {
        label: 'Text',
        category: 'Basic',
        content: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
                <p>Your text content goes here. This is a standard text block that supports multiple paragraphs and basic formatting.</p>
              </td>
            </tr>
          </table>
        `,
        attributes: { class: 'email-text' }
      })

      // Image Block
      editor.BlockManager.add('email-image', {
        label: 'Image',
        category: 'Basic',
        content: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px; text-align: center;">
                <img src="https://via.placeholder.com/600x300" alt="Placeholder" style="max-width: 100%; height: auto; border-radius: 8px;" />
              </td>
            </tr>
          </table>
        `,
        attributes: { class: 'email-image' }
      })

      // Button Block
      editor.BlockManager.add('email-button', {
        label: 'Button',
        category: 'Basic',
        content: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px; text-align: center;">
                <a href="#" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">Click Here</a>
              </td>
            </tr>
          </table>
        `,
        attributes: { class: 'email-button' }
      })

      // Divider Block
      editor.BlockManager.add('email-divider', {
        label: 'Divider',
        category: 'Basic',
        content: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px 0; text-align: center;">
                <hr style="border: none; border-top: 1px solid #e5e7eb; width: 100%;" />
              </td>
            </tr>
          </table>
        `,
        attributes: { class: 'email-divider' }
      })

      // Spacer Block
      editor.BlockManager.add('email-spacer', {
        label: 'Spacer',
        category: 'Basic',
        content: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="height: 20px; line-height: 20px; font-size: 20px;">&nbsp;</td>
            </tr>
          </table>
        `,
        attributes: { class: 'email-spacer' }
      })

      // 2-Column Layout
      editor.BlockManager.add('email-2col', {
        label: '2 Column',
        category: 'Layout',
        content: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td width="50%" style="padding: 10px; vertical-align: top;">
                <p style="margin: 0;">Column 1 content</p>
              </td>
              <td width="50%" style="padding: 10px; vertical-align: top;">
                <p style="margin: 0;">Column 2 content</p>
              </td>
            </tr>
          </table>
        `,
        attributes: { class: 'email-2col' }
      })

      // 3-Column Layout
      editor.BlockManager.add('email-3col', {
        label: '3 Column',
        category: 'Layout',
        content: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td width="33%" style="padding: 10px; vertical-align: top;">
                <p style="margin: 0;">Column 1</p>
              </td>
              <td width="33%" style="padding: 10px; vertical-align: top;">
                <p style="margin: 0;">Column 2</p>
              </td>
              <td width="34%" style="padding: 10px; vertical-align: top;">
                <p style="margin: 0;">Column 3</p>
              </td>
            </tr>
          </table>
        `,
        attributes: { class: 'email-3col' }
      })

      // Social Icons Block
      editor.BlockManager.add('email-social', {
        label: 'Social Icons',
        category: 'Basic',
        content: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px; text-align: center;">
                <a href="#" style="margin: 0 10px; display: inline-block;">
                  <img src="https://via.placeholder.com/40x40/007bff/ffffff?text=f" alt="Facebook" style="width: 40px; height: 40px; border-radius: 50%;" />
                </a>
                <a href="#" style="margin: 0 10px; display: inline-block;">
                  <img src="https://via.placeholder.com/40x40/1da1f2/ffffff?text=t" alt="Twitter" style="width: 40px; height: 40px; border-radius: 50%;" />
                </a>
                <a href="#" style="margin: 0 10px; display: inline-block;">
                  <img src="https://via.placeholder.com/40x40/e1306c/ffffff?text=in" alt="LinkedIn" style="width: 40px; height: 40px; border-radius: 50%;" />
                </a>
              </td>
            </tr>
          </table>
        `,
        attributes: { class: 'email-social' }
      })

      // Footer Block
      editor.BlockManager.add('email-footer', {
        label: 'Footer',
        category: 'Basic',
        content: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px; text-align: center; background-color: #f8f9fa; color: #6c757d; font-size: 12px;">
                <p style="margin: 0;">&copy; 2024 Your Company. All rights reserved.</p>
                <p style="margin: 10px 0 0 0;">
                  <a href="#" style="color: #6c757d; text-decoration: underline;">Unsubscribe</a> | 
                  <a href="#" style="color: #6c757d; text-decoration: underline;">Privacy Policy</a>
                </p>
              </td>
            </tr>
          </table>
        `,
        attributes: { class: 'email-footer' }
      })

      // Raw HTML Block
      editor.BlockManager.add('email-html', {
        label: 'Raw HTML',
        category: 'Advanced',
        content: `
          <table width="100%" border="0" cellspacing="0" cellpadding="0">
            <tr>
              <td style="padding: 20px;">
                <div>Custom HTML content goes here</div>
              </td>
            </tr>
          </table>
        `,
        attributes: { class: 'email-html' }
      })
    }, [])

    useEffect(() => {
      if (!containerRef.current || isInitialized) return

      try {
        // Initialize GrapesJS with newsletter preset
        const editor = grapesjs.init({
          container: containerRef.current,
          fromElement: false,
          components: initialJson || [],
          plugins: ['gjs-preset-newsletter'],
          pluginsOpts: {
            'gjs-preset-newsletter': {
              blocks: [],
              blockCategories: {
                basic: {
                  label: 'Basic',
                  order: 0,
                  open: true
                },
                layout: {
                  label: 'Layout',
                  order: 1,
                  open: false
                },
                advanced: {
                  label: 'Advanced',
                  order: 2,
                  open: false
                }
              }
            }
          },
          storageManager: false,
          canvas: {
            styles: [
              'body { margin: 0; padding: 0; font-family: Arial, sans-serif; }',
              'table { border-collapse: collapse; width: 100%; }',
              'img { max-width: 100%; height: auto; }',
              'a { text-decoration: none; }',
              'p { margin: 0 0 10px 0; }'
            ]
          }
        })

        editorRef.current = editor
        setEditorInstance(editor)
        setIsInitialized(true)

        // Add custom blocks
        createCustomBlocks(editor)

        // Set initial content if provided
        if (initialHtml) {
          editor.setComponents(initialHtml)
        }

        // Handle changes with debouncing
        let changeTimeout: NodeJS.Timeout
        const debouncedChange = () => {
          clearTimeout(changeTimeout)
          changeTimeout = setTimeout(() => {
            if (onChange) onChange()
          }, 300)
        }

        // Auto-save with longer debounce
        let saveTimeout: NodeJS.Timeout
        const debouncedSave = () => {
          clearTimeout(saveTimeout)
          saveTimeout = setTimeout(() => {
            if (onSave) onSave()
          }, 2000)
        }

        // Event listeners
        editor.on('component:add', (component: any) => {
          debouncedChange()
          debouncedSave()
          if (onBlockAdd && component.attributes?.type) {
            onBlockAdd(component.attributes.type)
          }
        })
        editor.on('component:update', debouncedChange)
        editor.on('component:remove', debouncedChange)
        editor.on('style:update', debouncedChange)
        editor.on('storage:start', debouncedChange)

      } catch (error) {
        console.error('Error initializing GrapesJS:', error)
      }

      return () => {
        if (editorRef.current) {
          try {
            editorRef.current.destroy()
          } catch (error) {
            console.error('Error destroying GrapesJS:', error)
          }
          editorRef.current = null
          setEditorInstance(null)
          setIsInitialized(false)
        }
      }
    }, [initialHtml, initialJson, onChange, onSave, onBlockAdd, createCustomBlocks])

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      getHtml: () => editorRef.current?.getHtml() || '',
      getCss: () => editorRef.current?.getCss() || '',
      getComponents: () => editorRef.current?.getComponents() || [],
      getProjectData: () => editorRef.current?.getProjectData() || {},
      getEditor: () => editorRef.current,
      destroy: () => {
        if (editorRef.current) {
          editorRef.current.destroy()
        }
      },
      addBlock: (blockType: string) => {
        if (editorRef.current) {
          const block = editorRef.current.BlockManager.get(blockType)
          if (block) {
            editorRef.current.runCommand('core:component-insert', {
              component: block
            })
          }
        }
      },
      undo: () => {
        if (editorRef.current) {
          editorRef.current.runCommand('core:undo')
        }
      },
      redo: () => {
        if (editorRef.current) {
          editorRef.current.runCommand('core:redo')
        }
      }
    }))

    return (
      <div 
        ref={containerRef} 
        className="h-full w-full grapesjs-container"
        style={{ minHeight: '500px' }}
      />
    )
  }
)

ProfessionalGrapesJSEditor.displayName = "ProfessionalGrapesJSEditor"

export default ProfessionalGrapesJSEditor
