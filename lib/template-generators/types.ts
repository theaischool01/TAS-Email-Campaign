import { TemplateBlock } from "@/components/templates/types"

export interface ColorTheme {
  primary: string
  secondary: string
  background: string
  text: string
  cardBg?: string
}

export interface RegistryEntry {
  id: string
  name: string
  subject: string
  category: string
  theme: ColorTheme
  designFamily: "SaaS" | "Marketing" | "Business" | "HR" | "Education" | "Newsletter" | "Events" | "CustomerSuccess"
  supportsHeroImage: boolean
  defaultHeroImage?: string
  featured?: boolean
  difficulty?: "basic" | "intermediate" | "premium"
  thumbnail?: string
  recommendedFor?: string[]
  tags?: string[]
  version?: number
  content: {
    title: string
    bodyHtml: string
    ctaText?: string
    ctaUrl?: string
    [key: string]: any
  }
}
