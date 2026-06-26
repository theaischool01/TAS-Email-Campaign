import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/next-auth";
import { prisma as prismaClient } from "@/app/lib/prisma";
import { CampaignAudienceService } from "@/lib/services/campaign-audience.service";

const prisma = prismaClient as any;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: campaignId } = await params;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Load campaign details
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, createdBy: userId },
      include: {
        recipientLists: true,
        recipientSegments: {
          include: { segment: true }
        }
      }
    });

    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    const listIds = (campaign.recipientLists || []).map((rl: any) => rl.contactListId);
    const segments = (campaign.recipientSegments || []).map((rs: any) => rs.segment).filter(Boolean);

    const includedTagsStr = (campaign.includedTags || "").trim();
    const includedTags = includedTagsStr
      ? includedTagsStr.split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      : [];

    const excludedTagsStr = (campaign.excludedTags || "").trim();
    const excludedTags = excludedTagsStr
      ? excludedTagsStr.split(",").map((t: string) => t.trim().toLowerCase()).filter(Boolean)
      : [];

    // Stream first 20 recipients using CampaignAudienceService
    const rawContacts = await CampaignAudienceService.streamRecipients(
      userId,
      {
        listIds,
        segments,
        includedTags,
        excludedTags,
        audienceFilters: campaign.audienceFilters || undefined
      },
      {
        batchSize: 20
      }
    );

    // Format response to match spec
    const contacts = rawContacts.map((contact: any) => {
      const flatTags = (contact.contactTags || []).map((t: any) => t.tag?.name).filter(Boolean);
      return {
        id: contact.id,
        firstName: contact.firstName || "",
        lastName: contact.lastName || "",
        email: contact.email,
        tags: flatTags
      };
    });

    return NextResponse.json({ contacts });
  } catch (error: any) {
    console.error("GET /api/campaigns/[id]/preview error:", error);
    return NextResponse.json(
      { error: "Failed to get campaign preview", details: error.message },
      { status: 500 }
    );
  }
}
