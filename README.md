# Email Campaign Platform 🚀

An enterprise-grade, scalable email marketing and campaign automation platform built for high-volume email delivery, recipient management, and real-time analytics.

The platform uses a modern architecture powered by Next.js, PostgreSQL, Prisma ORM, AWS SES, and AWS SQS to deliver reliable and scalable email campaigns.

---

# ✨ Features

## 📧 Email Campaign Management

* Create and manage email campaigns.
* Schedule campaigns for automated delivery.
* Bulk email processing with background workers.
* Campaign status tracking and management.

---

## 👥 Contact & Audience Management

* Upload contacts using CSV files.
* Manage recipient lists and segmentation.
* Maintain subscriber preferences.
* Handle unsubscribe requests securely.

---

## 📝 Email Template System

* Create reusable email templates.
* Support dynamic variables such as:

```
{{first_name}}
{{email}}
```

* Maintain consistent branding across campaigns.

---

# 📊 Analytics & Tracking

* Email open tracking.
* Link click tracking.
* Delivery statistics.
* Campaign performance analytics.
* Recipient activity logs.

---

# 🔒 Security & Access Control

* Secure authentication using NextAuth.
* Role-based access control (RBAC).
* Organization and campaign manager permissions.
* Secure token-based unsubscribe mechanism.

---

# ⚡ Scalable Background Processing

The platform uses a dedicated worker service (`worker.js`) for handling long-running email tasks.

Responsibilities:

* Polling scheduled campaigns.
* Processing AWS SQS queue messages.
* Sending emails through AWS SES.
* Handling retries and failed message processing.
* Managing asynchronous email delivery without blocking the main application.

---

# 🛠️ Technology Stack

## Frontend

* Next.js 16 (App Router)
* React 19
* TypeScript
* Tailwind CSS

---

## Backend

* Next.js API Routes
* Prisma ORM
* PostgreSQL (Neon Production Database)
* NextAuth Authentication

---

## AWS Services

### Amazon SES

Used for:

* Scalable email delivery.
* Verified sender identity management.
* Production email sending.

### Amazon SQS

Used for:

* Email dispatch queues.
* Asynchronous background processing.
* Reliable message handling.

---

# 🏗️ System Architecture

```
                      User
                       |
                       v
                Next.js Application
              (Frontend + API Routes)
                       |
                       v
                Prisma ORM Layer
                       |
                       v
              Neon PostgreSQL Database
                       |
                       |
          -------------------------------
          |                             |
          v                             v
    Campaign Scheduler              Analytics
          |
          v
        AWS SQS
          |
          v
     Worker Service
      (worker.js)
          |
          v
       AWS SES
          |
          v
      Email Delivery
```

---

# ⚙️ Local Development Setup

## 1. Clone Repository

```bash
git clone https://github.com/theaischool01/TAS-Email-Campaign.git

cd TAS-Email-Campaign
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Configure Environment Variables

Create a `.env` file in the project root.

Example:

```env
DATABASE_URL=""

NEXTAUTH_SECRET=""
NEXTAUTH_URL="http://localhost:3000"

NEXT_PUBLIC_APP_URL="http://localhost:3000"

AWS_REGION="ap-south-1"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""

SES_FROM_EMAIL=""

SQS_QUEUE_NAME="EmailDispatchQueue"

DEVELOPER_SECRET=""
ADMIN_DEFAULT_PASSWORD=""

NODE_ENV="development"
```

---

## 4. Initialize Prisma

```bash
npx prisma generate

npx prisma db push
```

---

## 5. Start Development Services

### Terminal 1: Next.js Application

```bash
npm run dev
```

---

### Terminal 2: Background Worker

```bash
node worker.js
```

---

# 🚀 Production Deployment

## Application Service

The Next.js application requires:

* Node.js runtime.
* Production environment variables.
* Database connectivity.
* Build process.

Commands:

```bash
npm install

npm run build

npm start
```

---

## Worker Deployment

The worker must run as a separate background process.

Example:

```bash
node worker.js
```

Recommended production process managers:

* PM2 (Hostinger VPS)
* Render Background Worker
* Other Node.js process managers

---

# 🔐 Required Production Environment Variables

```
DATABASE_URL

NEXTAUTH_SECRET
NEXTAUTH_URL
NEXT_PUBLIC_APP_URL

AWS_REGION

AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY

SES_FROM_EMAIL

SQS_QUEUE_NAME

DEVELOPER_SECRET
ADMIN_DEFAULT_PASSWORD

NODE_ENV=production
```

---

# 🧪 Production Validation Checklist

After deployment verify:

* Application loads successfully.
* User authentication works.
* Dashboard functions correctly.
* CSV upload works.
* Email templates can be created.
* Campaigns can be scheduled.
* Worker receives SQS messages.
* Emails are delivered through AWS SES.
* Open and click tracking works.
* Analytics data updates correctly.

---

# 📈 Future Roadmap

* AI-powered email subject suggestions.
* A/B testing for campaign optimization.
* Advanced engagement analytics.
* Automated drip campaign workflows.
* Webhook integrations.
* Enhanced reporting dashboards.

---

# 📌 Repository Information

Repository:

```
theaischool01/TAS-Email-Campaign
```

This repository is maintained as the official source code for the Email Campaign Platform.

---

# 📄 License

This project is proprietary software maintained by The AI School.

Unauthorized distribution or commercial use is prohibited.
