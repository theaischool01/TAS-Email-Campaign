export type FAQCategory = 
  | "getting-started"
  | "campaigns"
  | "templates"
  | "contacts"
  | "deliverability"
  | "settings";

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: FAQCategory;
}

export const FAQ_DATA: FAQItem[] = [
  // Getting Started
  {
    id: "gs-forgot-password",
    category: "getting-started",
    question: "What should I do if the Forgot Password link is not working?",
    answer: "The Forgot Password option is currently a visual placeholder and is not wired up to an automatic reset flow. If you need to reset your password or have lost access to your account, please contact your workspace administrator to reset your credentials manually."
  },
  {
    id: "gs-registration",
    category: "getting-started",
    question: "How do new users register and access the platform?",
    answer: "First-time users must be invited or created by an administrator in the system. Registering a new account through the sign up page creates a standalone user account, but it does not automatically link you to an existing organization workspace, which must be configured separately after registration."
  },
  {
    id: "gs-metrics-updating",
    category: "getting-started",
    question: "Why can I not filter my dashboard metrics by date range?",
    answer: "The performance metrics displayed on the main dashboard show lifetime aggregate totals for your workspace. There is currently no date range filter widget on this page, so the statistics represent all-time data since your account was created."
  },
  {
    id: "gs-support-center-placeholders",
    category: "getting-started",
    question: "Why do the links in the Support Center widget not navigate anywhere?",
    answer: "The quick resource guides, video tutorials, and system status links in the Support Center dashboard panel currently point to placeholder addresses. While you can click them, they do not link to external pages yet, though you can still use the direct email and phone support buttons."
  },

  // Campaigns
  {
    id: "camp-draft-sending",
    category: "campaigns",
    question: "Why has my saved campaign not started sending?",
    answer: "Saving a campaign sets its status to draft, but does not queue it for delivery. You must step through the campaign wizard and manually choose to either send the campaign immediately or schedule it for a specific future date and time to start the delivery process."
  },
  {
    id: "camp-pause-dispatched",
    category: "campaigns",
    question: "Can I pause or stop a campaign once I click send now?",
    answer: "No, there is no mid-campaign pause or stop function for campaigns that are dispatched using the send now option. Once you confirm and trigger the immediate send, the delivery queue begins processing immediately and the operation cannot be canceled."
  },
  {
    id: "camp-recipient-dedup",
    category: "campaigns",
    question: "Will a contact receive duplicate emails if they belong to multiple selected lists?",
    answer: "No, the platform automatically applies recipient deduplication at send time. If a contact is present on more than one list selected for a campaign, the system identifies the duplicate email and ensures the contact receives only a single copy of the message."
  },
  {
    id: "camp-stats-delay",
    category: "campaigns",
    question: "Why are my campaign open and click rates showing zero right after sending?",
    answer: "Campaign performance statistics are calculated in real-time as events are received and processed by our analytics worker. There can be a slight processing delay immediately after dispatching a campaign, so stats will populate gradually as recipients interact with your emails."
  },

  // Templates
  {
    id: "temp-system-readonly",
    category: "templates",
    question: "Why can I not edit system templates directly in the library?",
    answer: "System templates are pre-built, read-only layouts provided to all users. To edit one, you must select the template and click Use Template, which automatically duplicates the layout into your personal library where you can fully customize and save your changes."
  },
  {
    id: "temp-html-warning",
    category: "templates",
    question: "What happens if I switch to raw HTML mode in the block editor?",
    answer: "Switching to raw HTML mode lets you edit the template code directly, but manual changes to the HTML structure can disrupt the layout structure. The editor will display a warning because these manual edits might not be fully reversible to visual blocks when you return to visual mode."
  },
  {
    id: "temp-card-preview-discrepancy",
    category: "templates",
    question: "Why does the miniature card preview look slightly different from the editor?",
    answer: "The small preview thumbnail in the templates library is rendered inside a scaled-down iframe. This scale transformation can occasionally cause minor rendering differences or text wrapping issues that do not reflect the actual full-size template rendering."
  },
  {
    id: "temp-editor-types",
    category: "templates",
    question: "Why do some templates open in different editors?",
    answer: "The platform features two distinct editors that load based on the template data structure. Templates that contain block-based JSON data open in the visual drag-and-drop Block Editor, whereas raw HTML-only templates open in the GrapesJS Professional Editor."
  },

  // Contacts
  {
    id: "cont-list-deletion",
    category: "contacts",
    question: "Does deleting a contact list remove the contacts from my database?",
    answer: "No, deleting a contact list only deletes the list grouping itself. The contacts that belonged to that list remain in your global database and can still be accessed and managed under the All Contacts tab."
  },
  {
    id: "cont-visible-columns",
    category: "contacts",
    question: "Why do my customized visible columns in the contacts table reset on other devices?",
    answer: "Your column visibility preferences and table density settings are saved locally in your browser storage. Because they are not synced to the server, logging in from a different browser or device will reset the table layout to default settings."
  },
  {
    id: "cont-tags-format",
    category: "contacts",
    question: "How should I structure and format tags on my contacts?",
    answer: "Tags on contacts are stored as simple comma-separated text strings directly on the contact record. There is no separate structured tag manager, so filtering and searching is performed as a direct text match against the tag field."
  },
  {
    id: "cont-filters-reset",
    category: "contacts",
    question: "Why did the contact table filters I built disappear when I left the page?",
    answer: "The advanced Filter Builder creates temporary, session-level filters that are cleared when you navigate away from the contacts page. If you want to save a set of rules for future use, you should create a dynamic Segment instead, which will persist across sessions."
  },

  // Deliverability
  {
    id: "deliv-domain-errors",
    category: "deliverability",
    question: "Why is my campaign failing to send with sender address errors?",
    answer: "All campaigns require a sender email address that belongs to a verified sending domain configured in your Settings. If the sending domain has not been verified with the appropriate DNS records, the platform will block the campaign from sending."
  },
  {
    id: "deliv-open-tracking",
    category: "deliverability",
    question: "Why might my campaign open rates be higher or lower than actual reads?",
    answer: "Open rates are tracked using a tiny, invisible image pixel embedded in the email. Certain email clients block images by default or pre-load them for privacy, such as Apple Mail Privacy Protection, which can cause open tracking statistics to deviate from actual reader activity."
  },
  {
    id: "deliv-click-tracking",
    category: "deliverability",
    question: "How does link tracking work and why are clicks sometimes double-counted?",
    answer: "The system tracks engagement by wrapping all links in your email with a tracking redirect URL. Some security software and spam filters pre-scan these wrapped links before delivering the email to the recipient's inbox, which can register as additional clicks in your analytics."
  },
  {
    id: "deliv-bounces-diff",
    category: "deliverability",
    question: "What is the difference between a hard bounce and a soft bounce?",
    answer: "A hard bounce occurs when an email is permanently rejected because the recipient address is invalid or non-existent, triggering automatic suppression. A soft bounce is a temporary delivery issue, such as a full inbox or temporary server outage, where delivery may be retried."
  },

  // Settings
  {
    id: "set-timezone-scheduling",
    category: "settings",
    question: "How does the organization timezone setting affect my scheduled sends?",
    answer: "The timezone configured in your Organization Settings applies to all campaign scheduling operations workspace-wide. It does not adjust automatically to your local browser timezone, so you must verify the default workspace timezone when scheduling campaigns."
  },
  {
    id: "set-support-center-sync",
    category: "settings",
    question: "Why do my organization settings not update the contact info in the Support Center?",
    answer: "The Support Center widget displayed on the dashboard contains static hardcoded contact details. Changing your office address, support phone, or email in the Organization Settings will not update the information shown in the support panel."
  },
  {
    id: "set-suppression-readonly",
    category: "settings",
    question: "Can I remove a contact from the suppression list myself?",
    answer: "The Suppression List page in Settings is a read-only server-rendered view. You cannot manually remove or edit suppressed contacts from this page; any re-subscription must be completed by the contact using the public Preferences Center."
  },
  {
    id: "set-logo-uploading",
    category: "settings",
    question: "How do I add or update my organization logo?",
    answer: "The Organization Settings panel does not support direct image file uploads for logos. You must upload your logo image to an external hosting service first and then paste the publicly accessible image URL into the Logo URL field."
  }
];
