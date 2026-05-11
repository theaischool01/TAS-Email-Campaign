# Email Campaign Platform - API Documentation

## 📡 Base URL
The production API is hosted at:
`https://email-campaign-platform-pi.vercel.app/api`

For local development:
`http://localhost:3000/api`

---

## 🔐 Authentication
The platform uses **NextAuth.js v4** for secure authentication. 

### Flow:
1. **Register**: POST to `/api/auth/register` with `name`, `email`, `password`.
2. **Login**: POST your credentials to `/api/auth/callback/credentials`.
3. **Session**: The server returns an HTTP-only session cookie.
4. **Authorization**: All private endpoints check this session.
5. **RBAC**: Access is restricted based on the user's role (`SUPER_ADMIN`, `CAMPAIGN_MANAGER`, `VIEWER`).

---

## 📁 Postman Collection
A professional Postman collection is provided in `email-campaign-platform-postman.json`.

### How to Import:
1. Open Postman.
2. Click **Import**.
3. Select the `email-campaign-platform-postman.json` file.
4. Set up your **Environment Variables** (see below).

### Environment Variables:
| Variable | Description |
|----------|-------------|
| `base_url` | `https://email-campaign-platform-pi.vercel.app/api` |
| `campaign_id` | ID of a specific campaign (e.g., `cm123...`) |
| `contact_id` | ID of a specific contact (e.g., `cj456...`) |
| `template_id` | ID of an email template |
| `list_id` | ID of a contact list |

---

## 🚀 Key Endpoints

### 📧 Campaigns
- **GET `/campaigns`**: List all campaigns with pagination and filters.
- **POST `/campaigns`**: Create a new campaign draft.
- **POST `/campaigns/{{campaign_id}}/launch`**: Dispatch a campaign to its recipients.
- **POST `/campaigns/{{campaign_id}}/test`**: Send a test email to a specific address.
- **GET `/campaigns/{{campaign_id}}/status`**: Monitor real-time sending progress.

### 👥 Contacts & Lists
- **GET `/contacts`**: List all contacts.
- **POST `/contacts/import`**: Bulk import contacts via CSV (Multipart/Form-Data).
- **GET `/contacts/lists`**: List all contact lists.
- **GET `/contacts/lists/{{list_id}}/contacts`**: List contacts within a specific list.
- **POST `/segments`**: Create dynamic segments based on criteria.

### 🎨 Templates
- **GET `/templates`**: List available email templates.
- **POST `/templates`**: Save a new MJML/HTML template.
- **GET `/templates/seed`**: (Admin/Owner) Seed default system templates.

### 📊 Analytics & Tracking
- **GET `/analytics/dashboard`**: High-level platform statistics.
- **GET `/analytics/campaigns/{{campaign_id}}`**: Detailed performance for a specific campaign.
- **GET `/track/open/{{campaign_id}}/{{contact_id}}`**: Tracking pixel endpoint (Public).
- **GET `/track/click/{{campaign_id}}/{{contact_id}}?url=...`**: Link redirect tracking (Public).

### ⚙️ Settings
- **GET `/settings/org`**: (Super Admin) Fetch organization and AWS SES settings.
- **POST `/settings/org`**: (Super Admin) Update organization and AWS SES settings.

### 🔔 Webhooks
- **POST `/webhooks/ses`**: Handles AWS SES event publishing (Bounces, Complaints).

---

## 🛡️ Public vs Private APIs
- **Private**: Most endpoints require a valid session cookie.
- **Public**: 
  - `/api/auth/register` (New user registration)
  - `/api/track/*` (Tracking endpoints)
  - `/api/unsubscribe` (One-click unsubscribe)
  - `/api/auth/session` (Session check)

---

## 📄 RFC 8058 Compliance
All outgoing emails include the following headers for one-click unsubscription:
- `List-Unsubscribe: <https://.../api/unsubscribe?uid=...>`
- `List-Unsubscribe-Post: List-Unsubscribe=One-Click`
