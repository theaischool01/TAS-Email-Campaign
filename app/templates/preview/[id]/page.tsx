"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Monitor, Smartphone, Mail } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { EmailTemplate } from "@/types/template"

export default function TemplatePreviewPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop")
  const [sampleData, setSampleData] = useState({
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    company: "Acme Corp"
  })

  useEffect(() => {
    fetchTemplate()
  }, [])

  const fetchTemplate = async () => {
    try {
      const templateId = window.location.pathname.split('/').pop()
      if (!templateId) return

      const response = await fetch(`/api/templates/${templateId}`)
      if (response.ok) {
        const data = await response.json()
        setTemplate(data)
      } else {
        router.push("/templates")
      }
    } catch (error) {
      console.error("Error fetching template:", error)
      router.push("/templates")
    } finally {
      setIsLoading(false)
    }
  }

  const replaceMergeTags = (html: string) => {
    return html
      .replace(/\{\{first_name\}\}/g, sampleData.first_name)
      .replace(/\{\{last_name\}\}/g, sampleData.last_name)
      .replace(/\{\{email\}\}/g, sampleData.email)
      .replace(/\{\{company\}\}/g, sampleData.company)
  }

  const getPreviewWidth = () => {
    return previewMode === "mobile" ? "375px" : "600px"
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4 w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!template) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="text-gray-500">Template not found</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/templates" className="flex items-center text-gray-600 hover:text-gray-900">
                <ArrowLeft className="h-4 w-4 mr-2" />
                <h1 className="text-xl font-semibold">{template.name}</h1>
              </Link>
              {template.category && (
                <Badge variant="secondary" className="ml-3">{template.category}</Badge>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {/* Preview Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <Button
                  variant={previewMode === "desktop" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode("desktop")}
                >
                  <Monitor className="h-4 w-4" />
                </Button>
                <Button
                  variant={previewMode === "mobile" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setPreviewMode("mobile")}
                >
                  <Smartphone className="h-4 w-4" />
                </Button>
              </div>

              {/* Actions */}
              <Link href={`/templates/editor/${template.id}`}>
                <Button>
                  <Mail className="h-4 w-4 mr-2" />
                  Edit Template
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Preview Header */}
          <div className="border-b border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Email Preview</h2>
                <p className="text-sm text-gray-600">
                  {previewMode === "desktop" ? "Desktop view (600px)" : "Mobile view (375px)"}
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span>Template: {template.name}</span>
                {template.category && (
                  <Badge variant="outline" className="ml-2">{template.category}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Email Preview Container */}
          <div 
            className="bg-white p-4"
            style={{ 
              width: '100%',
              maxWidth: getPreviewWidth(),
              margin: '0 auto',
            }}
          >
            <div className="border shadow-sm rounded-lg overflow-hidden bg-white">
              <iframe 
                srcDoc={`
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <style>
                        body { margin: 0; padding: 0; background-color: white; }
                        /* Ensure full visibility */
                        html, body { height: auto !important; min-height: 100%; }
                      </style>
                    </head>
                    <body>
                      ${replaceMergeTags(template.html)}
                    </body>
                  </html>
                `}
                title="Email Preview"
                className="w-full"
                style={{ 
                  height: '1200px', // Large initial height
                  border: 'none',
                }}
                onLoad={(e) => {
                  // Auto-adjust height after load
                  const iframe = e.currentTarget;
                  if (iframe.contentWindow) {
                    try {
                      iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 'px';
                    } catch (e) {
                      // Fallback for cross-origin if any
                      iframe.style.height = '2000px';
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Sample Data Info */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Sample Data Used:</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Personalization Tags:</h4>
                <div className="space-y-1 text-gray-600">
                  <div><code className="bg-gray-100 px-1 rounded">{"{{first_name}}"} → {sampleData.first_name}</code></div>
                  <div><code className="bg-gray-100 px-1 rounded">{"{{last_name}}"} → {sampleData.last_name}</code></div>
                  <div><code className="bg-gray-100 px-1 rounded">{"{{email}}"} → {sampleData.email}</code></div>
                  <div><code className="bg-gray-100 px-1 rounded">{"{{company}}"} → {sampleData.company}</code></div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-700 mb-2">Email Client Notes:</h4>
                <div className="space-y-1 text-gray-600">
                  <div>• This preview simulates how merge tags will be replaced</div>
                  <div>• Actual recipient data will vary per contact</div>
                  <div>• Test with different sample data scenarios</div>
                  <div>• Ensure all tags have fallback values</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
