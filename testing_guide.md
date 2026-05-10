# 🧪 Email Campaign Platform - Testing Guide

This guide covers how to verify and test the core functionalities of the platform.

## 📡 Webhook Tracking
The platform uses AWS SES event publishing to track campaign activity.

### 1. Verification Scripts
We have created simulation scripts to verify that the webhook is processing events correctly.

| Event Type | Script | Command |
|------------|--------|---------|
| **Bounce** | `simulate-bounce.js` | `node simulate-bounce.js <campaignId>` |
| **Complaint** | `simulate-complaint.js` | `node simulate-complaint.js <campaignId>` |

### 2. Manual Verification
1. Create a campaign and send it.
2. Run the simulation script with the campaign ID.
3. Open the **Campaign Report** page.
4. Verify that the Bounce/Complaint count has increased.

---

### 🛡️ Template Integrity & Data Safety
We have implemented a strict **Template Integrity** check in the Campaign API. Once a template is selected, the system will actively prevent it from being cleared or nullified by subsequent partial saves or race conditions.

#### How to verify:
1. Select a template in Step 3.
2. Go back to Step 1 and change the campaign name.
3. Refresh the page.
4. Verify that the template remains selected in Step 4.

### 🔍 Database Auditing Tools
You can now perform deep database audits using the following scripts:

| Script | Command | Purpose |
|--------|---------|---------|
| `check-templates-db.js` | `node check-templates-db.js` | Audits ALL templates and campaigns in the DB. |
| `check-specific-campaign.js` | `node check-specific-campaign.js` | Investigates a specific campaign (ID hardcoded in script). |

### 🚀 Troubleshooting "Missing HTML"
If you still see a "no HTML content" error:
1. Visit `https://email-campaign-platform-pi.vercel.app/api/templates/seed` to repair any empty template records.
2. Run `node check-templates-db.js` to see if the HTML is actually present in the database.
3. Check the `save_trace.log` (if available) to see which request sent the data.
