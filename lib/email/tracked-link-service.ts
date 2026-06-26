import crypto from "crypto"
import { prisma as prismaClient } from "../../app/lib/prisma"
import { LinkExtractor } from "./link-extractor"

const prisma = prismaClient as any

export class TrackedLinkService {
  static async prepareCampaignLinks(campaignId: string, html: string): Promise<void> {
    if (!html) return

    // 1. Extract URLs
    const urls = LinkExtractor.extract(html)
    if (urls.length === 0) return

    // 2. Map to creation data array with normalized hashes
    const data = urls.map(url => {
      const urlHash = crypto
        .createHash("sha256")
        .update(url)
        .digest("hex")

      return {
        campaignId,
        originalUrl: url,
        urlHash
      }
    })

    // 3. Bulk insert to database skipping duplicates
    await prisma.trackedLink.createMany({
      data,
      skipDuplicates: true
    })
  }
}
