export class LinkExtractor {
  static extract(html: string): string[] {
    if (!html) return []

    const urls: string[] = []
    // Match <a ... href="URL" ...> or <a ... href='URL' ...>
    // Regex matches href values in double/single quotes inside anchor tags
    const anchorRegex = /<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi
    let match

    while ((match = anchorRegex.exec(html)) !== null) {
      const url = match[2]?.trim()
      if (!url) continue

      // Filter trackable URLs: must start with http:// or https://
      if (url.startsWith("http://") || url.startsWith("https://")) {
        // Exclude fragment-only matches if they exist
        if (!url.startsWith("http://#") && !url.startsWith("https://#")) {
          urls.push(url)
        }
      }
    }

    // Deduplicate
    return Array.from(new Set(urls))
  }
}
