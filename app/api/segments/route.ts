import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/next-auth";
import { prisma as prismaClient } from "@/app/lib/prisma";
import { SegmentCriteriaSchema } from "@/lib/segments/schema";
import { validateCriteriaNode, CustomFieldMeta } from "@/lib/segments/validator";

const prisma = prismaClient as any;

// GET /api/segments - List all segments
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const segments = await prisma.segment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      success: true,
      data: segments
    });
  } catch (error: any) {
    console.error("GET /api/segments error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/segments - Create a new segment
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { name, description, criteria } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // 1. Zod criteria structure check
    if (criteria) {
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
    }

    const segment = await prisma.segment.create({
      data: {
        name,
        description,
        criteria: criteria || null,
        userId
      }
    });

    return NextResponse.json({
      success: true,
      data: segment
    });
  } catch (error: any) {
    console.error("POST /api/segments error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
