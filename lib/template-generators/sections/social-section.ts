import { TemplateBlock } from "@/components/templates/types"
import { ColorTheme } from "../types"

export function createSocialSection(config: {
  theme: ColorTheme
}): TemplateBlock[] {
  return [
    {
      id: "social-1",
      type: "social-follow",
      content: {
        layout: "follow-section",
        heading: "Stay Connected",
        description: "Follow us for product updates, design tips and system announcements.",
        alignment: "center",
        iconStyle: "brand",
        iconSize: 32,
        spacing: 12,
        enabledNetworks: {
          facebook: true,
          instagram: true,
          linkedin: true,
          twitter: true,
          youtube: true
        },
        urls: {
          facebook: "#",
          instagram: "#",
          linkedin: "#",
          twitter: "#",
          youtube: "#"
        }
      },
      styles: {
        backgroundColor: config.theme.secondary,
        color: config.theme.text
      }
    }
  ]
}
