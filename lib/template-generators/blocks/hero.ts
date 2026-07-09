import { TemplateBlock } from "@/components/templates/types"

export function createHeroBlock(id: string, src: string): TemplateBlock {
  return {
    id,
    type: "image",
    content: {
      src,
      alt: "Hero Image",
      width: 100,
      widthUnit: "%",
      alignment: "center"
    },
    styles: {
      padding: "0px",
      borderRadius: "0px"
    }
  }
}
