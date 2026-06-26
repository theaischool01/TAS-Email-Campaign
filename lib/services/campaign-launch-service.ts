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
  status: "SENT" | "FAILED";
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

      // 5. Paginated Keyset Recipient Processing
      const processedEmails = new Set<string>();
      let lastMemberId: string | null = null;
      let recipientCount = 0;
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
            cursorId: lastMemberId || undefined,
            batchSize: 1000
          }
        );

        if (contacts.length === 0) break;

        const batchMessages: any[] = [];

        for (const contact of contacts) {
          if (contact.status !== "ACTIVE") continue;

          const emailLower = contact.email.trim().toLowerCase();
          if (suppressedSet.has(emailLower) || excludedContactIdsSet.has(contact.id) || processedEmails.has(emailLower)) {
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

          processedEmails.add(emailLower);
          recipientCount++;

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

        lastMemberId = contacts[contacts.length - 1].id;
      }

      if (recipientCount === 0) {
        throw new Error("No active recipients found in the selected lists or segments.");
      }

      // 6. Complete Success State Transition
      await prisma.campaign.update({
        where: { id: campaignId },
        data: {
          status: "SENT",
          recipientCount,
          updatedAt: new Date(),
        },
      });

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

      logger.info({ campaignId, recipientCount }, "CAMPAIGN_LAUNCH_SERVICE: Launch completed successfully");
      return {
        success: true,
        recipientCount,
        status: "SENT",
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
