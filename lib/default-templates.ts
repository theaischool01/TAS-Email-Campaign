// Default templates file for multi-tenant SaaS seeding
// Pure data wrapper mapping to the template-generators registry

import { TEMPLATE_REGISTRY } from "./template-generators/registry"
import { generateTemplateBlocks } from "./template-generators/generators"

export const DEFAULT_EMAIL_TEMPLATES = TEMPLATE_REGISTRY.map(entry => {
  const blocks = generateTemplateBlocks(entry)
  return {
    name: entry.name,
    category: entry.category,
    thumbnail: entry.thumbnail || `/templates/${entry.id.replace("-v2", "")}.png`,
    json: JSON.stringify(blocks),
    // Defer HTML compilation to DefaultTemplateService or seeder loop,
    // keeping lib/default-templates.ts purely data-centric with no
    // HTML generation imports/side-effects.
    blocks,
    isPublic: false,
    isSystem: true
  }
})
