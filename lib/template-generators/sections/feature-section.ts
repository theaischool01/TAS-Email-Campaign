import { TemplateBlock } from "@/components/templates/types"
import { ColorTheme } from "../types"

export function createFeatureSection(config: {
  columns: Array<{
    type: "text" | "image" | "button"
    text?: string
    imageSrc?: string
    buttonText?: string
    buttonUrl?: string
  }>
  theme: ColorTheme
}): TemplateBlock[] {
  const colCount = config.columns.length
  const type = colCount === 3 ? "3column" : "2column"

  const content: Record<string, any> = {}
  
  if (colCount === 2) {
    content.layoutRatio = "50/50"
  }

  config.columns.forEach((col, idx) => {
    const colIdx = idx + 1
    content[`col${colIdx}Type`] = col.type

    if (col.type === "image" && col.imageSrc) {
      content[`col${colIdx}ImageSrc`] = col.imageSrc
      content[`col${colIdx}ImageWidth`] = "100"
      content[`col${colIdx}ImageWidthUnit`] = "%"
      content[`col${colIdx}ImageAlignment`] = "center"
    } else if (col.type === "button" && col.buttonText) {
      content[`col${colIdx}ButtonText`] = col.buttonText
      content[`col${colIdx}ButtonUrl`] = col.buttonUrl || "#"
      content[`col${colIdx}ButtonBg`] = config.theme.primary
      content[`col${colIdx}ButtonColor`] = "#ffffff"
      content[`col${colIdx}ButtonAlignment`] = "center"
    } else {
      content[`text${colIdx}`] = col.text || `Column ${colIdx} Text`
    }
  })

  return [
    {
      id: `${type}-section`,
      type,
      content,
      styles: {
        backgroundColor: "#ffffff",
        color: config.theme.text,
        padding: "20px 10px"
      }
    }
  ]
}
