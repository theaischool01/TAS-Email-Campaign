
const campaignId = "cmp06445v0019ky04nt5z2zep"; // From your screenshot
const webhookUrl = "https://email-campaign-platform-pi.vercel.app/api/webhooks/ses";

const complaintPayload = {
  Type: "Notification",
  Message: JSON.stringify({
    eventType: "Complaint",
    mail: {
      timestamp: new Date().toISOString(),
      source: "saheelyadav67@gmail.com",
      messageId: "simulated-complaint-id",
      destination: ["complaint@simulator.amazonses.com"],
      tags: {
        campaignId: [campaignId],
        contactId: ["simulated-contact-id"]
      }
    },
    complaint: {
      complainedRecipients: [
        {
          emailAddress: "complaint@simulator.amazonses.com"
        }
      ],
      timestamp: new Date().toISOString(),
      feedbackId: "simulated-complaint-feedback-id",
      complaintFeedbackType: "abuse"
    }
  })
};

console.log("🚀 SIMULATION: Sending fake complaint to your dashboard...");

fetch(webhookUrl, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(complaintPayload)
})
.then(res => res.json())
.then(data => {
  console.log("✅ SUCCESS: Dashboard notified of complaint!", data);
  console.log("👉 Now REFRESH your browser to see the '1 Complaints' count!");
})
.catch(err => {
  console.error("❌ FAILED: Could not reach your dashboard.", err);
});
