function isBotUserAgent(userAgent, ip) {
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
  const isGoogleIp = normalizedIp.startsWith('66.249.') || 
                     normalizedIp.startsWith('74.125.') || 
                     normalizedIp.startsWith('209.85.') ||
                     normalizedIp.startsWith('108.177.'); // Added the range found in logs
  if (isGoogleIp) return true;

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

const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246 Mozilla/5.0";
const ip1 = "66.249.89.107";
const ip2 = "::ffff:66.249.89.107";
const ip3 = "108.177.2.71";

console.log('Testing UA only:', isBotUserAgent(ua));
console.log('Testing UA + IP1:', isBotUserAgent(ua, ip1));
console.log('Testing UA + IP2:', isBotUserAgent(ua, ip2));
console.log('Testing UA + IP3:', isBotUserAgent(ua, ip3));
console.log('Testing Empty UA:', isBotUserAgent(""));
