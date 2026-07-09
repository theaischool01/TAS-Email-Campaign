"use client"

import { useParams, useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"

// Dynamic import to prevent SSR issues
const TemplateBuilder = dynamic(
  () => import("@/components/templates/TemplateBuilder"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading template editor...</div>
      </div>
    )
  }
)

const ProfessionalTemplateEditorPage = dynamic(
  () => import("./ProfessionalEditorPage"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading professional editor...</div>
      </div>
    )
  }
)

export default function TemplateEditorPage() {
  const params = useParams()
  const router = useRouter()
  const templateId = params.id as string
  const [template, setTemplate] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [redirecting, setRedirecting] = useState(false)

  useEffect(() => {
    let active = true
    setLoading(true)

    const fetchTemplate = (retryCount = 0) => {
      fetch(`/api/templates/${templateId}`)
        .then((res) => {
          if (res.ok) return res.json()
          if (res.status === 409 && retryCount < 2) {
            // Concurrency catch: Retry fetching the resource after a brief delay
            return new Promise(resolve => setTimeout(resolve, 300)).then(() => {
              if (active) return fetchTemplate(retryCount + 1)
            })
          }
          throw new Error(`Failed to fetch template - Status: ${res.status}`)
        })
        .then((data) => {
          if (!data || !active) return
          if (data.id !== templateId) {
            setRedirecting(true)
            router.replace(`/templates/editor/${data.id}`)
          } else {
            setTemplate(data)
            setRedirecting(false)
            setLoading(false)
          }
        })
        .catch((err) => {
          if (active) {
            console.error("Error loading template for editor:", err)
            setLoading(false)
          }
        })
    }

    fetchTemplate()

    return () => {
      active = false
    }
  }, [templateId, router])

  if (loading || redirecting) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse font-medium text-slate-500">
          {redirecting ? "Redirecting to your workspace..." : "Loading editor..."}
        </div>
      </div>
    )
  }

  const isBlockTemplate = 
    template?.json && 
    template.json.trim().startsWith("[");

  if (isBlockTemplate) {
    return <TemplateBuilder mode="edit" templateId={template.id} />
  }

  return <ProfessionalTemplateEditorPage template={template} />
}
