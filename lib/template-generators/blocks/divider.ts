import { TemplateBlock } from "@/components/templates/types"
import { ColorTheme } from "../types"

export function createDividerBlock(id: string, theme: ColorTheme): TemplateBlock {
  return {
    id,
    type: "divider",
    content: {},
    styles: {
      backgroundColor: "#ffffff",
      borderColor: "#e2e8f0",
      borderWidth: "1px",
      padding: "20px 0px"
    }
  }
}
