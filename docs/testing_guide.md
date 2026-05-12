# Quality Assurance & Verification Guide 🧪

This guide outlines the professional QA protocols and verification workflows for the **Email Campaign Platform**. It is designed to ensure system stability, data integrity, and delivery accuracy across all environments.

---

## 1. Campaign Delivery Workflow

Verify the end-to-end process of campaign creation, dispatch, and completion.

| Step | Action | Expected Outcome |
|------|--------|------------------|
| 1.1 | Create a campaign draft | Campaign appears in the dashboard with `DRAFT` status. |
| 1.2 | Select a template and list | Template preview renders correctly; recipient count matches the selected list. |
| 1.3 | Launch the campaign | Status changes to `SENDING`. Worker begins processing SQS messages. |
| 1.4 | Monitor completion | Status changes to `SENT` once all recipients are processed. |

---

## 2. Tracking & Analytics Verification

Confirm the accuracy of the real-time engagement tracking pipeline.

### **Open Tracking**
1.  Send a test campaign to a controlled inbox.
2.  Open the email (ensure "display images" is enabled).
3.  **Verification**: Check the Campaign Report; the "Opens" count must increment within seconds.

### **Click Tracking**
1.  Click a tracked link within the delivered email.
2.  **Verification**: Ensure successful redirection to the destination URL.
3.  **Verification**: Check the Campaign Report; the "Clicks" count must increment.

### **Webhook Events (Bounce/Complaint)**
*   Simulate an AWS SES `Bounce` or `Complaint` event via the provided testing utilities.
*   **Verification**: The Campaign Report should immediately reflect the updated bounce/complaint metrics.

---

## 3. Unsubscribe & Preference Flow

Ensure compliance with RFC 8058 and verify user preference persistence.

| Workflow | Step | Verification |
|----------|------|--------------|
| **One-Click Unsubscribe** | Click the "Unsubscribe" link in the email footer. | Contact status in the DB changes to `UNSUBSCRIBED`. Activity log captures the event. |
| **Preference Center** | Navigate to the Preference Center via the email link. | All current mailing list memberships are accurately displayed. |
| **Resubscribe** | Toggle a list to "Active" and save preferences. | Contact status reverts to `ACTIVE`. Activity feed shows `EMAIL_RESUBSCRIBED`. |

---

## 4. System Stability & Data Integrity

### **Template Persistence**
The platform enforces strict template integrity. To verify:
1.  Assign a template to a draft campaign.
2.  Navigate away or perform partial updates (e.g., change campaign name).
3.  **Expected Outcome**: The assigned `templateId` remains locked and persisted to prevent data loss during autosave cycles.

### **RBAC Enforcement**
1.  Log in with a `VIEWER` role.
2.  Attempt to launch a campaign or delete a contact.
3.  **Expected Outcome**: API returns `403 Forbidden`. UI elements (Launch/Delete buttons) are hidden or disabled.

---

## 5. Production Readiness

Before deploying to Vercel, perform the following environmental checks:

- [ ] **Build Check**: Run `npm run build` to ensure TypeScript and Next.js compilation passes.
- [ ] **Prisma Sync**: Ensure the production database schema is up-to-date with `npx prisma db push`.
- [ ] **Environment Variables**: Verify all AWS SES/SQS and NextAuth secrets are correctly configured in Vercel.
- [ ] **Absolute URLs**: Ensure `NEXT_PUBLIC_APP_URL` points to the production domain for accurate tracking links.

---

## 🏁 Final Verification Checklist

Prior to final release, all items below must be verified as **PASS**.

- [x] **Campaign Dispatch**: Emails are successfully queued and delivered.
- [x] **Open/Click Tracking**: Engagement metrics are accurately recorded.
- [x] **Unsubscribe Logic**: One-click and Preference Center flows are functional.
- [x] **Resubscribe Flow**: Users can successfully opt back into mailing lists.
- [x] **Activity Feed**: Real-time logging of all major system events.
- [x] **Analytics Dashboard**: Aggregate metrics render correctly with high precision.
- [x] **Build Stability**: `npm run build` completes without errors.
- [x] **Production Parity**: Local testing matches Vercel deployment behavior.

---
Built for reliability. Verified for scale. 🚀
