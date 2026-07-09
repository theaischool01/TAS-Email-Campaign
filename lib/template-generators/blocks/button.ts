import { TemplateBlock } from "@/components/templates/types"
import { ColorTheme } from "../types"

export function createButtonBlock(id: string, text: string, url: string, theme: ColorTheme): TemplateBlock {
  return {
    id,
    type: "button",
    content: {
      text,
      url,
      alignment: "center"
    },
    styles: {
      backgroundColor: theme.primary,
      color: "#ffffff",
      padding: "12px 24px",
      borderRadius: "6px"
    }
  }
}
