import { prisma as prismaClient } from "@/app/lib/prisma";
import logger from "@/lib/logger";
import { QueueService } from "@/lib/services/queue.service";
import { TrackedLinkService } from "@/lib/email/tracked-link-service";
import { CampaignAudienceService } from "@/lib/services/campaign-audience.service";

const prisma = prismaClient as any;

export interface LaunchOptions {
  campaignId: string;
  triggeredBy: "MANUAL" | "SCHEDULED";
}

export interface LaunchResult {
  success: boolean;
  recipientCount: number;
  status: "SENDING" | "SENT" | "FAILED";
  error?: string;
}

export class CampaignLaunchService {
  static async launchCampaign(options: LaunchOptions): Promise<LaunchResult> {
    const { campaignId, triggeredBy } = options;
    logger.info({ campaignId, triggeredBy }, "CAMPAIGN_LAUNCH_SERVICE: Initiating launch");

    // 1. Atomic Status Lock Transition
    const expectedStatus = triggeredBy === "MANUAL" ? "DRAFT" : "SCHEDULED";
    const lockUpdate = await prisma.campaign.updateMany({
      where: {
        id: campaignId,
        status: expectedStatus,
      },
      data: {
        status: "SENDING",
        sentAt: new Date(),
        updatedAt: new Date(),
        totalSent: 0,
        totalOpened: 0,
        totalClicked: 0,
        totalDelivered: 0,
        uniqueOpens: 0,
        totalOpens: 0,
        uniqueClicks: 0,
        totalClicks: 0,
        totalBounced: 0,
        totalComplained: 0,
        totalFailed: 0,
        totalUnsubscribed: 0
      },
    });

    if (lockUpdate.count === 0) {
      logger.warn({ campaignId, expectedStatus }, "CAMPAIGN_LAUNCH_SERVICE: Lock failed, campaign status mismatch");
      return {
        success: false,
        recipientCount: 0,
        status: "FAILED",
        error: `Campaign cannot be launched. Expected status to be ${expectedStatus}.`,
      };
    }

    try {
      // Fetch complete campaign details
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        include: {
          recipientLists: true,
          recipientSegments: {
            include: { segment: true },
          },
          excludedLists: true,
          template: {
            select: { id: true, name: true, html: true },
          },
        },
      });

      if (!campaign) {
        throw new Error("Campaign record not found.");
      }

      // 2. Validate campaign requirements
      if (!campaign.subject) {
        throw new Error("Campaign must have a subject before launching.");
      }

      let templateHtml = campaign.template?.html;
      if (!templateHtml && campaign.templateId) {
        const directTemplate = await prisma.emailTemplate.findUnique({
          where: { id: campaign.templateId },
          select: { html: true }
        });
        if (directTemplate?.html) {
          templateHtml = directTemplate.html;
        }
      }

      if (!templateHtml) {
        throw new Error("Campaign template has no HTML content.");
      }

      // Pre-extract and insert unique links into the tracked link registry to optimize worker operations
      await TrackedLinkService.prepareCampaignLinks(campaign.id, templateHtml);

      const targetListIds = (campaign.recipientLists || []).map((rl: any) => rl.contactListId);
      const targetSegments = (campaign.recipientSegments || []).map((rs: any) => rs.segment).filter(Boolean);

      if (targetListIds.length === 0 && targetSegments.length === 0) {
        throw new Error("Campaign must have at least one recipient list or segment before launching.");
      }

      // 3. Resolve Exclusions, Suppressions
      const excludedContactListIds = (campaign.excludedLists || []).map((el: any) => el.contactListId);
      const excludedContactIdsSet = new Set<string>();
      if (excludedContactListIds.length > 0) {
        const excludedMembers = await prisma.contactListMember.findMany({
          where: { contactListId: { in: excludedContactListIds } },
          select: { contactId: true },
        });
        excludedMembers.forEach((m: any) => excludedContactIdsSet.add(m.contactId));
      }

      const suppressedEmails = await prisma.suppressionList.findMany({
        where: { userId: campaign.createdBy },
        select: { email: true }
      });
      const suppressedSet = new Set(suppressedEmails.map((s: any) => s.email.trim().toLowerCase()));

