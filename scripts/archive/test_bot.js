const { isBotUserAgent } = require('./lib/utils/bot-detection');

const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/42.0.2311.135 Safari/537.36 Edge/12.246 Mozilla/5.0";
const ip1 = "66.249.89.107";
const ip2 = "::ffff:66.249.89.107";
const ip3 = "108.177.2.71";

console.log('Testing UA only:', isBotUserAgent(ua));
console.log('Testing UA + IP1:', isBotUserAgent(ua, ip1));
console.log('Testing UA + IP2:', isBotUserAgent(ua, ip2));
console.log('Testing UA + IP3:', isBotUserAgent(ua, ip3));
console.log('Testing Empty UA:', isBotUserAgent(""));
