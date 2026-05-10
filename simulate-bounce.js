
const campaignId = "cmp06445v0019ky04nt5z2zep"; // From your screenshot
const webhookUrl = "https://email-campaign-platform-pi.vercel.app/api/webhooks/ses";

const bouncePayload = {
  Type: "Notification",
  Message: JSON.stringify({
    eventType: "Bounce",
    mail: {
      timestamp: new Date().toISOString(),
      source: "saheelyadav67@gmail.com",
      messageId: "simulated-message-id",
      destination: ["bounce@simulator.amazonses.com"],
      tags: {
        campaignId: [campaignId],
        contactId: ["simulated-contact-id"]
      }
    },
    bounce: {
      bounceType: "Permanent",
      bounceSubType: "General",
      bouncedRecipients: [
        {
          emailAddress: "bounce@simulator.amazonses.com",
          action: "failed",
          status: "5.1.1",
          diagnosticCode: "smtp; 550 5.1.1 user unknown"
        }
      ],
      timestamp: new Date().toISOString(),
      feedbackId: "simulated-feedback-id"
    }
  })
};

console.log("🚀 SIMULATION: Sending fake bounce to your dashboard...");

fetch(webhookUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(bouncePayload)
})
.then(res => res.json())
.then(data => {
  console.log("✅ SUCCESS: Dashboard notified!", data);
  console.log("👉 Now REFRESH your browser to see the '1 Bounced' count!");
})
.catch(err => {
  console.error("❌ FAILED: Could not reach your dashboard.", err);
});
