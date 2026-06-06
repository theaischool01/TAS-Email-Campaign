"use client"

import { useParams } from "next/navigation"
import dynamic from "next/dynamic"

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

export default function TemplateEditorPage() {
  const params = useParams()
  const templateId = params.id as string

  return <TemplateBuilder mode="edit" templateId={templateId} />
}
