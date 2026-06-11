/**
 * Centralized bot and prefetch detection for email tracking
 * 
 * IMPORTANT: Email client image proxies (Gmail's GoogleImageProxy, Apple's 
 * privacy proxy, etc.) are NOT bots — they represent real human opens.
 * Only flag actual web crawlers, security scanners, and link prefetchers.
 */
import logger from '@/lib/logger'

export function isBotUserAgent(userAgent: string, ip?: string): boolean {
  if (!userAgent) return true; // Empty UA is usually a bot
  
  const lowerUA = userAgent.toLowerCase();

  // ─── EMAIL CLIENT PROXIES (NOT BOTS) ─────────────────────────────────────
  // These are legitimate image proxy services used by email clients.
  // When Gmail/Apple/Yahoo loads a tracking pixel through their proxy,
  // it means a real person opened the email.
  const emailClientProxies = [
    'googleimageproxy',   // Gmail's image proxy
    'ggpht.com',          // Gmail's image CDN
    'yahoo pipes',        // Yahoo Mail image proxy  
    'ymailproxy',         // Yahoo Mail proxy
  ];
  
  if (emailClientProxies.some(proxy => lowerUA.includes(proxy))) {
    // This is an email client proxy — NOT a bot
    return false;
  }

  // ─── ACTUAL BOTS & CRAWLERS ──────────────────────────────────────────────
  // These are web crawlers, security scanners, and link prefetchers 
  // that do NOT represent real human email opens.
  const botPatterns = [
    /bot(?!tom)/i,          // "bot" but not "bottom" 
    /crawl/i,               // Web crawlers
    /spider/i,              // Web spiders
    /scanner/i,             // Security scanners
    /archiver/i,            // Web archivers
    /pinger/i,              // Monitoring pingers
    /headless/i,            // Headless browsers
    /phantom/i,             // PhantomJS
    /slurp/i,               // Yahoo web crawler (not mail)
    /bingbot/i,             // Bing crawler
    /bingpreview/i,         // Bing preview
    /duckduckbot/i,         // DuckDuckGo crawler
    /facebookexternalhit/i, // Facebook link preview
    /whatsapp/i,            // WhatsApp link preview
    /twitterbot/i,          // Twitter link preview
    /linkedinbot/i,         // LinkedIn link preview
    /slackbot/i,            // Slack link preview
    /telegrambot/i,         // Telegram link preview
    /python-requests/i,     // Python HTTP client
    /go-http-client/i,      // Go HTTP client
    /node-fetch/i,          // Node.js fetch
    /axios/i,               // Axios HTTP client
    /wget/i,                // wget
    /curl/i,                // curl
    /libwww/i,              // Perl LWP
    /httpie/i,              // HTTPie
  ];

  const isMatched = botPatterns.some(pattern => pattern.test(userAgent));
  
  if (isMatched) {
    logger.debug({ userAgent }, 'Bot/crawler user agent detected and blocked');
  }

  return isMatched;
}
