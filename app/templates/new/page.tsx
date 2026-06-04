"use client"

import dynamic from "next/dynamic"

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

export default function NewTemplatePage() {
  return <TemplateBuilder mode="create" />
}
