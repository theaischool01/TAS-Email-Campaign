import { TemplateBlock } from "@/components/templates/types"
import { ColorTheme } from "../types"
import { createHeaderBlock } from "../blocks/header"
import { createHeroBlock } from "../blocks/hero"
import { createTextBlock } from "../blocks/text"

export function createHeroSection(config: {
  title: string
  bodyHtml: string
  heroImage?: string
  theme: ColorTheme
}): TemplateBlock[] {
  const blocks: TemplateBlock[] = []
  
  blocks.push(createHeaderBlock("header-1", config.title, config.theme))
  
  if (config.heroImage) {
    blocks.push(createHeroBlock("hero-1", config.heroImage))
  }
  
  blocks.push(createTextBlock("body-1", config.bodyHtml, config.theme))
  
  return blocks
}
