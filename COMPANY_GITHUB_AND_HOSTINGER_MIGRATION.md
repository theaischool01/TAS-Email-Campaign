# Company Migration and Deployment Plan

This document is the full migration and deployment checklist for the `email-campaign-platform` project.

It is written for the incoming company GitHub account and AWS account, and includes a safe deployment approach for Hostinger / Render.

---

## 1. Architecture Summary

### What this repo contains
- **Next.js 16 app router** frontend + API routes
- **NextAuth** authentication
- **Prisma ORM** for database access
- **AWS integration** using SES and SQS
- **Dedicated worker** in `worker.js` that polls a queue and sends email via SES
- **Cron scheduling** inside the worker for campaign dispatch logic

### Current deployment pattern
- UI/backend app: deployed from GitHub repo
- Background worker: deployed separately and runs continuously
- AWS: SES for email delivery, SQS for dispatch queue, PostgreSQL for data

> Note: Hostinger may only be a fit for the Node/Next.js web app if the plan supports Node.js apps (Cloud / VPS). The worker is safer to keep on Render or another Node-friendly background host.

---

## 2. Recommended Source Control Flow

### 2.1 Create the new company GitHub repo

1. Ask the company to create a new GitHub organization or user account.
2. Create a new repository named `email-campaign-platform` under that account.
3. Set the repo to **private** unless otherwise required.
4. Add the company team and your GitHub user as collaborators with push access.

### 2.2 Push the current code into the company repo

From the local clone:

```powershell
cd c:\Users\Saheel\Desktop\Email_Campaign_Platform\email-campaign-platform

# rename the existing origin as upstream so history is preserved
git remote rename origin upstream

# add the new company repo
git remote add origin git@github.com:<COMPANY_ORG>/email-campaign-platform.git

git push -u origin main
```

If the company repo does not exist yet, you can create it via GitHub CLI:

```powershell
gh auth login

gh repo create <COMPANY_ORG>/email-campaign-platform --private --source=. --remote=origin --push
```

### 2.3 Keep the original repo as upstream

This allows you to continue syncing from the original source if needed.

```powershell
git remote add upstream git@github.com:SaheelYadav/email-campaign-platform.git
```

---

## 3. Environment Variables and Secrets

### 3.1 Required production environment variables

The app and worker use these runtime variables:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `NEXT_PUBLIC_APP_URL`
- `AWS_REGION`
- `AWS_ACCESS_KEY_ID` or `AWS_ACCESS_KEY`
- `AWS_SECRET_ACCESS_KEY`
- `SES_FROM_EMAIL`
- `DEVELOPER_SECRET`
- `ADMIN_DEFAULT_PASSWORD`
- `SQS_QUEUE_NAME` (optional; default: `EmailDispatchQueue`)
- `SES_RATE_PER_SECOND` (optional; default: `10`)
- `LOG_LEVEL` (optional; e.g. `info`, `debug`)
- `PORT` (used by the worker; usually `3001` or host-provided port)
- `NODE_ENV=production`

### 3.2 Important URLs

- `NEXTAUTH_URL`: must match the production app URL (e.g. `https://app.yourcompany.com`)
- `NEXT_PUBLIC_APP_URL`: must match the public app URL used in email tracking and unsubscribe links

### 3.3 Deployment secret storage

- Do not commit `.env` to GitHub.
- Use Hostinger environment variables / secrets for the app service.
- Use Render environment variables / secrets for the worker service.
- If using GitHub Actions in future, store secrets in GitHub repo secrets.

---

## 4. AWS Account Setup

### 4.1 AWS account tasks

1. Create or obtain the company AWS account.
2. Set up IAM user/role for the application with minimum required permissions.
3. Configure AWS region.
4. Enable SES and request production access if sending outside the sandbox.
5. Verify the sender email or domain for SES.
6. Create or provision a PostgreSQL database (RDS, Aurora, Neon DB, or another managed provider).
7. Create an SQS queue or let the worker create it automatically.

### 4.2 Minimum IAM permissions

The app requires permissions for:

- SES send email and verify identities
- SQS queue create/read/send/delete/set-attributes
- Optional: SNS if the app uses AWS webhook/SNS notifications

If using a custom Terraform/Bicep deployment later, the account should also allow role creation.

---

## 5. Local Setup for Company Dev/Test

### 5.1 Clone the company repo locally

```powershell
git clone git@github.com:<COMPANY_ORG>/email-campaign-platform.git
cd email-campaign-platform
npm install
```

### 5.2 Create `.env` locally

