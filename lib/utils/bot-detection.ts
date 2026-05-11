/**
 * Centralized bot and prefetch detection for email tracking
 */
export function isBotUserAgent(userAgent: string, ip?: string): boolean {
  if (!userAgent) return true; // Empty UA is usually a bot
  
  // Normalize IP (handle ::ffff: and comma-separated x-forwarded-for)
  let normalizedIp = ip || '';
  if (normalizedIp.includes(',')) {
    normalizedIp = normalizedIp.split(',')[0].trim();
  }
  if (normalizedIp.startsWith('::ffff:')) {
    normalizedIp = normalizedIp.substring(7);
  }

  // Specific Google IP ranges commonly used for scanning
  const isGoogleIp = normalizedIp.startsWith('66.102.') ||
                     normalizedIp.startsWith('66.249.') || 
                     normalizedIp.startsWith('72.14.') || 
                     normalizedIp.startsWith('74.125.') || 
                     normalizedIp.startsWith('108.177.') ||
                     normalizedIp.startsWith('209.85.') ||
                     normalizedIp.startsWith('216.239.');
  
  if (isGoogleIp) {
    console.log(`[BOT-DETECTION] Blocked Google IP: ${normalizedIp}`);
    return true;
  }

  const botPatterns = [
    /bot/i,
    /google/i,
    /proxy/i,
    /scanner/i,
    /crawl/i,
    /facebook/i,
    /whatsapp/i,
    /preview/i,
    /spider/i,
    /archiver/i,
    /pinger/i,
    /apple-pns/i,
    /outlook-com/i,
    /microsoft/i,
    /yahoo/i,
    /bing/i,
    /duckduckgo/i,
    /slack/i,
    /twitter/i,
    /linkedin/i,
    /headless/i,
    /phantom/i,
    /compute/i,
    /aws/i,
    /azure/i,
    /cloudflare/i,
    /vercel/i,
    /heroku/i,
    /digitalocean/i,
    /python-requests/i,
    /go-http-client/i,
    /node-fetch/i,
    /axios/i,
    /Chrome\/42\.0\.2311\.135/i, // Specific Google preview/crawler UA
  ];

  const lowerUA = userAgent.toLowerCase();
  const isMatched = botPatterns.some(pattern => pattern.test(lowerUA));
  
  if (isMatched) {
    console.log(`[BOT-DETECTION] Matched Pattern: ${userAgent}`);
  }
  
  // Specific check for Google's Image Proxy (Gmail)
  const isGoogleProxy = userAgent.includes('GoogleImageProxy') || userAgent.includes('ggpht.com');
  
  // Check for common data center markers in UA or generic headless environments
  const isDataCenter = 
    lowerUA.includes('datacentre') || 
    lowerUA.includes('cloud') ||
    lowerUA.includes('server') ||
    lowerUA.includes('monitoring') ||
    lowerUA.includes('proxy');

  return isMatched || isGoogleProxy || isDataCenter;
}
