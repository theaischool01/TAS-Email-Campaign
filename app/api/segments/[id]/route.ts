import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/next-auth";
import { prisma as prismaClient } from "@/app/lib/prisma";
import { SegmentCriteriaSchema } from "@/lib/segments/schema";
import { validateCriteriaNode, CustomFieldMeta } from "@/lib/segments/validator";

const prisma = prismaClient as any;

// GET /api/segments/[id] - Get a single segment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const segment = await prisma.segment.findFirst({
      where: { id, userId: session.user.id }
    });

    if (!segment) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: segment
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH /api/segments/[id] - Update a segment
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Check ownership
    const existing = await prisma.segment.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    const body = await request.json();
    const { name, description, criteria } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    if (criteria !== undefined) {
      // 1. Zod criteria check
      const parsed = SegmentCriteriaSchema.safeParse({ criteria });
      if (!parsed.success) {
        return NextResponse.json(
          { error: "Invalid criteria structure", details: parsed.error.format() },
          { status: 400 }
        );
      }

      // Load custom fields metadata once
      const dbCustomFields = await prisma.contactCustomField.findMany({
        where: { userId }
      });

      const fieldRegistry = new Map<string, CustomFieldMeta>(
        dbCustomFields.map((cf: any) => [
          cf.key.toLowerCase(),
          { id: cf.id, key: cf.key, type: cf.type }
        ])
      );

      // 2. Validate operator compatibility
      try {
        validateCriteriaNode(criteria, fieldRegistry);
      } catch (valErr: any) {
        return NextResponse.json({ error: valErr.message }, { status: 400 });
      }

      updateData.criteria = criteria;
    }

    const updated = await prisma.segment.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      data: updated
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/segments/[id] - Delete a segment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const userId = session.user.id;

    // Check ownership
    const existing = await prisma.segment.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Segment not found" }, { status: 404 });
    }

    // 4. Segment Deletion Safety: Check references in campaigns
    const references = await prisma.campaignRecipientSegment.findFirst({
      where: { segmentId: id }
    });

    if (references) {
      return NextResponse.json(
        { error: "This segment is currently used by one or more campaigns and cannot be deleted." },
        { status: 409 }
      );
    }

    // Safe deletion is allowed
    await prisma.segment.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: "Segment deleted successfully"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
