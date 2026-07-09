import { TemplateBlock } from "@/components/templates/types"
import { ColorTheme } from "../types"

export function createHeaderBlock(id: string, text: string, theme: ColorTheme): TemplateBlock {
  return {
    id,
    type: "header",
    content: {
      text,
      logoUrl: "",
      logoWidth: 150,
      logoHeight: 40
    },
    styles: {
      backgroundColor: theme.background,
      color: theme.primary,
      padding: "20px 20px"
    }
  }
}
