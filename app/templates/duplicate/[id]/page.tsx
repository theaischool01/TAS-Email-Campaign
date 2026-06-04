"use client"

import dynamic from "next/dynamic"
import { useParams } from "next/navigation"

// Dynamic import to prevent SSR issues
const TemplateBuilder = dynamic(
  () => import("@/components/templates/TemplateBuilder"),
  { 
    ssr: false,
    loading: () => (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading template builder...</div>
      </div>
    )
  }
)

export default function DuplicateTemplatePage() {
  const params = useParams()
  const templateId = params.id as string

  return <TemplateBuilder mode="duplicate" templateId={templateId} />
}
