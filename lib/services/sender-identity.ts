export interface SenderIdentity {
  fromName: string;
  fromEmail: string;
  replyToEmail: string | null;
}

export function resolveSenderIdentity(
  campaign: { senderName?: string | null; senderEmail?: string | null; replyToEmail?: string | null }
): SenderIdentity {
  const fromName =
    campaign.senderName?.trim()
      ? campaign.senderName
      : process.env.DEFAULT_FROM_NAME?.trim()
        ? process.env.DEFAULT_FROM_NAME
        : "THE AI SCHOOL";

  const fromEmail =
    campaign.senderEmail?.trim()
      ? campaign.senderEmail
      : process.env.DEFAULT_FROM_EMAIL?.trim()
        ? process.env.DEFAULT_FROM_EMAIL
        : process.env.SES_FROM_EMAIL?.trim()
          ? process.env.SES_FROM_EMAIL
          : "official@campaign.theaischool.co";

  const replyToEmail =
    campaign.replyToEmail?.trim()
      ? campaign.replyToEmail
      : null;

  return {
    fromName,
    fromEmail,
    replyToEmail
  };
}
