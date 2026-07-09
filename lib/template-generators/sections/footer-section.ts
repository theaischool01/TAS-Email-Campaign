import { TemplateBlock } from "@/components/templates/types"
import { ColorTheme } from "../types"
import { createFooterBlock } from "../blocks/footer"

export function createFooterSection(config: {
  theme: ColorTheme
}): TemplateBlock[] {
  return [
    createFooterBlock("footer-1", config.theme)
  ]
}
