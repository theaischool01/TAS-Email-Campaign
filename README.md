# 📧 M9 Analytics – Email Campaign Platform

A professional, high-performance email marketing and automation platform built for scale. Manage contacts, design beautiful templates, and launch tracked campaigns with real-time analytics.

---

## 🌟 Project Overview
**M9 Analytics** is a production-grade Email Service Provider (ESP) interface designed to bridge the gap between complex AWS infrastructure and user-friendly campaign management. It provides a robust suite of tools for businesses to reach their audience effectively while maintaining high deliverability and deep engagement insights.

This platform handles everything from secure subscriber management to RFC 8058-compliant one-click unsubscriptions, ensuring your emails land in the inbox and stay compliant with modern global standards.

---

## 🚀 Features & Modules

### 1. **Campaign Management Wizard**
- Step-by-step creation flow (Details → Content → Recipients → Review).
- Schedule campaigns for future delivery or send immediately.
- Real-time sending progress monitoring.

### 2. **Contact & List Management**
- Organize subscribers into multiple lists.
- **Bulk Import**: Seamlessly import thousands of contacts via CSV.
- **Segmentation**: Target specific users based on custom criteria and tags.

### 3. **Visual Template Builder**
- Drag-and-drop MJML-powered editor.
- Library of pre-built, mobile-responsive templates.
- HTML/JSON export and preview modes.

### 4. **Deep Analytics Dashboard**
- **Global Stats**: Total Sent, Opened, Clicked, and Bounced.
- **Tracking System**: Unique open tracking and link click redirection.
- **Growth Trends**: Visualize your audience growth over time.

### 5. **Security & RBAC**
- **Roles**: Super Admin, Manager, and Viewer.
- **IP Lockout**: Automatic protection against brute-force login attempts.
- **Secure Tokens**: Encrypted unsubscribe links to prevent unauthorized opt-outs.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15+ (App Router), React 19, Tailwind CSS |
| **Backend** | Next.js Server Actions, API Routes, TypeScript |
| **Database** | PostgreSQL (NeonDB), Prisma ORM |
| **Auth** | NextAuth.js (Credentials Provider) |
| **Infrastructure** | AWS SES (Simple Email Service), AWS SQS (Queuing) |
| **Deployment** | Vercel (Frontend/API), Neon (Database) |

---

## 📐 Architecture & Workflow

1. **Campaign Creation**: User designs a template and selects a recipient list.
2. **Dispatch**: The system validates the campaign and pushes individual email tasks to **AWS SQS**.
3. **Delivery**: A background worker processes the queue and sends emails via **AWS SES**.
4. **Tracking**: When a user opens an email or clicks a link, our **Tracking API** logs the event and redirects the user.
5. **Feedback**: AWS SNS listens for Bounces/Complaints and updates the contact status in real-time.

---

## 📂 Folder Structure

```text
├── app/                  # Next.js App Router (Pages & APIs)
│   ├── api/              # Backend API Endpoints
│   ├── dashboard/        # Main User Interface
│   └── unsubscribe/      # Public Recipient Pages
├── components/           # Shared UI Components (Shadcn/UI)
├── lib/                  # Services, Utilities, and DB Client
│   ├── services/         # Business Logic (Email, Analytics)
│   └── rbac/             # Access Control Logic
├── prisma/               # Database Schema & Migrations
├── public/               # Static Assets
└── worker.js             # Background Queue Processor
```

---

## ⚙️ Installation & Local Setup

### Prerequisites
- Node.js 20+
- PostgreSQL Database
- AWS Account (SES Access)

### Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/SaheelYadav/email-campaign-platform.git
   cd email-campaign-platform
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (see the table below).

4. **Initialize Database**:
   ```bash
   npx prisma db push
   ```

5. **Seed Default Templates**:
   Start the app and visit `/api/templates/seed` while logged in to load initial designs.

6. **Run the development server**:
   ```bash
   npm run dev
   ```

---

## 🔑 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Your PostgreSQL connection string (Neon/Local) |
| `NEXTAUTH_SECRET` | Secret key for session encryption |
| `AWS_ACCESS_KEY` | Your AWS IAM User Access Key |
| `AWS_SECRET_ACCESS_KEY` | Your AWS IAM User Secret Key |
| `AWS_REGION` | Your AWS SES Region (e.g., `us-east-1`) |
| `SES_FROM_EMAIL` | Verified sender email in AWS SES |
| `NEXT_PUBLIC_APP_URL` | Your application's base URL |

---

## 📧 AWS SES Setup

To enable email sending, follow these steps in your AWS Console:
1. **Verify Identity**: Add and verify your domain or email address in SES.
2. **Production Access**: If you are in the SES Sandbox, request production access to send to unverified emails.
3. **Configuration Set**: Create a configuration set named `M9_Analytics` to track delivery events.
4. **SMTP/IAM**: Create an IAM user with `AmazonSESFullAccess` and generate credentials.

---

## 📊 Tracking & Compliance

### **Tracking System**
- **Opens**: A 1x1 transparent pixel is embedded in each email.
- **Clicks**: Links are rewritten to route through `/api/track/click`.
- **Bot Filtering**: The system ignores bot/crawler activity to ensure accurate data.

### **Compliance (RFC 8058)**
M9 Analytics implements **One-Click Unsubscribe** headers. This ensures your emails are compliant with Google and Yahoo's 2024 sender requirements, reducing your spam score.

---

## 📚 API & Postman
Full API documentation is available in `API_DOCUMENTATION.md`.

### **Postman Usage**
1. Import `email-campaign-platform-postman.json` into Postman.
2. Set the `base_url` variable to your deployment URL.
3. Use the **Auth** folder to log in and receive your session cookie.

---

## 🚢 Deployment

### **Vercel**
1. Connect your GitHub repository to Vercel.
2. Add all environment variables from your `.env` file to Vercel Project Settings.
3. Deploy! The `build` script will automatically handle Prisma generation.

---

## 📸 Screenshots
*(Add your project screenshots here)*
> [!TIP]
> Place screenshots of the Dashboard, Campaign Wizard, and Template Builder here to showcase the UI.

---

## 🎥 Demo Video
*(Add your demo video link here)*
> [!NOTE]
> A walkthrough video demonstrating a campaign launch is highly recommended for submission.

---

## 🛠️ Troubleshooting

- **Build Failing?** Ensure `DATABASE_URL` is accessible during the build step.
- **Emails not sending?** Check if your AWS SES is still in "Sandbox Mode".
- **Prisma Errors?** Run `npx prisma generate` to sync your client with the schema.

---

## 📜 License & Copyright

**Copyright © 2026 Saheel Yadav. All Rights Reserved.**

This project is proprietary software. Unauthorized copying, redistribution, or commercial reuse is strictly prohibited. The code is provided for educational and portfolio demonstration purposes only.

---

## 👤 Author

**Saheel Yadav**
*Full-Stack Software Engineer*

- **GitHub**: [@SaheelYadav](https://github.com/SaheelYadav)
- **LinkedIn**: [Saheel Yadav](https://linkedin.com/in/saheel-yadav-ai-ml)

---
*© 2026 Saheel Yadav. All Rights Reserved.*
