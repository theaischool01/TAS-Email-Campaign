import { TrackingTokenService } from "../security/tracking-tokens"
import logger from "../logger"

export interface RewriteOptions {
  deliveryId: string;
  trackedLinks: Record<string, string>; // originalUrl -> trackedLinkId
  appUrl: string;
  unsubscribeLink?: string;
}

export class TrackingRewriter {
  static rewrite(html: string, options: RewriteOptions): string {
    if (!html) return html

    const { deliveryId, trackedLinks, appUrl, unsubscribeLink } = options
    const normalizedAppUrl = appUrl.replace(/\/$/, "")

    // --- 1. Link Rewriting ---
    let rewrittenHtml = html.replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi, (match, quote, url) => {
      const trimmedUrl = url.trim()

      // Exclude non-http(s) urls
      if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
        return match
      }

      // Exclude fragment links
      if (trimmedUrl.startsWith("http://#") || trimmedUrl.startsWith("https://#")) {
        return match
      }

      // Exclude unsubscribe/preferences links
      const isUnsubscribe =
        trimmedUrl.includes("/unsubscribe") ||
        trimmedUrl.includes("/preferences") ||
        (unsubscribeLink && trimmedUrl === unsubscribeLink)

      if (isUnsubscribe) {
        return match
      }

      // Exclude already rewritten links
      if (trimmedUrl.includes("/api/track/click/")) {
        return match
      }

      // Resolve TrackedLink ID
      const trackedLinkId = trackedLinks[trimmedUrl]
      if (!trackedLinkId) {
        logger.warn({ url: trimmedUrl, deliveryId }, "Tracking link registry missing for URL during rewrite")
        return match
      }

      try {
        // Generate Token
        const token = TrackingTokenService.encrypt({
          t: "c",
          d: deliveryId,
          l: trackedLinkId
        })

        const trackingUrl = `${normalizedAppUrl}/api/track/click/${token}`
        return match.replace(url, trackingUrl)
      } catch (e: any) {
        logger.error({ error: e.message, url: trimmedUrl }, "Failed to encrypt click tracking token")
        return match
      }
    })

    // --- 2. Tracking Pixel Injection ---
    // If pixel is already present, bypass to maintain idempotency
    if (rewrittenHtml.includes("/api/track/open/")) {
      return rewrittenHtml
    }

    try {
      const openToken = TrackingTokenService.encrypt({
        t: "o",
        d: deliveryId
      })

      const pixelHtml = `<img src="${normalizedAppUrl}/api/track/open/${openToken}" width="1" height="1" style="display:none" alt="" />`

      // Case 1: Insert before </body> (case-insensitive)
      if (/<body[^>]*>/i.test(rewrittenHtml) && /<\/body>/i.test(rewrittenHtml)) {
        rewrittenHtml = rewrittenHtml.replace(/<\/body>/i, `${pixelHtml}</body>`)
      }
      // Case 2: Insert before </html> (case-insensitive)
      else if (/<\/html>/i.test(rewrittenHtml)) {
        rewrittenHtml = rewrittenHtml.replace(/<\/html>/i, `${pixelHtml}</html>`)
      }
      // Case 3: Append to end of document
      else {
        rewrittenHtml = rewrittenHtml + pixelHtml
      }
    } catch (e: any) {
      logger.error({ error: e.message, deliveryId }, "Failed to inject open tracking pixel")
    }

    return rewrittenHtml
  }
}
