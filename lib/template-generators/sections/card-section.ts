import { TemplateBlock } from "@/components/templates/types"
import { ColorTheme } from "../types"

export function createCardSection(config: {
  title: string
  bodyHtml: string
  theme: ColorTheme
}): TemplateBlock[] {
  return [
    {
      id: "card-section",
      type: "2column",
      content: {
        layoutRatio: "100/0",
        col1Type: "text",
        text1: `
          <div style="background-color: ${config.theme.secondary}; border: 2px dashed ${config.theme.primary}; border-radius: 8px; padding: 24px; text-align: center;">
            <h3 style="margin: 0 0 8px 0; color: ${config.theme.primary}; font-size: 18px; font-weight: bold;">${config.title}</h3>
            <div style="color: ${config.theme.text}; font-size: 14px; line-height: 1.5;">${config.bodyHtml}</div>
          </div>
        `
      },
      styles: {
        backgroundColor: "#ffffff",
        color: config.theme.text,
        padding: "20px 20px"
      }
    }
  ]
}
