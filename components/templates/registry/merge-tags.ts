export interface MergeTag {
  label: string
  value: string
  description?: string
}

export interface MergeTagCategory {
  id: string
  label: string
  tags: MergeTag[]
}

export const SYSTEM_MERGE_TAGS: MergeTagCategory[] = [
  {
    id: "personal",
    label: "Personal Information",
    tags: [
      { label: "First Name", value: "{{first_name}}", description: "Recipient's first name" },
      { label: "Last Name", value: "{{last_name}}", description: "Recipient's last name" },
      { label: "Email Address", value: "{{email}}", description: "Recipient's email address" },
      { label: "Company", value: "{{company}}", description: "Recipient's company name" },
      { label: "Phone Number", value: "{{phone}}", description: "Recipient's phone number" },
      { label: "City", value: "{{city}}", description: "Recipient's city" }
    ]
  },
  {
    id: "campaign",
    label: "Campaign Details",
    tags: [
      { label: "Campaign Name", value: "{{campaign_name}}", description: "The name of this campaign" },
      { label: "Subject Line", value: "{{subject}}", description: "The subject line of this email" },
      { label: "Current Date", value: "{{current_date}}", description: "The date of sending" }
    ]
  },
  {
    id: "links",
    label: "Links & Toggles",
    tags: [
      { label: "Unsubscribe URL", value: "{{unsubscribe_url}}", description: "Unsubscribe link (required)" },
      { label: "View Online URL", value: "{{view_online}}", description: "Link to view the email in a browser" }
    ]
  }
]
