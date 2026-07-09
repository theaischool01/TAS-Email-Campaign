import { TemplateBlock } from "@/components/templates/types"
import { ColorTheme } from "../types"

export function createTimelineSection(config: {
  items: Array<{
    time: string
    title: string
    description: string
  }>
  theme: ColorTheme
}): TemplateBlock[] {
  const listHtml = config.items.map(item => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td valign="top" style="padding: 12px 10px; width: 25%; font-family: Arial, sans-serif; font-size: 13px; font-weight: bold; color: ${config.theme.primary};">
        ${item.time}
      </td>
      <td valign="top" style="padding: 12px 10px; font-family: Arial, sans-serif; font-size: 13px; color: ${config.theme.text};">
        <strong style="display: block; font-size: 14px; color: #0f172a; margin-bottom: 4px;">${item.title}</strong>
        ${item.description}
      </td>
    </tr>
  `).join("")

  return [
    {
      id: "timeline-section",
      type: "html",
      content: {
        html: `
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse; margin: 10px 0;">
            ${listHtml}
          </table>
        `
      },
      styles: {
        backgroundColor: "#ffffff",
        padding: "20px 20px"
      }
    }
  ]
}
