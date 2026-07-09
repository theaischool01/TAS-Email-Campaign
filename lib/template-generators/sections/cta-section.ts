import { TemplateBlock } from "@/components/templates/types"
import { ColorTheme } from "../types"
import { createButtonBlock } from "../blocks/button"

export function createCtaSection(config: {
  text: string
  url: string
  theme: ColorTheme
}): TemplateBlock[] {
  return [
    createButtonBlock("button-1", config.text, config.url, config.theme)
  ]
}
