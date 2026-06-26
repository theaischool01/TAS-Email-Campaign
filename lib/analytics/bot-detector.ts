export function isBot(userAgent: string): boolean {
  if (!userAgent) return false

  const uaLower = userAgent.toLowerCase()

  const botSignatures = [
    "apple mail privacy protection",
    "googleimageproxy",
    "proofpoint",
    "barracuda",
    "microsoft safe links",
    "outlook safelinkscanner",
    "appleimageproxy",
    "applemail", // Apple Mail Privacy Protection pre-fetch agent
    "safelinks",
    "safelinkscanner",
    "spider",
    "crawler",
    "bot",
    "preview",
    "scanner"
  ]

  return botSignatures.some(signature => uaLower.includes(signature))
}

