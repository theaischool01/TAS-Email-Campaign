# AWS CloudWatch Alarm Setup Specifications

This document defines the metrics, namespaces, evaluation parameters, and severity classes for production alerting on the Email Campaign Platform.

---

## 1. Amazon SQS Alarms

### SQS Queue Backlog Alarm (P1 - Warning)
* **Alarm Name:** `email-dispatch-backlog-warning`
* **Namespace:** `AWS/SQS`
* **Metric Name:** `ApproximateNumberOfMessagesVisible`
* **Dimension:** `QueueName = EmailDispatchQueue`
* **Statistic:** `Average`
* **Period:** `5 minutes`
* **Threshold:** `> 5000` messages
* **Evaluation Periods:** `1 out of 1` (fires if average backlog exceeds 5000 over a 5-minute period).
* **Severity:** **P1 Warning**
* **Trigger Action:** SNS notification -> `ops-warning-alerts-topic` (routes to Slack/Email).
* **Description:** Indicates worker processing rate is lagging behind campaign dispatch schedules, or there is database connection slowness, or SES throttle rates are forcing delays.

---

### Stuck Queue Message Alarm (P0 - Critical)
* **Alarm Name:** `email-dispatch-stuck-messages-critical`
* **Namespace:** `AWS/SQS`
* **Metric Name:** `ApproximateAgeOfOldestMessage`
* **Dimension:** `QueueName = EmailDispatchQueue`
* **Statistic:** `Maximum`
* **Period:** `60 seconds`
* **Threshold:** `> 300` seconds (5 minutes)
* **Evaluation Periods:** `1 out of 1`
* **Severity:** **P0 Critical**
* **Trigger Action:** SNS notification -> `ops-critical-alerts-topic` (routes to PagerDuty/SMS/On-call Email).
* **Description:** Indicates messages are stuck in the dispatch queue without being consumed. Typically signals that all worker nodes are offline, polling loops have failed, database pools are depleted, or SQS endpoints are inaccessible.

---

### Dead Letter Queue Alarm (P0 - Critical)
* **Alarm Name:** `email-dlq-messages-critical`
* **Namespace:** `AWS/SQS`
* **Metric Name:** `ApproximateNumberOfMessagesVisible`
* **Dimension:** `QueueName = EmailDispatchQueue_DLQ`
* **Statistic:** `Maximum`
* **Period:** `60 seconds`
* **Threshold:** `> 0` messages
* **Evaluation Periods:** `1 out of 1`
* **Severity:** **P0 Critical**
* **Trigger Action:** SNS notification -> `ops-critical-alerts-topic`
* **Description:** Triggered instantly when any message fails all maxReceiveCount retries and is moved to the DLQ. Indicates poison message syntax, critical database write failures, or persistent runtime exceptions that require manual queue extraction and recovery.

---

## 2. Amazon SES reputation alarms

### Bounce Rate Reputation Alarm (P0 - Critical)
* **Alarm Name:** `ses-bounce-rate-critical`
* **Namespace:** `AWS/SES`
* **Metric Name:** `Reputation.BounceRate`
* **Statistic:** `Average`
* **Period:** `5 minutes`
* **Threshold:** `> 0.05` (5%)
* **Evaluation Periods:** `1 out of 1`
* **Severity:** **P0 Critical**
* **Trigger Action:** SNS notification -> `ops-critical-alerts-topic`
* **Description:** Indicates the percentage of sent emails that bounced exceeds the 5% warning threshold. High bounce rates damage sender reputation and risk immediate SES account sending restrictions.

---

### Complaint Rate Reputation Alarm (P0 - Critical)
* **Alarm Name:** `ses-complaint-rate-critical`
* **Namespace:** `AWS/SES`
* **Metric Name:** `Reputation.ComplaintRate`
* **Statistic:** `Average`
* **Period:** `5 minutes`
* **Threshold:** `> 0.001` (0.1%)
* **Evaluation Periods:** `1 out of 1`
* **Severity:** **P0 Critical**
* **Trigger Action:** SNS notification -> `ops-critical-alerts-topic`
* **Description:** Triggered if spam complaints exceed 0.1%. SES maintains a strict complaint threshold (typically suspension occurs if complaints hit 0.2%+). Immediate block-sending actions may be necessary.

---

## 3. Background Worker Health Alarm

### Worker Heartbeat Outage Alarm (P0 - Critical)
* **Alarm Name:** `background-worker-outage-critical`
* **Namespace:** `AWS/ApplicationELB` or `AWS/Route53` (using Custom Synthetics Canary)
* **Metric Name:** `FailedCheckCount` / HTTP Status Monitoring
* **Target Endpoint:** `GET /api/health`
* **Condition:** Triggered when the returned JSON payload indicates `"status": "degraded"` or `"workers.status": "offline"` (meaning 0 active healthy heartbeats have checked in for 5 minutes).
* **Statistic:** `Average`
* **Period:** `5 minutes`
* **Threshold:** `>= 1`
* **Evaluation Periods:** `1 out of 1`
* **Severity:** **P0 Critical**
* **Trigger Action:** SNS notification -> `ops-critical-alerts-topic`
* **Description:** Indicates there are zero background workers currently reporting a `HEALTHY` heartbeat status. No campaigns are processing.

---

## 4. Alert Routing Blueprint

```
                     +----------------------------+
                     |  CloudWatch Metric Alarm   |
                     +--------------+-------------+
                                    |
                                    v
                     +--------------+-------------+
                     |      Amazon SNS Topic      |
                     +--------------+-------------+
                                    |
            +-----------------------+-----------------------+
            |                                               |
            v                                               v
+-----------+-----------+                       +-----------+-----------+
| ops-critical-alerts   |                       |  ops-warning-alerts   |
+-----------+-----------+                       +-----------+-----------+
            |                                               |
     +------+------+                                        v
     |             |                              +---------+---------+
     v             v                              | Slack Warning Ch. |
+----+----+   +----+----+                         +-------------------+
|PagerDuty|   |On-Call  |
+---------+   |Email    |
              +---------+
```
