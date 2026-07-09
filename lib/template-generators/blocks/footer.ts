import { TemplateBlock } from "@/components/templates/types"
import { ColorTheme } from "../types"

export function createFooterBlock(id: string, theme: ColorTheme): TemplateBlock {
  return {
    id,
    type: "footer",
    content: {
      company: "{{companyName}}",
      address: "123 Business St, City, State 12345",
      copyright: `© ${new Date().getFullYear()} {{companyName}}. All rights reserved.`,
      unsubscribeText: "You received this email because you're subscribed to our newsletter."
    },
    styles: {
      backgroundColor: "#f8fafc",
      color: "#64748b",
      fontSize: "12px",
      textAlign: "center"
    }
  }
}
