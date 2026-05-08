"use client"

import { useSession } from "next-auth/react"
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
  const { data: session } = useSession()
  const params = useParams()
  const templateId = params.id as string

  const isAdmin = session?.user?.role === "SUPER_ADMIN"
  const isManager = session?.user?.role === "CAMPAIGN_MANAGER"
  const canCreate = isAdmin || isManager

  if (!canCreate) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to create templates.</p>
        </div>
      </div>
    )
  }

  return <TemplateBuilder mode="duplicate" templateId={templateId} />
}
