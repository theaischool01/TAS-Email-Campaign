import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/next-auth";
import { CampaignAudienceService } from "@/lib/services/campaign-audience.service";
import { SegmentCriteriaSchema } from "@/lib/segments/schema";
import { z } from "zod";

const estimateSchema = z.object({
  listIds: z.array(z.string()).optional(),
  includedTags: z.array(z.string()).optional(),
  segmentId: z.string().optional(),
  segmentIds: z.array(z.string()).optional(),
  excludedTags: z.array(z.string()).optional(),
  audienceFilters: SegmentCriteriaSchema.optional().nullable()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const validatedData = estimateSchema.parse(body);
    const { listIds = [], includedTags = [], segmentId, segmentIds = [], excludedTags = [], audienceFilters } = validatedData;

    const resolvedSegmentIds = [...segmentIds];
    if (segmentId && !resolvedSegmentIds.includes(segmentId)) {
      resolvedSegmentIds.push(segmentId);
    }

    // Call shared service
    const finalRecipients = await CampaignAudienceService.getEstimateCount(userId, {
      listIds,
      includedTags,
      segmentIds: resolvedSegmentIds,
      excludedTags,
      audienceFilters: audienceFilters || undefined
    });

    return NextResponse.json({
      totalContacts: finalRecipients,
      excludedContacts: 0,
      finalRecipients
    });
  } catch (error: any) {
    console.error("Error estimating recipients:", error);
    return NextResponse.json(
      { error: "Failed to estimate recipients", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
