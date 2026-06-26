import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/next-auth";
import { prisma as prismaClient } from "@/app/lib/prisma";
import { SegmentCriteriaSchema } from "@/lib/segments/schema";
import { validateCriteriaNode, CustomFieldMeta } from "@/lib/segments/validator";
import { SegmentQueryCompiler } from "@/lib/segments/compiler";

const prisma = prismaClient as any;

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { criteria } = body;

    if (!criteria) {
      return NextResponse.json({ count: 0 });
    }

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

    // 3. Compile SQL
    let { sql, values } = SegmentQueryCompiler.compile(userId, criteria, fieldRegistry, {
      mode: "COUNT"
    });

    // Exclude suppressed contacts from calculation
    sql += ` AND c.email NOT IN (SELECT email FROM suppression_list WHERE "userId" = $1)`;

    // Run query
    const rawResult = await prisma.$queryRawUnsafe(sql, ...values);
    const count = Number(rawResult[0]?.count || 0);

    return NextResponse.json({ count });
  } catch (error: any) {
    console.error("POST /api/segments/estimate error:", error);
    return NextResponse.json({ error: error.message || "Failed to estimate segment" }, { status: 500 });
  }
}
