# Email Campaign Platform - Enterprise API Documentation 📡

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![AWS SES](https://img.shields.io/badge/AWS-SES-orange?style=flat-square&logo=amazon-aws)](https://aws.amazon.com/ses/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-black?style=flat-square&logo=vercel)](https://vercel.com/)

Welcome to the enterprise-grade API documentation for the **Email Campaign Platform**. This guide provides deep technical insights into the platform's architecture and integration patterns.

---

## 🏗️ Architecture Overview

The platform is built on a modern, event-driven architecture designed for high scalability and reliability.

### **Core Components:**
1.  **Next.js API Layer**: Handles all RESTful requests, RBAC enforcement, and UI interactions.
2.  **Background Worker**: A dedicated Node.js process that polls **AWS SQS** and dispatches emails via **AWS SES**.
3.  **Analytics Engine**: Captures real-time engagement data through a high-performance tracking pipeline.
4.  **Prisma ORM**: Provides type-safe database access to our PostgreSQL cluster.

---

## 🔄 Campaign Lifecycle

1.  **DRAFT**: Initialize a campaign, set metadata, and select a template.
2.  **READY**: Finalize recipient lists and validate sender credentials.
3.  **SENDING**: The background worker picks up the campaign from SQS and begins dispatching.
4.  **SENT**: The campaign is completed, and final analytics are aggregated.

---

## 🛰️ Tracking Pipeline

Our tracking system is designed for high accuracy with built-in bot detection.

*   **Open Tracking**: Injects a transparent 1x1 tracking pixel into every outgoing email.
*   **Click Tracking**: Wraps all links in a secure redirect URL (`/api/track/click/...`).
*   **Deduplication**: Enforces a strict activity logging policy to ensure one-to-one reporting accuracy.

---

## 🔐 RBAC & Security

We implement a multi-layered security model:

-   **SUPER_ADMIN**: Full system access, including organization settings and user management.
-   **CAMPAIGN_MANAGER**: Can manage their own campaigns, templates, and contact lists.
-   **VIEWER**: Read-only access to analytics and reports.

### **Authentication Flow:**
-   We use **NextAuth.js** with session-cookie persistence.
-   **Postman Usage**: First, run the `Login` request. Postman will automatically capture and store the session cookie, which is then sent with all subsequent protected requests.

---

## 📊 Analytics & Reporting

Our analytics suite provides real-time visibility into campaign health:
-   **Open Rate**: Total unique opens / Total successful deliveries.
-   **Click Rate (CTR)**: Total unique clicks / Total successful deliveries.
-   **Activity Feed**: A deterministic log of all platform interactions.

---

## 🛠️ Developer Experience

### **Automated Postman Collection:**
Our provided collection (`docs/email-campaign-platform.postman_collection.json`) includes:
-   **Auto-Capture Scripts**: Automatically saves `campaign_id`, `template_id`, and `contact_id` to your environment.
-   **Dual Environments**: Switch seamlessly between **Development** (Local) and **Production** (Vercel).

---
Built for performance. Built for scale. 🚀
