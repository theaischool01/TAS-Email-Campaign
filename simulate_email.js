const { UnsubscribeService } = require('./lib/services/unsubscribe');
const fs = require('fs');

async function test() {
  const campaignId = 'test-campaign-123';
  const recipient = {
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    contactId: 'contact-123'
  };
  const appUrl = 'http://localhost:3000';
  
  const uid = UnsubscribeService.encodeToken({
    cid: recipient.contactId,
    cam: campaignId,
    em: recipient.email
  });

  const footerUnsubscribeUrl = `${appUrl}/unsubscribe?uid=${uid}`;
  const trackingPixel = `<img src="${appUrl}/api/track/open/${campaignId}/${recipient.contactId}" width="1" height="1" style="display:none !important;" />`;

  let html = `
    <html>
      <body>
        <h1>Hello {{first_name}}</h1>
        <p>Check this link: <a href="https://google.com">Google</a></p>
        <p><a href="{{UNSUBSCRIBE_URL}}">Unsubscribe here</a></p>
      </body>
    </html>
  `;

  html = html.replace(/{{first_name}}/gi, recipient.firstName || 'Friend')
             .replace(/{{UNSUBSCRIBE_URL}}/gi, footerUnsubscribeUrl);

  // Click Tracking simulation
  html = html.replace(/<a\s+(?:[^>]*?\s+)?href=(["'])(.*?)\1/gi, (match, quote, url) => {
    console.log(`Checking URL: [${url}] against [${footerUnsubscribeUrl}]`);
    if (url === footerUnsubscribeUrl) {
      console.log('MATCHED UNSUBSCRIBE - SKIPPING WRAP');
      return match;
    }
    const trackingUrl = `${appUrl}/api/track/click/${campaignId}/${recipient.contactId}?url=${encodeURIComponent(url)}`;
    return match.replace(url, trackingUrl);
  });

  console.log('Final HTML:', html);
}

test();
