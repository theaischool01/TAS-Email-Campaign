import { TemplateBlock } from "@/components/templates/types"
import { ColorTheme } from "../types"

export function createTextBlock(id: string, html: string, theme: ColorTheme): TemplateBlock {
  return {
    id,
    type: "text",
    content: {
      html
    },
    styles: {
      backgroundColor: "#ffffff",
      color: theme.text,
      fontSize: "16px",
      padding: "24px 20px"
    }
  }
}
