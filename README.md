# Email Campaign Platform 🚀

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![AWS SES](https://img.shields.io/badge/AWS-SES-orange?style=flat-square&logo=amazon-aws)](https://aws.amazon.com/ses/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-DB-336791?style=flat-square&logo=postgresql)](https://www.postgresql.org/)

An enterprise-grade, high-performance email marketing and automation platform. Built with Next.js 15, AWS SES, and SQS for scalable delivery.

[**📖 View API Documentation**](./docs/API_DOCUMENTATION.md)

---

## 📸 Screenshots

| Dashboard Overview | Campaign Management |
|:---:|:---:|
| ![Dashboard](./docs/screenshots/dashboard.png) | ![Campaigns](./docs/screenshots/Campaigns.png) |

| Preference Center | Template Builder |
|:---:|:---:|
| ![Preferences](./docs/screenshots/preference.png) | ![Templates](./docs/screenshots/templates.png) |

---

## ✨ Features

- **📬 AWS SES Integration**: Enterprise-grade email delivery using Amazon Simple Email Service (SES v2).
- **📊 Real-time Analytics**: Live tracking of open rates, click rates, and delivery success.
- **🎯 Smart Recipient Management**: Advanced contact segmentation and mailing list organization.
- **🔒 Secure Preference Center**: Dedicated public portal for recipients to manage their communication preferences with per-list toggles.
- **🛡️ Automated Unsubscribe**: Secure, token-based unsubscription flow with human-verification safeguards.
- **⚡ Background Processing**: High-throughput delivery using AWS SQS and a dedicated worker system.
- **📝 Template System**: Reusable email templates with dynamic variable replacement (e.g., `{{first_name}}`).
- **🔐 RBAC Security**: Robust Role-Based Access Control for Organizations and Campaign Managers.
- **🔄 Activity Feed**: Live audit trail of all recipient interactions (clicks, opens, unsubscribes).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js 15 (App Router)](https://nextjs.org/)
- **UI Logic**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Components**: [Lucide React Icons](https://lucide.dev/), [HeroIcons](https://heroicons.com/)

### Backend
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (Production) / [SQLite](https://www.sqlite.org/) (Local)
- **Queue**: [AWS SQS](https://aws.amazon.com/sqs/)
- **Email Delivery**: [AWS SES SDK v3](https://aws.amazon.com/ses/)

### Infrastructure
- **Deployment**: [Vercel](https://vercel.com/)
- **Monitoring**: AWS CloudWatch (via SES/SQS)

---

## 🏗️ Project Architecture

The platform follows a modern micro-service-lite architecture:

1.  **Frontend (Next.js)**: Handles the user interface, campaign creation wizard, and analytics visualization.
2.  **API Layer (Next.js Routes)**: Secure endpoints for data management and tracking pixel processing.
3.  **Tracking System**: Highly optimized endpoints for open tracking (transparent pixels) and click redirects.
4.  **Worker System (`worker.js`)**: A dedicated background process that consumes SQS messages to handle bulk email delivery without blocking the main thread.
5.  **Analytics Pipeline**: Real-time aggregation of activity logs into campaign-level performance metrics.

---

## ⚙️ Installation & Setup

### 1. Clone the repository
```bash
git clone https://github.com/SaheelYadav/email-campaign-platform.git
cd email-campaign-platform
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/email_platform"

# Authentication
NEXTAUTH_SECRET="generate-a-secure-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# AWS Configuration
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_SQS_QUEUE_URL="your-sqs-queue-url"

# App URL (Critical for tracking)
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Initialize the Database
```bash
npx prisma generate
npx prisma db push
```

### 5. Start the Application
```bash
# Terminal 1: Frontend & API
npm run dev

# Terminal 2: Background Worker
node worker.js
```

---

## 🚢 Production Architecture & Deployment

The platform is designed to run in a decoupled, multi-service production architecture:

```text
Next.js (Vercel Web App)
      ↓
Campaign APIs & Tracking Pixels
      ↓
AWS SQS (Queueing Layer)
  ┌───┴────────────────────────┐
  ▼                            ▼
worker.js             analytics-worker.ts
(Render Background)   (Render Background)
  ▼                            ▼
AWS SES                 Database Ingestion
```

### 1. Web Application (Vercel)
1. **Connect Vercel**: Import the repository into your Vercel account.
2. **Add Variables**: Add all required `.env` variables (e.g. databases, authentication, AWS credentials) to Vercel Project Settings.
3. **Absolute URLs**: Ensure `NEXT_PUBLIC_APP_URL` matches your production domain.
4. **Prisma Build**: Verify your build command includes `prisma generate && next build`.

### 2. Background Workers (Render Background Workers)
Deploy the workers as separate Render Background Workers:
* **Email dispatch worker (`worker.js`)**: Runs SQS polling and SES sends.
  * *Start Command*: `npx tsx worker.js`
* **Analytics ingestion worker (`analytics-worker.ts`)**: Ingests tracking events.
  * *Start Command*: `npx tsx analytics-worker.ts`

#### Worker Health Server Configuration
* In production, the Next.js API `/api/health` queries `WorkerHeartbeat` database records to verify worker health. Therefore, the internal HTTP server in `worker.js` is optional and disabled by default.
* To enable a standalone worker health HTTP port, set:
  ```env
  ENABLE_WORKER_HEALTH_SERVER=true
  PORT=3001
  ```
* For standard deployments (including Render Background Workers), leave `ENABLE_WORKER_HEALTH_SERVER=false` (or unset) to prevent port collisions.

---

## 🧪 Production Validation Checklist

After deployment verify:

- [ ] Application loads successfully.
- [ ] User authentication works.
- [ ] Dashboard functions correctly.
- [ ] CSV upload works.
- [ ] Email templates can be created.
- [ ] Campaigns can be scheduled.
- [ ] Worker receives SQS messages.
- [ ] Emails are delivered through AWS SES.
- [ ] Open and click tracking works.
- [ ] Analytics data updates correctly.

---

## 🔮 Future Roadmap

- [ ] **AI Subject Suggestions**: Leverage Gemini AI to suggest high-converting subject lines.
- [ ] **A/B Testing**: Side-by-side performance comparison for campaign variants.
- [ ] **Advanced Heatmaps**: Visual representation of where users click within your emails.
- [ ] **Custom Webhooks**: Integrate with Zapier or internal tools on engagement events.
- [ ] **Recurring Campaigns**: Automated drip sequences and scheduled follow-ups.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Saheel Yadav**
- [LinkedIn](https://www.linkedin.com/in/saheel-yadav-ai-ml/)
- [Portfolio](https://saheel-yadav-portfolio-git-main-saheel-yadavs-projects.vercel.app/)
- [GitHub](https://github.com/SaheelYadav)