Create a `.env` file in the repo root with values for local development:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/email_platform"
NEXTAUTH_SECRET="replace-with-a-secure-secret"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="local-aws-access-key"
AWS_SECRET_ACCESS_KEY="local-aws-secret-key"
SES_FROM_EMAIL="verified@example.com"
DEVELOPER_SECRET="local-dev-secret"
ADMIN_DEFAULT_PASSWORD="admin123"
SQS_QUEUE_NAME="EmailDispatchQueue"
SES_RATE_PER_SECOND="10"
LOG_LEVEL="debug"
PORT="3001"
NODE_ENV="development"
```

### 5.3 Run local validation

```powershell
npm install
npx prisma generate
npx prisma db push
npm run dev
node worker.js
```

`npm run dev` launches the app; `node worker.js` launches the scheduler + queue processor.

---

## 6. Render Deployment Guidance

### 6.1 Why keep the worker on Render

The repo includes a long-running `worker.js` process and `node-cron` scheduler. Render supports background workers better than many shared hosts.

### 6.2 Render services needed

- **Web Service**
  - Build command: `npm install && npm run build`
  - Start command: `npm start`
  - Environment variables: all app secrets + `DATABASE_URL` + AWS creds
  - Health check: app URL

- **Worker Service**
  - Start command: `node worker.js`
  - Environment variables: AWS creds + `NEXT_PUBLIC_APP_URL` + `NEXTAUTH_SECRET` + `DATABASE_URL`
  - Use a free or paid background worker service

### 6.3 Cron note

The current `worker.js` uses `cron.schedule('* * * * *')`, which runs every minute.

If the business requires a 10-minute interval, update it to:

```js
cron.schedule('*/10 * * * *', async () => {
  // ...
})
```

---

## 7. Hostinger Deployment Guidance

### 7.1 Confirm Hostinger plan

The app requires a Node.js runtime and support for a Next.js server app.

Preferred Hostinger plans:
- Hostinger Cloud Startup / Cloud Professional
- Hostinger VPS with Node.js support

If Hostinger does not support your app type, it is safer to host the frontend/backend on Render or AWS App Runner.

### 7.2 Hostinger deployment steps

1. In the company GitHub repo, connect Hostinger Git deployment.
2. Set the repository to deploy from `main`.
3. Set environment variables in Hostinger control panel.
4. Use build command:
   - `npm install && npm run build`
5. Use start command:
   - `npm start`
6. Ensure the selected Node version is compatible with Next.js 16 / React 19.
7. Verify that the public domain matches `NEXT_PUBLIC_APP_URL`.

### 7.3 Important Hostinger caveat

- Hostinger is fine for the web app only if Node support is available.
- Do not use Hostinger for the worker unless it supports separate long-running background processes.
- Keep the worker on Render or AWS if Hostinger cannot run it.

---

## 8. AWS Credentials and Secrets Migration

### 8.1 New AWS credentials

When the company gives you the AWS account, do this:

1. Create a dedicated IAM user or role for the application.
2. Give it SES and SQS permissions only.
3. Create fresh access keys.
4. Store the keys in Hostinger and Render as secrets.

### 8.2 SES setup

- Verify `SES_FROM_EMAIL` or the sending domain in SES.
- Remove SES sandbox restrictions if sending production email.
- Verify `NEXT_PUBLIC_APP_URL` for unsubscribe/tracking links.

### 8.3 SQS setup

The app uses `SQS_QUEUE_NAME` and can auto-create both the queue and dead-letter queue.

If you prefer manual provisioning:

- Create `EmailDispatchQueue`
- Create `EmailDispatchQueue_DLQ`
- Attach a redrive policy with `maxReceiveCount=3`

---

## 9. Post-Deployment Validation

After deployment, verify the following:

- [ ] App loads at production URL
- [ ] Login works using NextAuth
- [ ] API routes return healthy results
- [ ] Worker starts and logs queue activity
- [ ] `worker.js` health endpoint is reachable on its port
- [ ] Emails can be sent from SES using verified sender
- [ ] `NEXT_PUBLIC_APP_URL` correct in email links
- [ ] No `.env` file is committed to Git

### Useful check commands

```powershell
npm run build
npx tsc --noEmit
curl https://<your-domain>/api/health
curl http://<worker-host>:3001
```

---

## 10. Recommended Future Improvements

- Add a `.env.example` file containing keys but no secrets
- Add a `README_DEPLOYMENT.md` for Hostinger/Render specifics
- Add automated GitHub Actions or pipeline for build/deploy
- Add real monitoring and worker alerting

---

## 11. Notes for the company handoff

- Keep the git history intact by pushing the repo into the company GitHub account.
- Do not reuse personal AWS credentials.
- Treat all AWS secrets and NextAuth secrets as production secrets.
- Hostinger should host the web app only; keep the worker on Render if Hostinger cannot run Node background jobs.

---

## 12. Current repo-specific file to review

- `worker.js` (background email dispatch + cron)
- `package.json` (startup scripts and dependencies)
- `lib/next-auth.ts` (auth secret usage)
- `lib/services/email.service.ts` and `lib/services/queue.service.ts` (AWS SES/SQS integration)
- `app/api/create-admin/route.ts` (developer secret and admin password logic)

