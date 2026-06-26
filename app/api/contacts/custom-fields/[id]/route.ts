import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/next-auth";
import { prisma as prismaClient } from "@/app/lib/prisma";
import { PatchCustomFieldSchema } from "@/lib/custom-fields/schema";
import { generateCustomFieldKey } from "@/lib/custom-fields/key-generator";

const prisma = prismaClient as any;

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the custom field to verify ownership
    const customField = await prisma.contactCustomField.findUnique({
      where: { id }
    });

    if (!customField) {
      return NextResponse.json({ error: "Custom field not found" }, { status: 404 });
    }

    if (customField.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const body = await request.json();
    const parsed = PatchCustomFieldSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const result = await prisma.$transaction(async (tx: any) => {
      let displayName = customField.displayName;

      if (data.displayName !== undefined && data.displayName.trim() !== customField.displayName) {
        const candidateName = data.displayName.trim();
        const candidateKey = generateCustomFieldKey(candidateName);

        // Check for duplicate displayName (case-insensitive) for the same tenant
        const duplicateName = await tx.contactCustomField.findFirst({
          where: {
            userId: session.user.id,
            displayName: { equals: candidateName, mode: "insensitive" },
            id: { not: id }
          }
        });

        if (duplicateName) {
          return { error: `A custom field named '${candidateName}' already exists in your workspace.`, status: 409 };
        }

        // Also check if candidate key collides with other keys (but we do NOT update customField.key)
        const duplicateKey = await tx.contactCustomField.findFirst({
          where: {
            userId: session.user.id,
            key: candidateKey,
            id: { not: id }
          }
        });

        if (duplicateKey) {
          return { error: `The name '${candidateName}' generates a key conflict with an existing field.`, status: 409 };
        }

        displayName = candidateName;
      }

      // Perform update (type, key, and userId are immutable)
      const updatedField = await tx.contactCustomField.update({
        where: { id },
        data: {
          displayName,
          isRequired: data.isRequired !== undefined ? data.isRequired : customField.isRequired,
          options: data.options !== undefined ? JSON.stringify(data.options) : customField.options,
          displayOrder: data.displayOrder !== undefined ? data.displayOrder : customField.displayOrder,
          isArchived: data.isArchived !== undefined ? data.isArchived : customField.isArchived,
          updatedAt: new Date()
        }
      });

      return { success: true, data: updatedField };
    });

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    // Return the response, parsing the options JSON string back to array
    const returnedData = {
      ...result.data,
      options: result.data.options ? JSON.parse(result.data.options) : null
    };

    return NextResponse.json(returnedData);
  } catch (error: any) {
    console.error("Error updating custom field:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update custom field" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find the custom field to verify ownership and get key
    const customField = await prisma.contactCustomField.findUnique({
      where: { id }
    });

    if (!customField) {
      return NextResponse.json({ error: "Custom field not found" }, { status: 404 });
    }

    if (customField.userId !== session.user.id) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // 1. Check ContactFieldValue dependencies
    const valueCount = await prisma.contactFieldValue.count({
      where: { fieldId: id }
    });
    if (valueCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete this field because it is currently in use." },
        { status: 409 }
      );
    }

    // 2. Future placeholders: check Segments
    const segments = await prisma.segment.findMany({
      where: { userId: session.user.id }
    });
    const isUsedInSegment = segments.some((seg: any) => {
      if (!seg.criteria) return false;
      const str = typeof seg.criteria === "string" ? seg.criteria : JSON.stringify(seg.criteria);
      return str.includes(`"custom.${customField.key}"`) || str.includes(`"field":"${customField.key}"`);
    });
    if (isUsedInSegment) {
      return NextResponse.json(
        { error: "Cannot delete this field because it is currently in use." },
        { status: 409 }
      );
    }

    // 3. Future placeholders: check Campaigns
    // (In case campaign includedTags/excludedTags or name contain template field mappings or future keys)
    const campaigns = await prisma.campaign.findMany({
      where: { createdBy: session.user.id }
    });
    const isUsedInCampaign = campaigns.some((camp: any) => {
      const subjectMatch = camp.subject && camp.subject.includes(`{{custom.${customField.key}}}`);
      return subjectMatch;
    });
    if (isUsedInCampaign) {
      return NextResponse.json(
        { error: "Cannot delete this field because it is currently in use." },
        { status: 409 }
      );
    }

    // 4. Future placeholders: check Templates
    const templates = await prisma.emailTemplate.findMany({
      where: { createdBy: session.user.id }
    });
    const isUsedInTemplate = templates.some((temp: any) => {
      const htmlMatch = temp.html && temp.html.includes(`{{custom.${customField.key}}}`);
      return htmlMatch;
    });
    if (isUsedInTemplate) {
      return NextResponse.json(
        { error: "Cannot delete this field because it is currently in use." },
        { status: 409 }
      );
    }

    // No dependencies: execute hard delete
    await prisma.contactCustomField.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Custom field deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting custom field:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete custom field" },
      { status: 500 }
    );
  }
}
