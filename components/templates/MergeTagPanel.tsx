"use client"

import { useState } from "react"
import { Type, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface MergeTagPanelProps {
  onInsertTag?: (tag: string) => void
}

export default function MergeTagPanel({ onInsertTag }: MergeTagPanelProps) {
  const [copiedTag, setCopiedTag] = useState<string | null>(null)

  const mergeTags = [
    { tag: "first_name", label: "First Name", description: "Contact's first name" },
    { tag: "last_name", label: "Last Name", description: "Contact's last name" },
    { tag: "email", label: "Email", description: "Contact's email address" },
    { tag: "company", label: "Company", description: "Contact's company" },
    { tag: "city", label: "City", description: "Contact's city" },
    { tag: "phone", label: "Phone", description: "Contact's phone number" }
  ]

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

  const handleInsertTag = (tag: string) => {
    if (onInsertTag) {
      onInsertTag(tag)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900 flex items-center">
          <Type className="h-4 w-4 mr-2" />
          Merge Tags
        </h3>
        <p className="text-xs text-gray-500 mt-1">
          Click to insert or copy to clipboard
        </p>
      </div>

      {/* Merge Tags List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {mergeTags.map((mergeTag) => (
            <div
              key={mergeTag.tag}
              className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="font-medium text-gray-900 text-sm">
                    {mergeTag.label}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {mergeTag.description}
                  </div>
                </div>
                <Badge variant="outline" className="text-xs">
                  {mergeTag.tag}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2 mt-3">
                <div className="flex-1">
                  <code className="bg-gray-200 px-2 py-1 rounded text-xs font-mono">
                    {"{{" + mergeTag.tag + "}}"}
                  </code>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2"
                    onClick={() => handleInsertTag(mergeTag.tag)}
                    title="Insert into editor"
                  >
                    <Type className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 px-2"
                    onClick={() => handleCopyTag(mergeTag.tag)}
                    title="Copy to clipboard"
                  >
                    {copiedTag === mergeTag.tag ? (
                      <Check className="h-3 w-3 text-green-600" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="border-t border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-2">Usage Instructions</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p>• Click the Type icon to insert into selected text block</p>
          <p>• Click Copy to copy tag to clipboard</p>
          <p>• Tags will be replaced with actual contact data</p>
          <p>• Use in subject lines, headers, and body text</p>
        </div>
      </div>

      {/* Sample Data */}
      <div className="border-t border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-2">Sample Data Preview</h4>
        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>John</strong> → {"{{first_name}}"}</p>
          <p><strong>Doe</strong> → {"{{last_name}}"}</p>
          <p><strong>john@example.com</strong> → {"{{email}}"}</p>
          <p><strong>Acme Corp</strong> → {"{{company}}"}</p>
        </div>
      </div>
    </div>
  )
}