      const includedTagsStr = (campaign.includedTags || "").trim();
      const includedTags = includedTagsStr
        ? includedTagsStr.split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean)
        : [];

      const excludedTagsStr = (campaign.excludedTags || "").trim();
      const excludedTags = excludedTagsStr
        ? excludedTagsStr.split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean)
        : [];

      // PASS 1: Calculate precise deterministic recipientCount
      const processedEmailsPass1 = new Set<string>();
      let lastMemberIdPass1: string | null = null;
      let recipientCount = 0;

      while (true) {
        const contacts = await CampaignAudienceService.streamRecipients(
          campaign.createdBy,
          {
            listIds: targetListIds,
            segments: targetSegments,
            includedTags,
            excludedTags,
            audienceFilters: campaign.audienceFilters || undefined
          },
          {
            cursorId: lastMemberIdPass1 || undefined,
            batchSize: 1000
          }
        );

        if (contacts.length === 0) break;

        for (const contact of contacts) {
          if (contact.status !== "ACTIVE") continue;

          const emailLower = contact.email.trim().toLowerCase();
          if (suppressedSet.has(emailLower) || excludedContactIdsSet.has(contact.id) || processedEmailsPass1.has(emailLower)) {
            continue;
          }

          processedEmailsPass1.add(emailLower);
          recipientCount++;
        }

        lastMemberIdPass1 = contacts[contacts.length - 1].id;
      }

      if (recipientCount === 0) {
        throw new Error("No active recipients found in the selected lists or segments.");
      }

      // Persist final mathematically guaranteed recipientCount BEFORE any SQS messages exist
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          recipientCount,
          updatedAt: new Date(),
        },
      });

      // PASS 2: Construct payloads and stream to SQS
      const processedEmailsPass2 = new Set<string>();
      let lastMemberIdPass2: string | null = null;
      let enqueuedCount = 0;

      while (true) {
        const contacts = await CampaignAudienceService.streamRecipients(
          campaign.createdBy,
          {
            listIds: targetListIds,
            segments: targetSegments,
            includedTags,
            excludedTags,
            audienceFilters: campaign.audienceFilters || undefined
          },
          {
            cursorId: lastMemberIdPass2 || undefined,
            batchSize: 1000
          }
        );

        if (contacts.length === 0) break;

        const batchMessages: any[] = [];

        for (const contact of contacts) {
          if (contact.status !== "ACTIVE") continue;

          // Prevent enqueueing more than the Pass 1 count if audience grew between passes
          if (enqueuedCount + batchMessages.length >= recipientCount) {
             break;
          }

          const emailLower = contact.email.trim().toLowerCase();
          if (suppressedSet.has(emailLower) || excludedContactIdsSet.has(contact.id) || processedEmailsPass2.has(emailLower)) {
            continue;
          }

          const customFields: Record<string, any> = {};
          if (contact.customFieldValues && Array.isArray(contact.customFieldValues)) {
            for (const val of contact.customFieldValues) {
              if (!val.customField) continue;
              const key = val.customField.key;
              let value: any = null;
              if (val.textValue !== null && val.textValue !== undefined) {
                value = val.textValue;
              } else if (val.numberValue !== null && val.numberValue !== undefined) {
                value = val.numberValue;
              } else if (val.dateValue !== null && val.dateValue !== undefined) {
                value = val.dateValue;
              } else if (val.booleanValue !== null && val.booleanValue !== undefined) {
                value = val.booleanValue;
              } else if (val.jsonValue !== null && val.jsonValue !== undefined) {
                try {
                  value = JSON.parse(val.jsonValue);
                } catch (e) {
                  value = null;
                }
              }
              customFields[key] = value;
            }
          }

          processedEmailsPass2.add(emailLower);

          batchMessages.push({
            campaignId: campaign.id,
            userId: campaign.createdBy,
            recipient: {
              email: contact.email,
              firstName: contact.firstName || undefined,
              lastName: contact.lastName || undefined,
              contactId: contact.id || undefined,
              company: contact.company || undefined,
              customFields
            }
          });
        }

        if (batchMessages.length > 0) {
          await QueueService.enqueueBatch(batchMessages);
          enqueuedCount += batchMessages.length;
        }
        
        if (enqueuedCount >= recipientCount) {
           break;
        }

        lastMemberIdPass2 = contacts[contacts.length - 1].id;
      }
      
      // Safety guarantee: If audience shrank, worker needs the missing messages to complete.
      if (enqueuedCount < recipientCount) {
         const missingCount = recipientCount - enqueuedCount;
         const dummyMessages = Array.from({ length: missingCount }).map(() => ({
            campaignId,
            userId: campaign.createdBy,
            recipient: { email: 'dummy@system.local' },
            isDummyCompletionMessage: true
         }));
         // Enqueue dummies in batches of 100
         for (let i = 0; i < dummyMessages.length; i += 100) {
            await QueueService.enqueueBatch(dummyMessages.slice(i, i + 100));
         }
      }

      await prisma.campaignActivityLog.create({
        data: {
          campaignId,
          actorId: triggeredBy === "MANUAL" ? campaign.createdBy : "system-scheduler",
          action: "CAMPAIGN_LAUNCHED",
          metadata: {
            sentAt: new Date().toISOString(),
            recipientCount,
            triggeredBy,
          },
        },
      });

      logger.info({ campaignId, recipientCount }, "CAMPAIGN_LAUNCH_SERVICE: All recipients enqueued — campaign remains SENDING until worker completes delivery");
      return {
        success: true,
        recipientCount,
        status: "SENDING",
      };
    } catch (launchError: any) {
      logger.error({ campaignId, error: launchError.message }, "CAMPAIGN_LAUNCH_SERVICE: Critical failure during execution");

      // 7. Failure State Transition
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: "FAILED",
          updatedAt: new Date(),
        },
      });

      await prisma.campaignActivityLog.create({
        data: {
          campaignId,
          actorId: triggeredBy === "MANUAL" ? "user" : "system-scheduler",
          action: "CAMPAIGN_FAILED",
          metadata: {
            reason: launchError.message || "Unknown error",
            failedAt: new Date().toISOString(),
            triggeredBy,
          },
        },
      });

      return {
        success: false,
        recipientCount: 0,
        status: "FAILED",
        error: launchError.message || "Unknown error",
      };
    }
  }
}
