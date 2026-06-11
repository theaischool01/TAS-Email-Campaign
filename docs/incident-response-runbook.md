# Incident Response Runbook

This runbook defines the operational playbooks for triage, containment, mitigation, and root-cause resolution of production incidents on the Email Campaign Platform.

---

## 1. Incident Lifecycle Overview

```
 [Detection] (CloudWatch / Sentry / Canary)
      |
      v
  [Triage] (Identify Severity: P0 vs P1)
      |
      v
 [Containment] (Stop Campaign / Rate limit / Scale workers)
      |
      v
 [Mitigation] (Restart Workers / Database query cleanup)
      |
      v
[Root Cause] (Fix underlying code bug / SQS configurations)
      |
      v
[Postmortem] (Document timeline and prevent recurrence)
```

---

## 2. Playbook A: Stuck Queue Message Alarm (`ApproximateAgeOfOldestMessage > 300s`)
* **Severity:** **P0 Critical**
* **Symptoms:** Email deliveries stop, messages queue up, older campaigns remain in `SENDING` status without progressing.

### Triage & Diagnostics
1. Check the database to see if background workers are checking in:
   ```sql
   SELECT id, hostname, pid, status, lastSeenAt, memoryMb, activeMessages 
   FROM "WorkerHeartbeat" 
   ORDER BY "lastSeenAt" DESC;
   ```
2. Determine if the database connection pool is saturated, or if database response is slow.
3. Review worker logs for connection issues (Pino logs with `service="email-campaign-worker"`).

### Mitigation & Recovery Actions
1. **Restart Worker Processes:**
   - If deploying on AWS EC2 or PM2:
     ```bash
     pm2 restart worker
     ```
   - If running in Docker/Kubernetes container:
     ```bash
     kubectl rollout restart deployment email-campaign-worker
     ```
2. **Database Scale Connection Pool:**
   - If logs show `PrismaClientInitializationError: DB connection pool exhausted`, temporarily increase pool limit parameter in `.env`:
     ```
     DATABASE_URL="postgresql://...&connection_limit=30"
     ```
   - Restart API and worker containers.

---

## 3. Playbook B: Dead Letter Queue (DLQ) Alert (`ApproximateNumberOfMessagesVisible > 0`)
* **Severity:** **P0 Critical**
* **Symptoms:** Messages land in `EmailDispatchQueue_DLQ` indicating permanent parsing or processing failure.

### Triage & Diagnostics
1. Query Sentry for recent crash exceptions matching SQS processing:
   - Search for tags matching `sqsMessageId` or `campaignId`.
2. Inspect the DLQ message body on AWS Console -> SQS -> Queue -> Send and receive messages. Look for payload formatting discrepancies or missing Zod parameters.

### Mitigation & Recovery Actions
1. **Fix Payload/Code mismatch:**
   - If Zod validation failed because contact structure changed, update the validation schema `QueuePayloadSchema` in `worker.js` or fix the calling client payload generation.
2. **Redrive Messages from DLQ:**
   - Once the application fix is deployed, initiate DLQ Redrive from the AWS SQS Console to move messages back to the primary `EmailDispatchQueue` for processing.

---

## 4. Playbook C: Reputation Bounce Rate Alarm (`Reputation.BounceRate > 5%`)
* **Severity:** **P0 Critical**
* **Symptoms:** Bounce rate alarm fires; danger of SES account suspension.

### Containment Actions
1. **Pause All Active Campaigns:**
   - Execute database update to halt further worker processing of active dispatches:
     ```sql
     UPDATE "Campaign" 
     SET status = 'PAUSED' 
     WHERE status = 'SENDING';
     ```

### Mitigation & Resolution
1. **Purge Suppression List / Bad Emails:**
   - Scan contact database for invalid email formats, disposable emails, or domains known to cause hard bounces.
   - Run suppression imports into the platform settings to block sending to these addresses in the future.
2. **SES Feedback Loop Check:**
   - Verify that SES bounce notifications are arriving correctly at `/api/webhooks/ses` to auto-suppress hard bounces.

---

## 5. Playbook D: Reputation Complaint Rate Alarm (`Reputation.ComplaintRate > 0.1%`)
* **Severity:** **P0 Critical**
* **Symptoms:** SES complaint rate exceeds 0.1%. Danger of spam marking and immediate carrier suspension.

### Containment Actions
1. **Stop All Sendings Immediately:**
   ```sql
   UPDATE "Campaign" SET status = 'PAUSED' WHERE status = 'SENDING';
   ```
2. Disable the worker process entirely:
   ```bash
   pm2 stop worker
   ```

### Mitigation & Resolution
1. **Verify Unsubscribe Links:**
   - Verify that the footer Unsubscribe link works, does not require login, and immediately records preferences.
   - Verify List-Unsubscribe headers are present.
2. **Audit Campaign Content:**
   - Ensure subject lines do not use spam-trigger keywords.
   - Verify that campaign target lists have opted in.

---

## 6. Playbook E: Worker Outage Alarm (`GET /api/health` Degraded)
* **Severity:** **P0 Critical**
* **Symptoms:** Synthetic checker alerts that `/api/health` indicates `"workers.status": "offline"`.

### Containment & Diagnostics
1. Run worker diagnostics check:
   ```bash
   # Check worker logs
   tail -n 100 worker-error.log
   ```
2. Verify process state using PM2 or Docker:
   ```bash
   pm2 status
   # or
   docker ps | grep worker
   ```

### Mitigation & Recovery
1. **Start Workers:**
   - Start the service manually if it crashed:
     ```bash
     pm2 start worker.js --name "worker"
     ```
2. **Clear Lockups:**
   - If workers are hanging due to ghost processes or zombie memory consumption:
     ```bash
     killall node
     pm2 start worker.js --name "worker"
     ```
