import { TemplateBlock } from "@/components/templates/types"
import { RegistryEntry } from "./types"
import { createHeroSection } from "./sections/hero-section"
import { createCtaSection } from "./sections/cta-section"
import { createSocialSection } from "./sections/social-section"
import { createFooterSection } from "./sections/footer-section"
import { createFeatureSection } from "./sections/feature-section"
import { createCardSection } from "./sections/card-section"
import { createTimelineSection } from "./sections/timeline-section"
import { createDividerBlock } from "./blocks/divider"

export function generateTemplateBlocks(entry: RegistryEntry): TemplateBlock[] {
  let blocks: TemplateBlock[] = []
  const { theme, designFamily, content } = entry

  // 1. Structural assembly depending on Design Family
  switch (designFamily) {
    case "SaaS": {
      // Hero image + Title + Body text
      blocks = blocks.concat(createHeroSection({
        title: content.title,
        bodyHtml: content.bodyHtml,
        heroImage: entry.supportsHeroImage ? entry.defaultHeroImage : undefined,
        theme
      }))
      
      // Feature grid: 3-column getting started steps
      blocks = blocks.concat(createFeatureSection({
        columns: [
          { type: "text", text: `<div style="text-align: center;"><strong>Step 1</strong><p style="font-size: 12px; margin: 4px 0 0 0; color: #64748b;">Configure brand details & logo assets</p></div>` },
          { type: "text", text: `<div style="text-align: center;"><strong>Step 2</strong><p style="font-size: 12px; margin: 4px 0 0 0; color: #64748b;">Import contacts lists via CSV files</p></div>` },
          { type: "text", text: `<div style="text-align: center;"><strong>Step 3</strong><p style="font-size: 12px; margin: 4px 0 0 0; color: #64748b;">Design & dispatch campaigns</p></div>` }
        ],
        theme
      }))

      if (content.ctaText && content.ctaUrl) {
        blocks = blocks.concat(createCtaSection({ text: content.ctaText, url: content.ctaUrl, theme }))
      }
      break
    }

    case "Marketing": {
      blocks = blocks.concat(createHeroSection({
        title: content.title,
        bodyHtml: content.bodyHtml,
        heroImage: entry.supportsHeroImage ? entry.defaultHeroImage : undefined,
        theme
      }))

      // Alternating 2-column promo grid
      blocks = blocks.concat(createFeatureSection({
        columns: [
          { type: "text", text: `<strong>Exclusive Discount inside!</strong><p style="font-size: 12px; margin: 4px 0 0 0; color: #64748b;">Upgrade your account workspace to premium to unlock advanced queue filters, detailed reports, and multi-tenant template folders.</p>` },
          { type: "image", imageSrc: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150&h=100&fit=crop&q=80" }
        ],
        theme
      }))

      if (content.ctaText && content.ctaUrl) {
        blocks = blocks.concat(createCtaSection({ text: content.ctaText, url: content.ctaUrl, theme }))
      }
      break
    }

    case "Newsletter": {
      // Editorial banner (no hero image in header, keep logo look text)
      blocks = blocks.concat(createHeroSection({
        title: content.title,
        bodyHtml: content.bodyHtml,
        heroImage: undefined,
        theme
      }))

      blocks.push(createDividerBlock("divider-news", theme))

      // Multi-column newsletter stories layout
      blocks = blocks.concat(createFeatureSection({
        columns: [
          { type: "text", text: `<strong>Story Highlight 1</strong><p style="font-size: 12px; margin: 4px 0 0 0; color: #64748b;">Discover best practices for inbox deliverability using AWS SES client triggers.</p>` },
          { type: "text", text: `<strong>Story Highlight 2</strong><p style="font-size: 12px; margin: 4px 0 0 0; color: #64748b;">Visual block editor tips and tricks to build responsive newsletters.</p>` }
        ],
        theme
      }))

      if (content.ctaText && content.ctaUrl) {
        blocks = blocks.concat(createCtaSection({ text: content.ctaText, url: content.ctaUrl, theme }))
      }
      break
    }

    case "Education": {
      blocks = blocks.concat(createHeroSection({
        title: content.title,
        bodyHtml: content.bodyHtml,
        heroImage: entry.supportsHeroImage ? entry.defaultHeroImage : undefined,
        theme
      }))

      // Course categories card block
      blocks = blocks.concat(createCardSection({
        title: "Course Milestones & Roadmap",
        bodyHtml: "Enroll in the upcoming modules. Complete weekly assignments to earn verifiable completion badges.",
        theme
      }))

      if (content.ctaText && content.ctaUrl) {
        blocks = blocks.concat(createCtaSection({ text: content.ctaText, url: content.ctaUrl, theme }))
      }
      break
    }

    case "Business":
    case "HR": {
      blocks = blocks.concat(createHeroSection({
        title: content.title,
        bodyHtml: content.bodyHtml,
        heroImage: undefined,
        theme
      }))

      // Minimal timeline log details
      blocks = blocks.concat(createTimelineSection({
        items: [
          { time: "09:00 AM", title: "Project Sync Kickoff", description: "Agenda and requirements reviews with the design team" },
          { time: "02:00 PM", title: "Deliverables Audit", description: "Visual and UX validations for templates and canvas elements" }
        ],
        theme
      }))

      if (content.ctaText && content.ctaUrl) {
        blocks = blocks.concat(createCtaSection({ text: content.ctaText, url: content.ctaUrl, theme }))
      }
      break
    }

    case "Events": {
      blocks = blocks.concat(createHeroSection({
        title: content.title,
        bodyHtml: content.bodyHtml,
        heroImage: entry.supportsHeroImage ? entry.defaultHeroImage : undefined,
        theme
      }))

      // Agenda timeline
      blocks = blocks.concat(createTimelineSection({
        items: [
          { time: "Day 1", title: "Introductory Keynote", description: "Intro to visual canvas frameworks" },
          { time: "Day 2", title: "Developer Workshop", description: "Seeding and migrating template architectures" }
        ],
        theme
      }))

      if (content.ctaText && content.ctaUrl) {
        blocks = blocks.concat(createCtaSection({ text: content.ctaText, url: content.ctaUrl, theme }))
      }
      break
    }

    case "CustomerSuccess": {
      blocks = blocks.concat(createHeroSection({
        title: content.title,
        bodyHtml: content.bodyHtml,
        heroImage: entry.supportsHeroImage ? entry.defaultHeroImage : undefined,
        theme
      }))

      // Boxed callout card
      blocks = blocks.concat(createCardSection({
        title: "We Value Your Feedback",
        bodyHtml: "Let us know how likely you are to recommend our visual campaign platform to your workspace teams.",
        theme
      }))

      if (content.ctaText && content.ctaUrl) {
        blocks = blocks.concat(createCtaSection({ text: content.ctaText, url: content.ctaUrl, theme }))
      }
      break
    }

    default: {
      blocks = blocks.concat(createHeroSection({
        title: content.title,
        bodyHtml: content.bodyHtml,
        heroImage: entry.supportsHeroImage ? entry.defaultHeroImage : undefined,
        theme
      }))
      if (content.ctaText && content.ctaUrl) {
        blocks = blocks.concat(createCtaSection({ text: content.ctaText, url: content.ctaUrl, theme }))
      }
      break
    }
  }

  // 2. Append social & footer follow consistently across all layouts
  blocks = blocks.concat(createSocialSection({ theme }))
  blocks = blocks.concat(createFooterSection({ theme }))

  // 3. Map IDs sequentially to avoid collisions
  return blocks.map((block, idx) => ({
    ...block,
    id: `${block.type}-${idx + 1}`
  }))
}
