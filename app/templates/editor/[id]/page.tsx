"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import dynamic from "next/dynamic"
import { 
  Save, 
  Eye, 
  Code, 
  Layout, 
  Smartphone, 
  Monitor,
  Undo2,
  Redo2,
  Copy,
  Download,
  Plus,
  Settings,
  Type,
  Palette,
  Grid3x3,
  Share2,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { EmailTemplate } from "@/types/template"

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

export default function TemplateEditorPage() {
  const { data: session } = useSession()
  const params = useParams()
  const templateId = params.id as string

  const isAdmin = session?.user?.role === "SUPER_ADMIN"
  const isManager = session?.user?.role === "CAMPAIGN_MANAGER"
  const canEdit = isAdmin || isManager

  if (!canEdit) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
          <p className="text-gray-600">You don't have permission to edit templates.</p>
        </div>
      </div>
    )
  }

  return <TemplateBuilder mode="edit" templateId={templateId} />
}
